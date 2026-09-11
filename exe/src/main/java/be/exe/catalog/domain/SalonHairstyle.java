package be.exe.catalog.domain;

import jakarta.persistence.*;

import java.io.Serializable;
import java.util.Objects;

/**
 * Bảng join thuần (salon_id, hairstyle_id) - salon_id là cross-module (salon.Salon),
 * nên chỉ lưu Long, không dùng @ManyToOne sang entity Salon.
 */
@Entity
@Table(name = "salon_hairstyles")
@IdClass(SalonHairstyle.SalonHairstyleId.class)
public class SalonHairstyle {

    @Id
    @Column(name = "salon_id")
    private Long salonId;

    @Id
    @Column(name = "hairstyle_id")
    private Long hairstyleId;

    protected SalonHairstyle() {
    }

    public SalonHairstyle(Long salonId, Long hairstyleId) {
        this.salonId = salonId;
        this.hairstyleId = hairstyleId;
    }

    public Long getSalonId() {
        return salonId;
    }

    public Long getHairstyleId() {
        return hairstyleId;
    }

    public static class SalonHairstyleId implements Serializable {
        private Long salonId;
        private Long hairstyleId;

        public SalonHairstyleId() {
        }

        public SalonHairstyleId(Long salonId, Long hairstyleId) {
            this.salonId = salonId;
            this.hairstyleId = hairstyleId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SalonHairstyleId that)) return false;
            return Objects.equals(salonId, that.salonId) && Objects.equals(hairstyleId, that.hairstyleId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(salonId, hairstyleId);
        }
    }
}
