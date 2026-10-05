-- Demo data for local/dev profile only. Production profile does not load db/dev-migration.

INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, status)
VALUES
    (1001, 'customer@stylelock.test', '$2a$10$50TD2f75vVTbEGGx2t2eTuOrh4CMAKpJfmmzYxpXnDgwAb7OckF..', 'Nguyen Van Minh', '0988123456', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'ACTIVE'),
    (1002, 'owner@stylelock.test', '$2a$10$50TD2f75vVTbEGGx2t2eTuOrh4CMAKpJfmmzYxpXnDgwAb7OckF..', 'Ha Anh Owner', '0909001002', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'ACTIVE'),
    (1003, 'elena@stylelock.test', '$2a$10$50TD2f75vVTbEGGx2t2eTuOrh4CMAKpJfmmzYxpXnDgwAb7OckF..', 'Elena Tran', '0909001003', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'ACTIVE'),
    (1004, 'marcus@stylelock.test', '$2a$10$50TD2f75vVTbEGGx2t2eTuOrh4CMAKpJfmmzYxpXnDgwAb7OckF..', 'Marcus Le', '0909001004', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'ACTIVE'),
    (1005, 'admin@stylelock.test', '$2a$10$50TD2f75vVTbEGGx2t2eTuOrh4CMAKpJfmmzYxpXnDgwAb7OckF..', 'StyleLock Admin', '0909001005', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 1001, id FROM roles WHERE name = 'CUSTOMER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 1002, id FROM roles WHERE name = 'SALON_OWNER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 1003, id FROM roles WHERE name = 'STAFF'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 1004, id FROM roles WHERE name = 'STAFF'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 1005, id FROM roles WHERE name = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO salons (id, owner_id, name, phone, address, description, image_url, status)
VALUES
    (2001, 1002, 'StyleLock Salon Studio - Cau Giay', '0988123456', '102 Xuan Thuy, Cau Giay, Ha Noi', 'Salon doi tac demo voi dich vu cat, uon, nhuom va tu van kieu toc theo anh try-on.', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900', 'ACTIVE'),
    (2002, 1002, 'Korean Beauty Hair & Spa', '0966888999', '15 Kim Ma, Ba Dinh, Ha Noi', 'Salon phong cach Han Quoc, manh ve layer, uon phong chan toc va phuc hoi.', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900', 'ACTIVE'),
    (2003, 1002, 'Barber Shop Authentic 1990s', '0933444555', '88 Tran Dai Nghia, Hai Ba Trung, Ha Noi', 'Barber demo chuyen fade, undercut va tao kieu nam.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO salon_business_hours (salon_id, day_of_week, open_time, close_time, is_closed)
SELECT salon_id, day_of_week, open_time::time, close_time::time, is_closed
FROM (
    VALUES
        (2001, 1, '08:30', '20:30', false),
        (2001, 2, '08:30', '20:30', false),
        (2001, 3, '08:30', '20:30', false),
        (2001, 4, '08:30', '20:30', false),
        (2001, 5, '08:30', '20:30', false),
        (2001, 6, '08:30', '21:00', false),
        (2001, 7, '09:00', '19:00', false),
        (2002, 1, '09:00', '20:00', false),
        (2002, 2, '09:00', '20:00', false),
        (2002, 3, '09:00', '20:00', false),
        (2002, 4, '09:00', '20:00', false),
        (2002, 5, '09:00', '20:00', false),
        (2002, 6, '09:00', '20:30', false),
        (2002, 7, '09:00', '18:30', false),
        (2003, 1, '09:00', '21:30', false),
        (2003, 2, '09:00', '21:30', false),
        (2003, 3, '09:00', '21:30', false),
        (2003, 4, '09:00', '21:30', false),
        (2003, 5, '09:00', '21:30', false),
        (2003, 6, '09:00', '21:30', false),
        (2003, 7, '10:00', '18:00', false)
) AS t(salon_id, day_of_week, open_time, close_time, is_closed)
ON CONFLICT (salon_id, day_of_week) DO NOTHING;

INSERT INTO stylists (id, user_id, salon_id, bio, experience_years, status)
VALUES
    (3001, 1003, 2001, 'Master colorist, layer va balayage specialist', 7, 'ACTIVE'),
    (3002, 1004, 2001, 'Precision cuts, fade va two-block stylist', 5, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hairstyle_categories (id, name, description)
VALUES
    (4001, 'Layer', 'Layer nam/nu, de tao kieu hang ngay'),
    (4002, 'Korean', 'Two block, comma hair va phong cach Han Quoc'),
    (4003, 'Short', 'Buzz, pixie, bob va barber short cut'),
    (4004, 'Color', 'Balayage, highlight va nhuom thoi trang'),
    (4005, 'Curly', 'Uon song loi, curly va hippie')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hairstyles (id, category_id, name, description, image_url, gender, status)
VALUES
    (5001, 4001, 'Layer Nam Hien Dai', 'Kieu toc layer nam tia tang tu nhien, hop voi mat tron va mat trai xoan.', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=700', 'MALE', 'ACTIVE'),
    (5002, 4002, 'Two Block Han Quoc', 'Phan mai mem, hai ben gon, phu hop phong cach Han Quoc tre trung.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=700', 'MALE', 'ACTIVE'),
    (5003, 4003, 'Undercut Fade Lich Lam', 'Fade gon hai ben, de cham soc va hop moi truong cong so.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700', 'MALE', 'ACTIVE'),
    (5004, 4001, 'Layer Nu Song Loi', 'Tia tang mem voi song loi nhe, giup toc day va bay hon.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700', 'FEMALE', 'ACTIVE'),
    (5005, 4003, 'Bob Ngan Mai Thua', 'Bob ngang cam tre trung, de cham soc, hop mat nho va V-line.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700', 'FEMALE', 'ACTIVE'),
    (5006, 4005, 'Hippie Curly Retro', 'Xoan nho phong cach retro, ca tinh va noi bat.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=700', 'FEMALE', 'ACTIVE'),
    (5007, 4004, 'Balayage Nau Lanh', 'Nhuom balayage nau lanh, len mau mem va ton da.', 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=700', 'UNISEX', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO salon_hairstyles (salon_id, hairstyle_id)
VALUES
    (2001, 5001), (2001, 5002), (2001, 5004), (2001, 5007),
    (2002, 5002), (2002, 5004), (2002, 5005), (2002, 5006), (2002, 5007),
    (2003, 5001), (2003, 5002), (2003, 5003)
ON CONFLICT DO NOTHING;

INSERT INTO services (id, salon_id, name, description, price, duration_minutes, status)
VALUES
    (6001, 2001, 'Cat toc + Goi massage', 'Tu van form toc, cat tao kieu va goi massage thu gian.', 150000, 45, 'ACTIVE'),
    (6002, 2001, 'Cat + Uon Layer / Two Block', 'Combo cat va uon form theo anh tham khao StyleLock.', 350000, 90, 'ACTIVE'),
    (6003, 2001, 'Cat + Nhuom thoi trang', 'Tu van mau, xu ly nen va nhuom mau thoi trang.', 450000, 120, 'ACTIVE'),
    (6004, 2001, 'Combo Dinh hinh kieu Try-on', 'Dua tren anh try-on cua khach de cat/uon/tao kieu sat mau.', 500000, 120, 'ACTIVE'),
    (6005, 2002, 'Cat + Goi thu gian kieu Han', 'Cat tao kieu nhe, goi dau va say tao phong.', 250000, 60, 'ACTIVE'),
    (6006, 2002, 'Uon phong chan toc', 'Tang do phong cho toc mong, giu nep tu nhien.', 400000, 90, 'ACTIVE'),
    (6007, 2002, 'Phuc hoi Keratin', 'Phuc hoi toc hu ton va tao do bong muot.', 600000, 90, 'ACTIVE'),
    (6008, 2003, 'Cat Barber + Cao rau co dien', 'Cat fade/barber va cham soc rau co dien.', 100000, 45, 'ACTIVE'),
    (6009, 2003, 'Cat + Vuot tao kieu sap cao cap', 'Tao kieu nam nhanh, gon, hop lich hen trong ngay.', 150000, 50, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bookings (id, customer_id, salon_id, stylist_id, service_id, hairstyle_id, start_at, end_at, status, total_amount, note)
VALUES
    (7001, 1001, 2001, 3001, 6002, 5001, CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '90 minutes', 'PENDING', 350000, 'Khach dat demo tu StyleLock app. SDT: 0988123456'),
    (7002, 1001, 2001, 3002, 6001, 5002, CURRENT_TIMESTAMP + INTERVAL '4 days', CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '45 minutes', 'CONFIRMED', 150000, 'Da xac nhan demo'),
    (7003, 1001, 2001, 3001, 6003, 5007, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '120 minutes', 'COMPLETED', 450000, 'Booking demo da hoan thanh')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, booking_id, provider, transaction_id, reference_code, amount, status, payment_url, paid_at)
VALUES
    (8001, 7001, 'SEPAY', NULL, 'STYLELOCK-7001', 350000, 'PENDING', 'https://qr.sepay.vn/img?acc=STYLELOCK&bank=MBBank&amount=350000&des=STYLELOCK-7001', NULL),
    (8002, 7002, 'SEPAY', NULL, 'STYLELOCK-7002', 150000, 'PENDING', 'https://qr.sepay.vn/img?acc=STYLELOCK&bank=MBBank&amount=150000&des=STYLELOCK-7002', NULL),
    (8003, 7003, 'SEPAY', 'DEMO-TXN-7003', 'STYLELOCK-7003', 450000, 'PAID', 'https://qr.sepay.vn/img?acc=STYLELOCK&bank=MBBank&amount=450000&des=STYLELOCK-7003', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reviews (id, booking_id, customer_id, salon_id, rating, comment)
VALUES
    (9001, 7003, 1001, 2001, 5, 'Stylist tu van dung mau try-on, dich vu tot va dung gio.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, content, is_read)
VALUES
    (10001, 1001, 'BOOKING_CREATED', 'Da tao lich hen', 'Lich hen demo tai StyleLock Salon Studio dang cho salon xac nhan.', false),
    (10002, 1001, 'BOOKING_CONFIRMED', 'Salon da xac nhan', 'Lich hen demo sap toi da duoc xac nhan.', false),
    (10003, 1002, 'BOOKING_CREATED', 'Co lich hen moi', 'Khach demo vua dat lich tai salon cua ban.', false)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 1), true);
SELECT setval('salons_id_seq', GREATEST((SELECT MAX(id) FROM salons), 1), true);
SELECT setval('stylists_id_seq', GREATEST((SELECT MAX(id) FROM stylists), 1), true);
SELECT setval('hairstyle_categories_id_seq', GREATEST((SELECT MAX(id) FROM hairstyle_categories), 1), true);
SELECT setval('hairstyles_id_seq', GREATEST((SELECT MAX(id) FROM hairstyles), 1), true);
SELECT setval('services_id_seq', GREATEST((SELECT MAX(id) FROM services), 1), true);
SELECT setval('bookings_id_seq', GREATEST((SELECT MAX(id) FROM bookings), 1), true);
SELECT setval('payments_id_seq', GREATEST((SELECT MAX(id) FROM payments), 1), true);
SELECT setval('reviews_id_seq', GREATEST((SELECT MAX(id) FROM reviews), 1), true);
SELECT setval('notifications_id_seq', GREATEST((SELECT MAX(id) FROM notifications), 1), true);
