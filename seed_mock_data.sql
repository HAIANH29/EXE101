-- File seed data dành cho môi trường Local / Testing
-- Chạy script này trong DBeaver / pgAdmin để bơm dữ liệu vào Database
-- Lưu ý: Không chạy script này trên môi trường Production!

-- 1. Xóa dữ liệu cũ (Tùy chọn, bỏ comment nếu muốn reset)
-- TRUNCATE TABLE tryon_results, tryon_requests, payments, bookings, reviews, salon_hairstyles, hairstyles, hairstyle_categories, services, stylists, salons, user_roles, users CASCADE;

-- 2. Insert Users (Password mặc định là 'Password123!')
INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, role, status, created_at, updated_at)
VALUES 
(1, 'hoang.minh.95@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Trần Hoàng Minh', '0987654321', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80', 'CUSTOMER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'owner.ironcap@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Lê Văn Chủ', '0911223344', null, 'SALON_OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'admin.hethong@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Quản Trị Viên', '0999888777', null, 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'baduser@gmail.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Khách Hay Bom Hàng', '0944556677', null, 'CUSTOMER', 'LOCKED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Map roles cho users
INSERT INTO user_roles (user_id, role_id)
VALUES 
(1, (SELECT id FROM roles WHERE name = 'CUSTOMER')),
(2, (SELECT id FROM roles WHERE name = 'SALON_OWNER')),
(3, (SELECT id FROM roles WHERE name = 'ADMIN')),
(4, (SELECT id FROM roles WHERE name = 'CUSTOMER'))
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 3. Insert Salons
INSERT INTO salons (id, owner_id, name, phone, address, description, image_url, status, created_at)
VALUES 
(1, 2, 'Ironcap Barbershop - Ngã Tư Sở', '0812345678', '21 Ngõ 192 Lê Trọng Tấn, Thanh Xuân, Hà Nội', 'Không gian Barber cổ điển phong cách Châu Âu.', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', 'ACTIVE', '2024-02-15 08:00:00'),
(2, 2, 'Mane Man Barber House - Cầu Giấy', '0912345678', 'Số K31, Ngõ 68 Trung Kính, Cầu Giấy, Hà Nội', 'Premium Barber House với đội ngũ thợ lành nghề.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', 'ACTIVE', '2024-05-20 08:00:00')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Stylists
INSERT INTO stylists (id, salon_id, name, avatar_url, bio, status, created_at)
VALUES 
(1, 1, 'Vũ Anh Tú (Tú Master)', 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80', 'Hơn 7 năm kinh nghiệm với Classic và Skin Fade.', 'ACTIVE', '2024-02-16 09:00:00'),
(2, 1, 'Hoàng Hải (Hải Baber)', 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80', 'Chuyên gia uốn Pre-styling.', 'ACTIVE', '2024-03-01 09:30:00'),
(3, 2, 'Lê Tuấn Phong', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80', 'Kinh nghiệm phục hồi tóc, tẩy nhuộm.', 'ACTIVE', '2024-06-10 10:00:00')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Services
INSERT INTO services (id, salon_id, name, description, price, duration, image_url, status)
VALUES 
(1, 1, 'Cắt Sấy Tạo Kiểu Premium', 'Tư vấn kiểu tóc, cắt xả, gội massage.', 120000, 45, 'https://images.unsplash.com/photo-1593702288056-ccbfebdd7d70?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
(2, 1, 'Cạo Khăn Nóng Hơi Nước', 'Dịch vụ cạo râu thư giãn.', 80000, 30, 'https://images.unsplash.com/photo-1532710093739-9470ac1bf081?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
(3, 2, 'Uốn Tóc Hàn Quốc', 'Sử dụng thuốc uốn hữu cơ cao cấp.', 350000, 90, 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Categories & Hairstyles
INSERT INTO hairstyle_categories (id, name, description)
VALUES 
(1, 'Undercut & Fade', 'Phong cách cạo sát hai bên.'),
(2, 'Side Part & Quiff', 'Phân chia ngôi cổ điển, độ phồng cao.'),
(3, 'Layer & Mullet', 'Tóc cắt lớp bồng bềnh.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hairstyles (id, category_id, name, description, image_url, gender, status, created_at)
VALUES 
(1, 2, 'Short Quiff', 'Kiểu tóc ngắn vuốt dựng phần mái.', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', 'MALE', 'ACTIVE', '2024-01-10 10:00:00'),
(2, 2, 'Side Part 7/3 Rủ', 'Mái chia tỷ lệ 7/3, phần mái uốn rủ tự nhiên.', 'https://images.unsplash.com/photo-1595152452543-e5fc28ebc2b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', 'MALE', 'ACTIVE', '2024-01-15 10:30:00'),
(3, 3, 'Modern Mullet', 'Hai bên cắt gọn, đuôi gáy để dài.', 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', 'MALE', 'ACTIVE', '2024-02-01 11:00:00')
ON CONFLICT (id) DO NOTHING;

-- 7. Reset Sequence để không bị lỗi khi insert tay sau này
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('salons_id_seq', (SELECT MAX(id) FROM salons));
SELECT setval('stylists_id_seq', (SELECT MAX(id) FROM stylists));
SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));
SELECT setval('hairstyle_categories_id_seq', (SELECT MAX(id) FROM hairstyle_categories));
SELECT setval('hairstyles_id_seq', (SELECT MAX(id) FROM hairstyles));
