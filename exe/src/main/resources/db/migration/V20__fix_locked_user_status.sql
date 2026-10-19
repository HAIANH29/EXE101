-- Seed V11 chèn status 'LOCKED' không tồn tại trong enum UserStatus (ACTIVE/INACTIVE/BANNED/DELETED),
-- làm GET /api/admin/users (không lọc status) trả 500. Chuyển về BANNED.
UPDATE users SET status = 'BANNED' WHERE status = 'LOCKED';
