-- V110: Thêm cột image_url cho bảng services
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;
