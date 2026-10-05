package be.exe.booking.service.impl;

import be.exe.booking.domain.Booking;
import be.exe.booking.domain.BookingStatus;
import be.exe.booking.domain.event.BookingCancelledEvent;
import be.exe.booking.domain.event.BookingCompletedEvent;
import be.exe.booking.domain.event.BookingConfirmedEvent;
import be.exe.booking.domain.event.BookingCreatedEvent;
import be.exe.booking.dto.request.CancelBookingRequest;
import be.exe.booking.dto.request.CreateBookingRequest;
import be.exe.booking.dto.request.RescheduleBookingRequest;
import be.exe.booking.dto.response.BookingDetailResponse;
import be.exe.booking.dto.response.BookingResponse;
import be.exe.booking.dto.response.BookingSummaryResponse;
import be.exe.booking.dto.response.AvailabilityIntervalResponse;
import be.exe.booking.dto.response.AvailabilityResponse;
import be.exe.booking.mapper.BookingMapper;
import be.exe.booking.repository.BookingRepository;
import be.exe.booking.service.BookingService;
import be.exe.catalog.dto.response.HairstyleSummaryResponse;
import be.exe.catalog.dto.response.ServiceCatalogSummaryResponse;
import be.exe.catalog.service.HairstyleService;
import be.exe.catalog.service.ServiceCatalogService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.common.exception.ValidationException;
import be.exe.salon.dto.response.SalonSummaryResponse;
import be.exe.salon.dto.response.StylistResponse;
import be.exe.salon.dto.response.StylistSummaryResponse;
import be.exe.salon.service.SalonService;
import be.exe.salon.service.StylistService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;

/**
 * Đây là module gọi nhiều nhất sang module khác (salon, catalog) - toàn bộ đều thông qua
 * interface Service công khai (SalonService, StylistService, ServiceCatalogService,
 * HairstyleService), KHÔNG import bất kỳ Repository/Entity nào của 2 module đó.
 */
@Service
@Transactional
public class BookingServiceImpl implements BookingService {

    /**
     * Không cho hủy booking trong vòng 2 tiếng trước giờ hẹn - tránh salon bị động
     * khi khách hủy sát giờ.
     */
    private static final long CANCEL_DEADLINE_HOURS = 2;

    private final BookingRepository bookingRepository;
    private final SalonService salonService;
    private final StylistService stylistService;
    private final ServiceCatalogService serviceCatalogService;
    private final HairstyleService hairstyleService;
    private final ApplicationEventPublisher eventPublisher;

