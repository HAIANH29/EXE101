package be.exe.payment.service.impl;

import be.exe.booking.dto.response.BookingSummaryResponse;
import be.exe.booking.service.BookingService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.payment.domain.Payment;
import be.exe.payment.domain.PaymentStatus;
import be.exe.payment.domain.PaymentType;
import be.exe.payment.domain.PaymentProvider;
import be.exe.payment.config.BillingProperties;
import be.exe.payment.domain.event.PaymentCompletedEvent;
import be.exe.payment.dto.response.PaymentResponse;
import be.exe.payment.dto.response.PaidUserResponse;
import be.exe.payment.repository.PaymentRepository;
import be.exe.payment.sepay.SePayQrGenerator;
import be.exe.payment.sepay.SepayWebhookRequest;
import be.exe.payment.service.PaymentService;
import be.exe.salon.service.SalonService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.Objects;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);
    private static final String REFERENCE_PREFIX = "DH";

    private final PaymentRepository paymentRepository;
    private final SePayQrGenerator qrGenerator;
    private final BookingService bookingService;
    private final ApplicationEventPublisher eventPublisher;
    private final BillingProperties billingProperties;
    private final SalonService salonService;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                               SePayQrGenerator qrGenerator,
                               BookingService bookingService,
                               ApplicationEventPublisher eventPublisher,
                               BillingProperties billingProperties,
                               SalonService salonService) {
        this.paymentRepository = paymentRepository;
        this.qrGenerator = qrGenerator;
        this.bookingService = bookingService;
        this.eventPublisher = eventPublisher;
        this.billingProperties = billingProperties;
        this.salonService = salonService;
    }

    @Override
    public void createPaymentForBooking(Long bookingId, Long customerId, Long salonId, BigDecimal serviceAmount) {
        // Nếu đã tồn tại payment cho booking này (hiếm khi xảy ra, phòng trường hợp event
        // bị publish lại) thì không tạo trùng - unique constraint booking_id sẽ chặn insert.
        if (paymentRepository.findByBookingId(bookingId).isPresent()) {
            log.warn("Payment cho booking {} đã tồn tại, bỏ qua tạo mới", bookingId);
            return;
        }

        var salon = salonService.getSalonOrThrow(salonId);
        boolean demoPayment = salon.demo();
        BigDecimal fee = demoPayment ? BigDecimal.ZERO : billingProperties.getBookingFee();
        BigDecimal amount = serviceAmount.add(fee);
        String referenceCode = generateReferenceCode("DH" + bookingId);
        String paymentUrl = demoPayment ? null : qrGenerator.buildQrUrl(amount, referenceCode);

        Payment payment = new Payment(bookingId, customerId, salonId, PaymentType.BOOKING_CONNECTION,
                serviceAmount, fee, amount, referenceCode, paymentUrl,
                demoPayment ? PaymentProvider.DEMO : PaymentProvider.SEPAY);
        paymentRepository.save(payment);
    }

    @Override
    public PaymentResponse createSalonProPayment(Long salonId, Long ownerId) {
        var salon = salonService.getSalonOrThrow(salonId);
        if (!salon.ownerId().equals(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }
        if (!salon.isActive()) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_FAILED,
                    "Chỉ có thể đăng ký gói Salon Pro cho salon đang hoạt động (ACTIVE)"
            );
        }
        var activeStatuses = java.util.List.of(PaymentStatus.PENDING, PaymentStatus.PAID);
        var existing = paymentRepository.findFirstByCustomerIdAndSalonIdAndPaymentTypeAndStatusIn(
                ownerId, salonId, PaymentType.SALON_PRO_SUBSCRIPTION, activeStatuses);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        BigDecimal amount = billingProperties.getSalonProMonthlyFee();
        String referenceCode = generateReferenceCode("PRO" + salonId);
        Payment payment = new Payment(null, ownerId, salonId, PaymentType.SALON_PRO_SUBSCRIPTION,
                null, amount, amount, referenceCode, qrGenerator.buildQrUrl(amount, referenceCode));
        return toResponse(paymentRepository.save(payment));
    }

    @Override
    public void cancelPaymentForBooking(Long bookingId) {
        paymentRepository.findByBookingId(bookingId).ifPresent(payment -> {
            if (payment.isPending()) {
                payment.markCancelled();
            }
        });
    }

    @Override
    public void handleSepayWebhook(SepayWebhookRequest payload) {
        // Chỉ xử lý giao dịch TIỀN VÀO, bỏ qua tiền ra khỏi tài khoản
        if (!payload.isIncoming()) {
            return;
        }

        if (paymentRepository.findByTransactionId(String.valueOf(payload.id())).isPresent()) {
            log.info("Bỏ qua webhook SePay đã xử lý, transactionId={}", payload.id());
            return;
        }

        var matchingPayments = paymentRepository.findPendingMatchingContent(payload.content());

        if (matchingPayments.isEmpty()) {
            // Không khớp payment nào đang chờ - có thể là giao dịch không liên quan tới hệ thống
            // (khách chuyển nhầm nội dung, hoặc tiền vào vì lý do khác). Vẫn trả 200 OK bình thường,
            // KHÔNG ném lỗi, để SePay không hiểu nhầm là lỗi và spam gọi lại webhook liên tục.
            log.warn("Không tìm thấy payment PENDING khớp với nội dung chuyển khoản: {}", payload.content());
            return;
        }

        if (matchingPayments.size() > 1) {
            log.warn("Nội dung chuyển khoản khớp nhiều payment pending, transactionId={}", payload.id());
            return;
        }

        Payment payment = matchingPayments.get(0);

        // Cho phép khách chuyển dư (ví dụ làm tròn số), nhưng không chấp nhận chuyển thiếu
        if (payload.transferAmount().compareTo(payment.getAmount()) < 0) {
            log.warn("Booking {} nhận thiếu tiền: cần {} nhưng chỉ nhận {}",
                    payment.getBookingId(), payment.getAmount(), payload.transferAmount());
            return;
        }

        payment.markPaid(String.valueOf(payload.id()));

        eventPublisher.publishEvent(new PaymentCompletedEvent(
                payment.getId(), payment.getBookingId(), payment.getAmount()));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByBooking(Long bookingId, Long requesterId) {
        BookingSummaryResponse booking = bookingService.getBookingOrThrow(bookingId);

        if (!booking.customerId().equals(requesterId)) {
            throw new ForbiddenException("Bạn không phải chủ của lịch hẹn này");
        }

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment cho booking", bookingId));

        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPayment(Long paymentId, Long requesterId) {
        Payment payment = paymentRepository.findById(Objects.requireNonNull(paymentId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        if (!payment.getCustomerId().equals(requesterId)) {
            throw new ForbiddenException("Bạn không phải chủ của lịch hẹn này");
        }

        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPaymentHistory(Long requesterId, Pageable pageable) {
        return paymentRepository.findByCustomerIdOrderByCreatedAtDesc(requesterId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(Long paymentId, BigDecimal refundAmount, String refundReference, String note, Long adminId) {
        Payment payment = paymentRepository.findById(Objects.requireNonNull(paymentId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        payment.markRefunded(refundAmount, refundReference, note, adminId);

        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getAllPayments(String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            try {
                PaymentStatus paymentStatus = PaymentStatus.valueOf(status.trim());
                return paymentRepository.findByStatus(paymentStatus, pageable).map(this::toResponse);
            } catch (IllegalArgumentException ignored) {
            }
        }
        return paymentRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaidUserResponse> getPaidUsers(Pageable pageable) {
        return paymentRepository.findPaidUsers(pageable).map(item -> new PaidUserResponse(
                item.getCustomerId(),
                item.getFullName(),
                item.getEmail(),
                item.getPhone(),
                item.getPaidTransactionCount(),
                item.getTotalPaidAmount(),
                item.getTotalRefundedAmount(),
                item.getLastPaidAt() == null ? null : item.getLastPaidAt().toInstant(),
                item.getLatestPaymentId()
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentForAdmin(Long paymentId) {
        Payment payment = paymentRepository.findById(Objects.requireNonNull(paymentId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        return toResponse(payment);
    }

    @Override
    public PaymentResponse confirmDemoPayment(Long paymentId, Long requesterId) {
        Payment payment = paymentRepository.findById(Objects.requireNonNull(paymentId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        if (!payment.getCustomerId().equals(requesterId)) {
            throw new ForbiddenException("Bạn không phải chủ của giao dịch này");
        }
        if (payment.getProvider() != PaymentProvider.DEMO) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Chỉ payment DEMO mới có thể xác nhận giả lập");
        }
        if (payment.isPending()) {
            payment.markPaid("DEMO-" + UUID.randomUUID());
            eventPublisher.publishEvent(new PaymentCompletedEvent(
                    payment.getId(), payment.getBookingId(), payment.getAmount()));
        }
        return toResponse(payment);
    }

    /**
     * Mã tham chiếu ngắn gọn, dễ gõ/copy vào nội dung chuyển khoản.
     * Ví dụ: "DH1023-A1B2". Phần random 4 ký tự cuối để tránh trùng nếu bookingId
     * bị tái sử dụng ở môi trường test.
     */
    private String generateReferenceCode(String prefix) {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return prefix + randomSuffix;
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getBookingId(),
                payment.getSalonId(),
                payment.getPaymentType().name(),
                payment.getServiceAmount(),
                payment.getFeeAmount(),
                payment.getProvider().name(),
                payment.getTransactionId(),
                payment.getReferenceCode(),
                payment.getAmount(),
                payment.getStatus().name(),
                payment.getPaymentUrl(),
                payment.getPaidAt(),
                payment.getCreatedAt(),
                payment.getRefundAmount(),
                payment.getRefundReason(),
                payment.getRefundReference(),
                payment.getRefundRequestedAt(),
                payment.getRefundedAt(),
                payment.getCustomerId()
        );
    }
}
