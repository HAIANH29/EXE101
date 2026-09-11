CREATE TABLE payments (
                          id BIGSERIAL PRIMARY KEY,

                          booking_id BIGINT NOT NULL UNIQUE,

                          provider VARCHAR(50) NOT NULL DEFAULT 'SEPAY',
                          transaction_id VARCHAR(255),
                          reference_code VARCHAR(255),

                          amount NUMERIC(12,2) NOT NULL,

                          status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

                          payment_url TEXT,
                          paid_at TIMESTAMPTZ,

                          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_payments_booking
                              FOREIGN KEY (booking_id) REFERENCES bookings(id),

                          CONSTRAINT chk_payment_amount
                              CHECK (amount >= 0)


);