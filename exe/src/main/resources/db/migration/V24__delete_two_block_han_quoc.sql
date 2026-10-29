-- V24: Xóa kiểu tóc Two Block Han Quoc cũ, chỉ giữ lại Two Block mới

UPDATE bookings
SET hairstyle_id = (SELECT id FROM hairstyles WHERE name = 'Two Block' LIMIT 1)
WHERE hairstyle_id IN (SELECT id FROM hairstyles WHERE name = 'Two Block Han Quoc');

DELETE FROM salon_hairstyles
WHERE hairstyle_id IN (SELECT id FROM hairstyles WHERE name = 'Two Block Han Quoc');

DELETE FROM hairstyles
WHERE name = 'Two Block Han Quoc';
