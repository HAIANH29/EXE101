package be.exe.salon.domain;

import jakarta.persistence.*;

import java.time.LocalTime;

@Entity
@Table(name = "salon_business_hours",
        uniqueConstraints = @UniqueConstraint(columnNames = {"salon_id", "day_of_week"}))
public class SalonBusinessHour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "salon_id", nullable = false)
    private Long salonId;

    /**
     * Quy ước: 1 = Monday ... 7 = Sunday (khớp java.time.DayOfWeek.getValue()).
     * Dùng kiểu Short vì cột DB là SMALLINT - dùng Integer sẽ lệch kiểu, Hibernate validate sẽ báo lỗi.
     */
    @Column(name = "day_of_week", nullable = false)
    private Short dayOfWeek;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(name = "is_closed", nullable = false)
    private boolean isClosed = false;

    protected SalonBusinessHour() {
    }

    public SalonBusinessHour(Long salonId, Short dayOfWeek, LocalTime openTime,
                              LocalTime closeTime, boolean isClosed) {
        this.salonId = salonId;
        this.dayOfWeek = dayOfWeek;
        this.openTime = openTime;
        this.closeTime = closeTime;
        this.isClosed = isClosed;
    }

    public void update(LocalTime openTime, LocalTime closeTime, boolean isClosed) {
        this.openTime = openTime;
        this.closeTime = closeTime;
        this.isClosed = isClosed;
    }

    public Long getId() {
        return id;
    }

    public Long getSalonId() {
        return salonId;
    }

    public Short getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getOpenTime() {
        return openTime;
    }

    public LocalTime getCloseTime() {
        return closeTime;
    }

    public boolean isClosed() {
        return isClosed;
    }
}
