-- Gallery ảnh của kiểu tóc (tối đa 5 ảnh/kiểu tóc, kiểm soát ở service).
-- Ảnh đầu tiên (sort_order nhỏ nhất) đồng bộ với hairstyles.image_url (ảnh bìa) để app khách hàng không bị ảnh hưởng.
-- Kiểu tóc cũ chưa có dòng nào ở đây thì service tự trả [image_url].
CREATE TABLE hairstyle_images (
    id           BIGSERIAL PRIMARY KEY,
    hairstyle_id BIGINT NOT NULL REFERENCES hairstyles (id) ON DELETE CASCADE,
    image_url    TEXT   NOT NULL,
    sort_order   INT    NOT NULL DEFAULT 0
);

CREATE INDEX idx_hairstyle_images_hairstyle ON hairstyle_images (hairstyle_id, sort_order);
