-- V23: Thêm 30 kiểu tóc chuẩn cho màn hình Explore (15 Nam & 15 Nữ)

-- Xóa dữ liệu cũ nếu có
DELETE FROM salon_hairstyles;
DELETE FROM hairstyles;

-- 15 kiểu tóc nam
INSERT INTO hairstyles (name, description, image_url, category_id, gender, status, created_at, updated_at)
VALUES
('Two Block', 'Tóc hai lớp, phần trên dài và phồng, hai bên cắt gọn; phong cách Hàn Quốc trẻ trung.', 'https://res.cloudinary.com/cmxpmg9p/image/upload/v1791979533/suppcxdbcyrcnxnvzcnw.png', 4002, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Comma Hair', 'Mái uốn cong hình dấu phẩy, tạo vẻ lịch lãm và thời trang.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800', 4002, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Layer nam', 'Tỉa nhiều lớp, tóc mềm mại, tự nhiên, dễ kết hợp với mái rủ.', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800', 4001, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Textured Crop', 'Tóc ngắn, phần mái tỉa texture tạo độ rối tự nhiên, cá tính.', 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800', 4003, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('French Crop', 'Hai bên gọn, mái ngắn đổ về phía trước, ít tốn công tạo kiểu.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800', 4003, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Side Part', 'Tóc chia ngôi lệch, phù hợp phong cách trưởng thành, chỉn chu.', 'https://images.unsplash.com/photo-1595152452543-e5fc28ebc2b8?w=800', 2, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Quiff', 'Phần tóc trước vuốt dựng và tạo độ phồng, năng động.', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800', 2, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Modern Pompadour', 'Phần tóc phía trước vuốt cao, có độ phồng rõ rệt, lịch lãm.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', 2, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Slick Back', 'Tóc vuốt ngược ra sau, phong cách nam tính và gọn gàng.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800', 1, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Middle Part (Curtain Hair)', 'Tóc rẽ ngôi giữa, mái buông hai bên, mang phong cách Hàn Quốc.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800', 4002, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Messy Hair', 'Tóc rối có chủ đích, tạo vẻ tự nhiên, phóng khoáng.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 4001, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Wolf Cut nam', 'Tỉa layer nhiều tầng, phần gáy dài hơn, mang phong cách cá tính.', 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800', 3, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Mullet nam', 'Phần trước và hai bên gọn hơn, tóc gáy để dài, nổi bật và phá cách.', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800', 3, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Buzz Cut', 'Tóc cắt rất ngắn, tối giản, dễ chăm sóc.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', 4003, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Ivy League', 'Tóc ngắn gọn, phần trên dài vừa đủ để chải lệch hoặc tạo phồng, thanh lịch.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800', 4003, 'MALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 15 kiểu tóc nữ
('Layer nữ sóng lơi', 'Tóc tỉa layer bồng bềnh kết hợp uốn sóng lơi nhẹ nhàng, tôn dáng mặt tự nhiên.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800', 4001, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Bob ngắn mái thưa', 'Tóc bob ngang cằm trẻ trung, kết hợp mái thưa chuẩn Hàn Quốc giúp gương mặt nhỏ gọn.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800', 4003, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Hippie Curly Retro', 'Xoăn xù mì phong cách retro cổ điển cá tính, tạo độ dày dặn và nét riêng biệt.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800', 4005, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Pixie Cut cá tính', 'Tóc tém pixie sắc sảo, cắt ngắn gọn gàng khoe trọn đường nét thanh tú và xương quai xanh.', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800', 4003, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Hime Cut phong cách Nhật', 'Tóc công chúa Nhật Bản với hai dải tóc mai cắt bằng ngang cằm độc đáo, thu hút.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800', 4002, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Butterfly Cut bồng bềnh', 'Tỉa layer cánh bướm nhiều tầng cao cấp, tạo độ phồng và hiệu ứng bay tự nhiên.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800', 4001, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Uốn gợn sóng Water Wave', 'Sóng nước óng ả mềm mại, phong cách thanh lịch nữ tính cho mái tóc dài.', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800', 4005, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Mái bay Hàn Quốc', 'Tóc dài buông xõa kết hợp mái bay thanh thoát, che khuyết điểm hai bên hàm hoàn hảo.', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800', 4002, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tóc uốn cụp chữ C', 'Đuôi tóc uốn cong chữ C nhẹ nhàng ôm trọn gương mặt, dễ chăm sóc tại nhà.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800', 4003, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tóc thẳng tỉa đuôi chữ V', 'Mái tóc suôn mượt tự nhiên, phần đuôi tỉa chữ V thanh thoát, hiện đại.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800', 4001, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tóc Wolf Cut nữ', 'Tỉa layer tầng phá cách, phần gáy bay bổng tạo diện mạo sắc sảo và cuốn hút.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800', 3, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tóc ngắn Blunt Bob', 'Tóc bob cắt chân bằng dứt khoát ngang cằm, tối giản mà vô cùng thời thượng.', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800', 4003, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tóc xoăn lọn to Hàn Quốc', 'Lọn sóng to bồng bềnh chuẩn sao Hàn, mang lại diện mạo kiêu kỳ, sang trọng.', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800', 4005, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tóc Shag Mullet nữ', 'Sự kết hợp giữa Shag cổ điển và Mullet hiện đại, phóng khoáng và nổi bật.', 'https://images.unsplash.com/photo-1507152832244-10d45c7eda57?w=800', 3, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tóc tém Tomboy thanh lịch', 'Kiểu tóc tém cắt gọn gàng, năng động nhưng không kém phần thanh lịch, cá tính.', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800', 4003, 'FEMALE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Gán tất cả kiểu tóc cho các salon đang hoạt động
INSERT INTO salon_hairstyles (salon_id, hairstyle_id)
SELECT s.id, h.id
FROM salons s
CROSS JOIN hairstyles h
ON CONFLICT DO NOTHING;