    public BookingServiceImpl(BookingRepository bookingRepository,
                               SalonService salonService,
                               StylistService stylistService,
                               ServiceCatalogService serviceCatalogService,
                               HairstyleService hairstyleService,
                               ApplicationEventPublisher eventPublisher) {
        this.bookingRepository = bookingRepository;
        this.salonService = salonService;
        this.stylistService = stylistService;
        this.serviceCatalogService = serviceCatalogService;
        this.hairstyleService = hairstyleService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public BookingResponse createBooking(Long customerId, CreateBookingRequest request) {

        // 1. Validate salon
        SalonSummaryResponse salon = salonService.getSalonOrThrow(request.getSalonId());
        if (!salon.isActive()) {
            throw new ValidationException("Salon hiện không hoạt động, không thể đặt lịch");
        }

        // 2. Validate stylist - phải thuộc đúng salon và đang active
        StylistSummaryResponse stylist = stylistService.getStylistOrThrow(request.getStylistId());
        if (!stylist.salonId().equals(request.getSalonId())) {
            throw new ValidationException("Stylist này không thuộc salon đã chọn");
        }
        if (!stylist.isActive()) {
            throw new ValidationException("Stylist hiện không hoạt động");
        }

        // 3. Validate service - phải thuộc đúng salon và đang active
        ServiceCatalogSummaryResponse service = serviceCatalogService.getServiceOrThrow(request.getServiceId());
        if (!service.salonId().equals(request.getSalonId())) {
            throw new ValidationException("Dịch vụ này không thuộc salon đã chọn");
        }
        if (!service.isActive()) {
            throw new ValidationException("Dịch vụ hiện không khả dụng");
        }

        // 4. Validate hairstyle (optional)
        if (request.getHairstyleId() != null) {
            HairstyleSummaryResponse hairstyle = hairstyleService.getHairstyleOrThrow(request.getHairstyleId());
            if (!hairstyle.isActive()) {
                throw new ValidationException("Kiểu tóc đã chọn hiện không khả dụng");
            }
        }

        // 5. Tính endAt từ thời lượng dịch vụ, snapshot giá tại thời điểm đặt
        Instant startAt = request.getStartAt();
        Instant endAt = startAt.plus(service.durationMinutes(), ChronoUnit.MINUTES);

        // 6. Kiểm tra trùng lịch (application-level check - lớp bảo vệ đầu tiên)
        if (bookingRepository.existsOverlappingBooking(request.getStylistId(), startAt, endAt)) {
            throw new BusinessException(ErrorCode.BOOKING_SLOT_UNAVAILABLE);
        }

        Booking booking = new Booking(
                customerId,
                request.getSalonId(),
                request.getStylistId(),
                request.getServiceId(),
                request.getHairstyleId(),
                startAt,
                endAt,
                service.price(),
                request.getNote()
        );

        try {
            bookingRepository.save(booking);
            bookingRepository.flush(); // ép insert ngay để bắt được exclusion constraint violation ở đây
        } catch (DataIntegrityViolationException e) {
            // Lớp bảo vệ CUỐI CÙNG - phòng trường hợp race condition giữa bước check ở trên
            // và lúc insert thật (2 request gần như đồng thời), exclusion constraint ở DB
            // (excl_stylist_overlap, xem V4__create_booking.sql) sẽ chặn đứng ở đây.
            throw new BusinessException(ErrorCode.BOOKING_SLOT_UNAVAILABLE);
        }

        eventPublisher.publishEvent(new BookingCreatedEvent(
                booking.getId(), booking.getCustomerId(), booking.getSalonId(), booking.getTotalAmount()));

        return toEnrichedResponse(booking);
    }

    @Override
    public BookingResponse confirmBooking(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        booking.confirm();

        eventPublisher.publishEvent(new BookingConfirmedEvent(booking.getId(), booking.getCustomerId()));

        return toEnrichedResponse(booking);
    }

    @Override
    public BookingResponse cancelBooking(Long bookingId, Long requesterId, CancelBookingRequest request) {
        Booking booking = findOrThrow(bookingId);

        if (!booking.isOwnedBy(requesterId)) {
            throw new ForbiddenException("Bạn không có quyền hủy lịch hẹn này");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.BOOKING_CANNOT_CANCEL,
                    "Lịch hẹn đã kết thúc hoặc đã bị hủy trước đó");
        }

        Duration untilStart = Duration.between(Instant.now(), booking.getStartAt());
        if (untilStart.toHours() < CANCEL_DEADLINE_HOURS) {
            throw new BusinessException(ErrorCode.BOOKING_CANNOT_CANCEL,
                    "Chỉ có thể hủy lịch hẹn trước giờ hẹn ít nhất " + CANCEL_DEADLINE_HOURS + " tiếng");
        }

        booking.cancel();

        String reason = (request != null) ? request.getReason() : null;
        eventPublisher.publishEvent(new BookingCancelledEvent(booking.getId(), booking.getCustomerId(), reason));

        return toEnrichedResponse(booking);
    }

    @Override
    public BookingResponse rescheduleBooking(Long bookingId, Long requesterId,
                                             RescheduleBookingRequest request) {
        Booking booking = findOrThrow(bookingId);

        if (!booking.isOwnedBy(requesterId)) {
            throw new ForbiddenException("Bạn không có quyền đổi lịch hẹn này");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new ValidationException("Lịch hẹn đã kết thúc hoặc đã bị hủy");
        }

        Duration untilStart = Duration.between(Instant.now(), booking.getStartAt());
        if (untilStart.toHours() < CANCEL_DEADLINE_HOURS) {
            throw new ValidationException(
                    "Chỉ có thể đổi lịch trước giờ hẹn ít nhất " + CANCEL_DEADLINE_HOURS + " tiếng");
        }

        ServiceCatalogSummaryResponse service = serviceCatalogService.getServiceOrThrow(booking.getServiceId());
        if (!service.isActive()) {
            throw new ValidationException("Dịch vụ hiện không khả dụng");
        }

        Instant newStartAt = request.getStartAt();
        Instant newEndAt = newStartAt.plus(service.durationMinutes(), ChronoUnit.MINUTES);
        if (bookingRepository.existsOverlappingBookingExcept(
                bookingId, booking.getStylistId(), newStartAt, newEndAt)) {
            throw new BusinessException(ErrorCode.BOOKING_SLOT_UNAVAILABLE);
        }

        try {
            booking.reschedule(newStartAt, newEndAt);
            bookingRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.BOOKING_SLOT_UNAVAILABLE);
        }

