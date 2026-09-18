CREATE INDEX idx_salons_owner_id
    ON salons (owner_id);

CREATE INDEX idx_salons_status
    ON salons (status);

CREATE INDEX idx_stylists_salon_status
    ON stylists (salon_id, status);

CREATE INDEX idx_services_salon_status
    ON services (salon_id, status);

CREATE INDEX idx_hairstyles_category_id
    ON hairstyles (category_id);

CREATE INDEX idx_hairstyles_status_created_at
    ON hairstyles (status, created_at DESC);

CREATE INDEX idx_bookings_customer_created_at
    ON bookings (customer_id, created_at DESC);

CREATE INDEX idx_bookings_stylist_start_at
    ON bookings (stylist_id, start_at);

CREATE INDEX idx_bookings_salon_start_at
    ON bookings (salon_id, start_at DESC);

CREATE INDEX idx_bookings_status_start_at
    ON bookings (status, start_at);

CREATE INDEX idx_payments_status_created_at
    ON payments (status, created_at DESC);

CREATE INDEX idx_tryon_user_created_at
    ON tryon_requests (user_id, created_at DESC);

CREATE INDEX idx_tryon_status_created_at
    ON tryon_requests (status, created_at DESC);

CREATE INDEX idx_reviews_salon_created_at
    ON reviews (salon_id, created_at DESC);

CREATE INDEX idx_notifications_user_created_at
    ON notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_user_unread
    ON notifications (user_id, is_read, created_at DESC);