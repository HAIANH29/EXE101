-- Gallery ảnh của salon (tối đa 10 ảnh/salon, kiểm soát ở service).
-- Ảnh đầu tiên (sort_order nhỏ nhất) đồng bộ với salons.image_url (ảnh bìa) để app khách hàng và hệ thống cũ không bị ảnh hưởng.
-- Salon cũ chưa có dòng nào ở đây thì service tự trả [image_url].
CREATE TABLE salon_images (
    id         BIGSERIAL PRIMARY KEY,
    salon_id   BIGINT NOT NULL REFERENCES salons (id) ON DELETE CASCADE,
    image_url  TEXT   NOT NULL,
    sort_order INT    NOT NULL DEFAULT 0
);

CREATE INDEX idx_salon_images_salon ON salon_images (salon_id, sort_order);

INSERT INTO salon_images (salon_id, image_url, sort_order)
SELECT id, image_url, 0
FROM salons
WHERE image_url IS NOT NULL AND TRIM(image_url) <> '';
