ALTER TABLE payments
    ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE payments
    ADD COLUMN customer_id BIGINT,
    ADD COLUMN salon_id BIGINT,
    ADD COLUMN payment_type VARCHAR(40) NOT NULL DEFAULT 'BOOKING_CONNECTION',
    ADD COLUMN service_amount NUMERIC(12,2),
    ADD COLUMN fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE payments p
SET customer_id = b.customer_id,
    salon_id = b.salon_id,
    service_amount = p.amount
FROM bookings b
WHERE p.booking_id = b.id;

ALTER TABLE payments
    ALTER COLUMN customer_id SET NOT NULL;

ALTER TABLE payments
    ADD CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    ADD CONSTRAINT fk_payments_salon FOREIGN KEY (salon_id) REFERENCES salons(id),
    ADD CONSTRAINT chk_payment_fee_amount CHECK (fee_amount >= 0);

CREATE INDEX idx_payments_customer_created_at
    ON payments (customer_id, created_at DESC);
