-- Hai mốc nhắc lịch: ~5 tiếng và ~1 tiếng trước giờ hẹn (cờ `reminded` cũ là mốc 2 tiếng, không dùng nữa).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminded_5h BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminded_1h BOOLEAN NOT NULL DEFAULT FALSE;

-- Booking đã được nhắc theo cơ chế cũ thì coi như đã nhắc, tránh gửi lại hàng loạt khi deploy.
UPDATE bookings SET reminded_5h = TRUE, reminded_1h = TRUE WHERE reminded = TRUE;
