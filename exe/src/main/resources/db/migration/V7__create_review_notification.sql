CREATE TABLE reviews (
                         id BIGSERIAL PRIMARY KEY,

                         booking_id BIGINT NOT NULL UNIQUE,
                         customer_id BIGINT NOT NULL,
                         salon_id BIGINT NOT NULL,

                         rating SMALLINT NOT NULL,
                         comment TEXT,

                         created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                         CONSTRAINT fk_reviews_booking
                             FOREIGN KEY (booking_id) REFERENCES bookings(id),

                         CONSTRAINT fk_reviews_customer
                             FOREIGN KEY (customer_id) REFERENCES users(id),

                         CONSTRAINT fk_reviews_salon
                             FOREIGN KEY (salon_id) REFERENCES salons(id),

                         CONSTRAINT chk_review_rating
                             CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE notifications (
                               id BIGSERIAL PRIMARY KEY,

                               user_id BIGINT NOT NULL,

                               type VARCHAR(50) NOT NULL,
                               title VARCHAR(255) NOT NULL,
                               content TEXT NOT NULL,

                               is_read BOOLEAN NOT NULL DEFAULT FALSE,

                               created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                               CONSTRAINT fk_notifications_user
                                   FOREIGN KEY (user_id) REFERENCES users(id)
);