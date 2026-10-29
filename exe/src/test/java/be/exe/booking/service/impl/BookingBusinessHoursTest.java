package be.exe.booking.service.impl;

import be.exe.booking.dto.request.CreateBookingRequest;
import be.exe.booking.repository.BookingRepository;
import be.exe.catalog.dto.response.ServiceCatalogSummaryResponse;
import be.exe.catalog.service.HairstyleService;
import be.exe.catalog.service.ServiceCatalogService;
import be.exe.common.exception.ValidationException;
import be.exe.salon.dto.response.BusinessHourResponse;
import be.exe.salon.dto.response.SalonSummaryResponse;
import be.exe.salon.dto.response.StylistSummaryResponse;
import be.exe.salon.service.SalonService;
import be.exe.salon.service.StylistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingBusinessHoursTest {

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
    void rejectsActiveSalonWhenBookingIsNotEnabled() {
        CreateBookingRequest request = requestAt(LocalTime.of(10, 0));
        when(salonService.getSalonOrThrow(1L))
                .thenReturn(new SalonSummaryResponse(1L, 2L, "Directory Salon",
                        "ACTIVE", false, false));

        assertThatThrownBy(() -> bookingService.createBooking(99L, request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("chưa được bật nhận lịch");
        verify(bookingRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsBookingOnClosedDay() {
        CreateBookingRequest request = requestAt(LocalTime.of(10, 0));
        prepareBookableSalon();
        when(salonService.getBusinessHour(1L, DayOfWeek.MONDAY))
                .thenReturn(new BusinessHourResponse((short) 1, null, null, true));

        assertThatThrownBy(() -> bookingService.createBooking(99L, request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("ngoài giờ nhận lịch");
        verify(bookingRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsBookingOutsideVerifiedOpeningHours() {
        CreateBookingRequest request = requestAt(LocalTime.of(8, 0));
        prepareBookableSalon();
        when(salonService.getBusinessHour(1L, DayOfWeek.MONDAY))
                .thenReturn(new BusinessHourResponse(
                        (short) 1, LocalTime.of(9, 0), LocalTime.of(20, 0), false));

        assertThatThrownBy(() -> bookingService.createBooking(99L, request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("ngoài giờ nhận lịch");
        verify(bookingRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private void prepareBookableSalon() {
        when(salonService.getSalonOrThrow(1L))
                .thenReturn(new SalonSummaryResponse(1L, 2L, "Bookable Salon",
                        "ACTIVE", false, true));
        when(stylistService.getStylistOrThrow(3L))
                .thenReturn(new StylistSummaryResponse(3L, 1L, "ACTIVE"));
        when(serviceCatalogService.getServiceOrThrow(4L))
                .thenReturn(new ServiceCatalogSummaryResponse(
                        4L, 1L, "Consultation", BigDecimal.ZERO, 30, "ACTIVE"));
    }

    private CreateBookingRequest requestAt(LocalTime time) {
        ZoneId vietnam = ZoneId.of("Asia/Ho_Chi_Minh");
        CreateBookingRequest request = new CreateBookingRequest();
        request.setSalonId(1L);
        request.setStylistId(3L);
        request.setServiceId(4L);
        request.setStartAt(LocalDate.of(2026, 11, 2).atTime(time).atZone(vietnam).toInstant());
        return request;
    }
}
