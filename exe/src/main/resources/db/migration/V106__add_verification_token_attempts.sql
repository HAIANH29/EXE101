-- Đếm số lần nhập sai OTP để khóa mã sau N lần (chống brute-force 6 chữ số)
ALTER TABLE verification_tokens ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0;

-- Tăng tốc các truy vấn rate-limit / lấy OTP mới nhất theo email + loại
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email_type_created
    ON verification_tokens (email, type, created_at DESC);
