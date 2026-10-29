package be.exe.booking.service.impl;

import be.exe.booking.domain.Booking;
import be.exe.booking.domain.BookingStatus;
import be.exe.booking.repository.BookingRepository;
import be.exe.catalog.dto.response.ServiceCatalogSummaryResponse;
import be.exe.catalog.service.HairstyleService;
import be.exe.catalog.service.ServiceCatalogService;
import be.exe.common.exception.ForbiddenException;
import be.exe.salon.dto.response.SalonDetailResponse;
import be.exe.salon.dto.response.SalonSummaryResponse;
import be.exe.salon.dto.response.StylistResponse;
import be.exe.salon.service.SalonService;
import be.exe.salon.service.StylistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingManagementAuthorizationTest {

    private static final long BOOKING_ID = 42L;
    private static final long SALON_ID = 10L;
    private static final long OWNER_ID = 20L;
    private static final long OTHER_OWNER_ID = 21L;
    private static final long STYLIST_ID = 30L;
    private static final long STYLIST_USER_ID = 31L;
    private static final long SERVICE_ID = 40L;

    @Mock BookingRepository bookingRepository;
    @Mock SalonService salonService;
    @Mock StylistService stylistService;
    @Mock ServiceCatalogService serviceCatalogService;
    @Mock HairstyleService hairstyleService;
    @Mock ApplicationEventPublisher eventPublisher;

    private BookingServiceImpl bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingServiceImpl(
                bookingRepository, salonService, stylistService,
                serviceCatalogService, hairstyleService, eventPublisher);
    }

    @Test
    void ownerCannotConfirmBookingOfAnotherSalon() {
        Booking booking = pendingBooking();
        prepareAuthorization(booking);

        assertThatThrownBy(() -> bookingService.confirmBooking(
                BOOKING_ID, OTHER_OWNER_ID, false))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("không có quyền");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.PENDING);
        verify(eventPublisher, never()).publishEvent(any(Object.class));
    }

    @Test
    void ownerCannotCompleteBookingOfAnotherSalon() {
        Booking booking = pendingBooking();
        booking.confirm();
        prepareAuthorization(booking);

        assertThatThrownBy(() -> bookingService.completeBooking(
                BOOKING_ID, OTHER_OWNER_ID, false))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("không có quyền");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        verify(eventPublisher, never()).publishEvent(any(Object.class));
    }

    @Test
    void correctSalonOwnerCanConfirmBooking() {
        Booking booking = pendingBooking();
        prepareAuthorization(booking);
        prepareEnrichedResponse();

        var response = bookingService.confirmBooking(BOOKING_ID, OWNER_ID, false);

        assertThat(response.status()).isEqualTo("CONFIRMED");
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    void assignedStylistCanCompleteBooking() {
        Booking booking = pendingBooking();
        booking.confirm();
        prepareAuthorization(booking);
        prepareEnrichedResponse();

        var response = bookingService.completeBooking(
                BOOKING_ID, STYLIST_USER_ID, false);

        assertThat(response.status()).isEqualTo("COMPLETED");
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    private Booking pendingBooking() {
        Instant start = Instant.parse("2026-11-10T03:00:00Z");
        Booking booking = new Booking(
                50L, SALON_ID, STYLIST_ID, SERVICE_ID, null,
                start, start.plusSeconds(1_800), BigDecimal.ZERO, null);
        ReflectionTestUtils.setField(booking, "id", BOOKING_ID);
        return booking;
    }

    private void prepareAuthorization(Booking booking) {
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(salonService.getSalonOrThrow(SALON_ID)).thenReturn(new SalonSummaryResponse(
                SALON_ID, OWNER_ID, "Salon thật", "ACTIVE", false, true));
        when(stylistService.getStylist(STYLIST_ID)).thenReturn(stylist());
    }

    private void prepareEnrichedResponse() {
        when(salonService.getSalonDetail(SALON_ID)).thenReturn(new SalonDetailResponse(
                SALON_ID, OWNER_ID, "Salon thật", "0900000000", "Thủ Đức",
                null, null, "ACTIVE", List.of(), Instant.now()));
        when(stylistService.getStylist(STYLIST_ID)).thenReturn(stylist());
        when(serviceCatalogService.getServiceOrThrow(SERVICE_ID))
                .thenReturn(new ServiceCatalogSummaryResponse(
                        SERVICE_ID, SALON_ID, "Tư vấn", BigDecimal.ZERO, 30, "ACTIVE"));
    }

    private StylistResponse stylist() {
        return new StylistResponse(
                STYLIST_ID, STYLIST_USER_ID, "Stylist", null, SALON_ID,
                null, null, "ACTIVE", Instant.now());
    }
}
