-- Token thiết bị (Expo push token) để gửi thông báo đẩy. Một token chỉ thuộc một user tại một thời điểm:
-- đăng nhập tài khoản khác trên cùng máy sẽ chuyển token sang tài khoản đó.
CREATE TABLE IF NOT EXISTS device_push_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    platform    VARCHAR(20),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_push_tokens_user ON device_push_tokens (user_id);
