-- Cần extension này để dùng exclusion constraint kết hợp bigint + tstzrange
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
                          id BIGSERIAL PRIMARY KEY,

                          customer_id BIGINT NOT NULL,
                          salon_id BIGINT NOT NULL,
                          stylist_id BIGINT NOT NULL,
                          service_id BIGINT NOT NULL,
                          hairstyle_id BIGINT,

                          start_at TIMESTAMPTZ NOT NULL,
                          end_at TIMESTAMPTZ NOT NULL,

                          status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

                          total_amount NUMERIC(12,2) NOT NULL,
                          note TEXT,

                          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_bookings_customer
                              FOREIGN KEY (customer_id) REFERENCES users(id),

                          CONSTRAINT fk_bookings_salon
                              FOREIGN KEY (salon_id) REFERENCES salons(id),

                          CONSTRAINT fk_bookings_stylist
                              FOREIGN KEY (stylist_id) REFERENCES stylists(id),

                          CONSTRAINT fk_bookings_service
                              FOREIGN KEY (service_id) REFERENCES services(id),

    -- FIX: thêm ON DELETE SET NULL vì hairstyle_id là optional,
    -- xóa 1 hairstyle không nên bị chặn bởi booking cũ tham chiếu tới nó
                          CONSTRAINT fk_bookings_hairstyle
                              FOREIGN KEY (hairstyle_id) REFERENCES hairstyles(id)
                                  ON DELETE SET NULL,

                          CONSTRAINT chk_booking_time
                              CHECK (end_at > start_at),

                          CONSTRAINT chk_booking_amount
                              CHECK (total_amount >= 0),

    -- FIX: chống double-booking — 1 stylist không thể có 2 booking
    -- (chưa hủy) trùng khoảng thời gian
                          CONSTRAINT excl_stylist_overlap
                              EXCLUDE USING gist (
                                  stylist_id WITH =,
                                  tstzrange(start_at, end_at) WITH &&
                              )
                              WHERE (status <> 'CANCELLED')
);