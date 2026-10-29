-- V108 references these stable category IDs. Older deployed databases already
-- had them from manual data, but a fresh database created only from migrations
-- did not. Add the missing prerequisites without changing the checksum of V108.
INSERT INTO hairstyle_categories (id, name, description)
VALUES
    (4001, 'Explore - Tóc layer', 'Nhóm kiểu tóc tỉa layer trong màn hình Explore.'),
    (4002, 'Explore - Phong cách Hàn Quốc', 'Nhóm kiểu tóc mang phong cách Hàn Quốc trong màn hình Explore.'),
    (4003, 'Explore - Tóc ngắn', 'Nhóm kiểu tóc ngắn trong màn hình Explore.'),
    (4005, 'Explore - Tóc uốn xoăn', 'Nhóm kiểu tóc uốn và xoăn trong màn hình Explore.')
ON CONFLICT (id) DO NOTHING;

SELECT setval(
    'hairstyle_categories_id_seq',
    GREATEST(
        COALESCE((SELECT MAX(id) FROM hairstyle_categories), 1),
        COALESCE((SELECT last_value FROM hairstyle_categories_id_seq), 1)
    )
);
