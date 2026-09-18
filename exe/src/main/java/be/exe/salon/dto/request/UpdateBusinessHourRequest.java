package be.exe.salon.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public class UpdateBusinessHourRequest {

    @NotNull
    @Min(1)
    @Max(7)
    private Short dayOfWeek; // 1 = Monday ... 7 = Sunday

    private LocalTime openTime;
    private LocalTime closeTime;
    private boolean closed;

    public Short getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(Short dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public LocalTime getOpenTime() {
        return openTime;
    }

    public void setOpenTime(LocalTime openTime) {
        this.openTime = openTime;
    }

    public LocalTime getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(LocalTime closeTime) {
        this.closeTime = closeTime;
    }

    public boolean isClosed() {
        return closed;
    }

    public void setClosed(boolean closed) {
        this.closed = closed;
    }
}
