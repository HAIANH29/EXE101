package be.exe.booking.mapper;

import be.exe.booking.domain.Booking;
import be.exe.booking.dto.response.BookingDetailResponse;
import be.exe.booking.dto.response.BookingResponse;

public final class BookingMapper {

    private BookingMapper() {
    }

    public static BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getCustomerId(),
                booking.getSalonId(),
                booking.getStylistId(),
                booking.getServiceId(),
                booking.getHairstyleId(),
                booking.getStartAt(),
                booking.getEndAt(),
                booking.getStatus().name(),
                booking.getTotalAmount(),
                booking.getNote(),
                booking.getCreatedAt()
        );
    }

    public static BookingDetailResponse toDetailResponse(
            Booking booking, String salonName, String serviceName, String hairstyleName) {
        return new BookingDetailResponse(
                booking.getId(),
                booking.getCustomerId(),
                booking.getSalonId(),
                salonName,
                booking.getStylistId(),
                booking.getServiceId(),
                serviceName,
                booking.getHairstyleId(),
                hairstyleName,
                booking.getStartAt(),
                booking.getEndAt(),
                booking.getStatus().name(),
                booking.getTotalAmount(),
                booking.getNote(),
                booking.getCreatedAt()
        );
    }
}
