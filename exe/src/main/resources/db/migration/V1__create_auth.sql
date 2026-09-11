CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       full_name VARCHAR(150) NOT NULL,
                       phone VARCHAR(20),
                       avatar_url TEXT,
                       status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                       created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
                       id BIGSERIAL PRIMARY KEY,
                       name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE user_roles (
                            user_id BIGINT NOT NULL,
                            role_id BIGINT NOT NULL,

                            PRIMARY KEY (user_id, role_id),

                            CONSTRAINT fk_user_roles_user
                                FOREIGN KEY (user_id) REFERENCES users(id),

                            CONSTRAINT fk_user_roles_role
                                FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT INTO roles (name)
VALUES
    ('CUSTOMER'),
    ('STAFF'),
    ('SALON_OWNER'),
    ('ADMIN');


CREATE TABLE refresh_tokens (
                                id BIGSERIAL PRIMARY KEY,

                                user_id BIGINT NOT NULL,

                                token_hash VARCHAR(255) NOT NULL UNIQUE,

                                expires_at TIMESTAMPTZ NOT NULL,

                                revoked_at TIMESTAMPTZ,

                                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT fk_refresh_tokens_user
                                    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- FIX: thêm index cho user_id, cần khi revoke toàn bộ refresh token của 1 user (logout all devices)
CREATE INDEX idx_refresh_tokens_user_id
    ON refresh_tokens (user_id);