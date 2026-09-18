CREATE TABLE tryon_requests (
                                id BIGSERIAL PRIMARY KEY,

                                user_id BIGINT NOT NULL,
                                hairstyle_id BIGINT NOT NULL,

                                input_image_url TEXT NOT NULL,

                                status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

                                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                completed_at TIMESTAMPTZ,

                                CONSTRAINT fk_tryon_requests_user
                                    FOREIGN KEY (user_id) REFERENCES users(id),

                                CONSTRAINT fk_tryon_requests_hairstyle
                                    FOREIGN KEY (hairstyle_id) REFERENCES hairstyles(id)
);

CREATE TABLE tryon_results (
                               id BIGSERIAL PRIMARY KEY,

                               request_id BIGINT NOT NULL UNIQUE,
                               result_image_url TEXT NOT NULL,

                               created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                               CONSTRAINT fk_tryon_results_request
                                   FOREIGN KEY (request_id) REFERENCES tryon_requests(id)
);