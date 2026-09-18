package be.exe.payment.service.impl;

import be.exe.booking.dto.response.BookingSummaryResponse;
import be.exe.booking.service.BookingService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.payment.domain.Payment;
import be.exe.payment.domain.event.PaymentCompletedEvent;
import be.exe.payment.dto.response.PaymentResponse;
import be.exe.payment.repository.PaymentRepository;
import be.exe.payment.sepay.SePayQrGenerator;
import be.exe.payment.sepay.SepayWebhookRequest;
import be.exe.payment.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);
    private static final String REFERENCE_PREFIX = "DH";

    private final PaymentRepository paymentRepository;
    private final SePayQrGenerator qrGenerator;
    private final BookingService bookingService;
    private final ApplicationEventPublisher eventPublisher;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                               SePayQrGenerator qrGenerator,
                               BookingService bookingService,
                               ApplicationEventPublisher eventPublisher) {
        this.paymentRepository = paymentRepository;
        this.qrGenerator = qrGenerator;
        this.bookingService = bookingService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public void createPaymentForBooking(Long bookingId, BigDecimal amount) {
        // Nếu đã tồn tại payment cho booking này (hiếm khi xảy ra, phòng trường hợp event
        // bị publish lại) thì không tạo trùng - unique constraint booking_id sẽ chặn insert.
        if (paymentRepository.findByBookingId(bookingId).isPresent()) {
            log.warn("Payment cho booking {} đã tồn tại, bỏ qua tạo mới", bookingId);
            return;
        }

        String referenceCode = generateReferenceCode(bookingId);
        String paymentUrl = qrGenerator.buildQrUrl(amount, referenceCode);

        Payment payment = new Payment(bookingId, amount, referenceCode, paymentUrl);
        paymentRepository.save(payment);
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

        Optional<Payment> maybePayment = paymentRepository.findPendingMatchingContent(payload.content());

        if (maybePayment.isEmpty()) {
            // Không khớp payment nào đang chờ - có thể là giao dịch không liên quan tới hệ thống
            // (khách chuyển nhầm nội dung, hoặc tiền vào vì lý do khác). Vẫn trả 200 OK bình thường,
            // KHÔNG ném lỗi, để SePay không hiểu nhầm là lỗi và spam gọi lại webhook liên tục.
            log.warn("Không tìm thấy payment PENDING khớp với nội dung chuyển khoản: {}", payload.content());
            return;
        }

        Payment payment = maybePayment.get();

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
    public PaymentResponse getPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        return toResponse(payment);
    }

    /**
     * Mã tham chiếu ngắn gọn, dễ gõ/copy vào nội dung chuyển khoản.
     * Ví dụ: "DH1023-A1B2". Phần random 4 ký tự cuối để tránh trùng nếu bookingId
     * bị tái sử dụng ở môi trường test.
     */
    private String generateReferenceCode(Long bookingId) {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return REFERENCE_PREFIX + bookingId + randomSuffix;
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getBookingId(),
                payment.getProvider().name(),
                payment.getTransactionId(),
                payment.getReferenceCode(),
                payment.getAmount(),
                payment.getStatus().name(),
                payment.getPaymentUrl(),
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }
}
