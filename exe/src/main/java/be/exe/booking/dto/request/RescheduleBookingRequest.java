package be.exe.booking.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class RescheduleBookingRequest {

    @NotNull(message = "Thời gian đặt lịch không được để trống")
    @Future(message = "Thời gian đặt lịch phải ở tương lai")
    private Instant startAt;

    public Instant getStartAt() {
        return startAt;
    }

    public void setStartAt(Instant startAt) {
        this.startAt = startAt;
    }
}