        return BookingMapper.toResponse(booking);
    }

    @Override
    public BookingResponse completeBooking(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        booking.complete();

        eventPublisher.publishEvent(new BookingCompletedEvent(
                booking.getId(), booking.getCustomerId(), booking.getSalonId()));

        return toEnrichedResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDetailResponse getBookingDetail(Long bookingId, Long requesterId) {
        Booking booking = findOrThrow(bookingId);

        if (!booking.isOwnedBy(requesterId)) {
            throw new ForbiddenException("Bạn không có quyền xem lịch hẹn này");
        }

        var salon = salonService.getSalonDetail(booking.getSalonId());
        StylistResponse stylist = stylistService.getStylist(booking.getStylistId());
        String serviceName = serviceCatalogService.getServiceOrThrow(booking.getServiceId()).name();
        String hairstyleName = (booking.getHairstyleId() != null)
                ? hairstyleService.getHairstyleOrThrow(booking.getHairstyleId()).name()
                : null;

        return BookingMapper.toDetailResponse(
                booking,
                salon.name(),
                salon.address(),
                stylist.fullName(),
                serviceName,
                hairstyleName);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingSummaryResponse getBookingOrThrow(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        return new BookingSummaryResponse(
                booking.getId(), booking.getCustomerId(), booking.getSalonId(),
                booking.getStatus().name());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getMyBookings(Long customerId, Pageable pageable) {
        return bookingRepository.findByCustomerId(customerId, pageable).map(this::toEnrichedResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getSalonBookings(Long salonId, Long ownerId, Pageable pageable) {
        SalonSummaryResponse salon = salonService.getSalonOrThrow(salonId);
        if (!salon.ownerId().equals(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }
        return bookingRepository.findBySalonId(salonId, pageable).map(this::toEnrichedResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getStylistBookings(Long stylistId, Pageable pageable) {
        return bookingRepository.findByStylistId(stylistId, pageable).map(this::toEnrichedResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AvailabilityResponse getAvailability(Long salonId, Long stylistId, LocalDate date) {
        StylistSummaryResponse stylist = stylistService.getStylistOrThrow(stylistId);
        if (!stylist.salonId().equals(salonId)) {
            throw new ValidationException("Stylist này không thuộc salon đã chọn");
        }
        if (!stylist.isActive()) {
            throw new ValidationException("Stylist hiện không hoạt động");
        }

        var hour = salonService.getBusinessHour(salonId, date.getDayOfWeek());
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant dayStart = date.atStartOfDay(zone).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(zone).toInstant();
        List<AvailabilityIntervalResponse> booked = bookingRepository
                .findByStylistIdAndStartAtLessThanAndEndAtGreaterThanAndStatusNot(
                        stylistId, dayEnd, dayStart, BookingStatus.CANCELLED)
                .stream()
                .map(booking -> new AvailabilityIntervalResponse(
                        booking.getStartAt(), booking.getEndAt()))
                .toList();

        return new AvailabilityResponse(
                salonId, stylistId, date, hour.closed(), hour.openTime(), hour.closeTime(), booked);
    }

    // ===== Dùng cho dashboard (module admin) =====

    @Override
    @Transactional(readOnly = true)
    public long countBookingsByStatus(String status) {
        return bookingRepository.countByStatus(BookingStatus.valueOf(status));
    }

    @Override
    @Transactional(readOnly = true)
    public long countBookingsBetween(Instant from, Instant to) {
        return bookingRepository.countByCreatedAtBetween(from, to);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getRevenueBetween(Instant from, Instant to) {
        return bookingRepository.sumRevenueBetween(from, to);
    }

    private Booking findOrThrow(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));
    }

    private BookingResponse toEnrichedResponse(Booking booking) {
        var salon = salonService.getSalonDetail(booking.getSalonId());
        StylistResponse stylist = stylistService.getStylist(booking.getStylistId());
        String serviceName = serviceCatalogService.getServiceOrThrow(booking.getServiceId()).name();
        String hairstyleName = (booking.getHairstyleId() != null)
                ? hairstyleService.getHairstyleOrThrow(booking.getHairstyleId()).name()
                : null;

        return BookingMapper.toResponse(
                booking,
                salon.name(),
                salon.address(),
                stylist.fullName(),
                serviceName,
                hairstyleName);
    }
}
