-- Real-world location listings curated from the Google Maps links supplied to
-- StyleLock. These records are platform-managed directory data, not a claim
-- that the real-world businesses have joined StyleLock.

INSERT INTO users (email, password_hash, full_name, status, created_at, updated_at)
VALUES (
    'platform.salons@stylelock.internal',
    '!STYLELOCK_SYSTEM_ACCOUNT_LOGIN_DISABLED!',
    'StyleLock Platform Salon Manager',
    'INACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'SALON_OWNER'
WHERE u.email = 'platform.salons@stylelock.internal'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Preserve previous demo rows for booking/payment history, but keep them out
-- of the normal production salon catalogue.
UPDATE salons
SET status = 'INACTIVE',
    booking_enabled = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE is_demo = TRUE;

-- Hide the two old mock directory records without deleting historical rows.
UPDATE salons
SET status = 'INACTIVE',
    booking_enabled = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE listing_source = 'OWNER_SUBMITTED'
  AND owner_id = (SELECT id FROM users WHERE email = 'owner.ironcap@gmail.com')
  AND (
      (id = 1 AND name = 'Ironcap Barbershop - Ngã Tư Sở')
      OR (id = 2 AND name = 'Mane Man Barber House - Cầu Giấy')
  );

WITH surveyed (
    name, address, phone, latitude, longitude, google_cid, source_url
) AS (
    VALUES
        ('Amazing Hair Color',
         '25 Số 1, Khu Dân Cư Lilama, Thành phố Thủ Đức, Hồ Chí Minh 70000, Việt Nam',
         '0776192800',
         10.8365254::DOUBLE PRECISION, 106.764237::DOUBLE PRECISION,
         '14201724843438120981', 'https://maps.app.goo.gl/pmo8Cfi86zipiZdN8?g_st=ac'),
        ('Hair Salon At Home - Tóc Đẹp Thủ Đức',
         '55 Dân Chủ, Thành phố Thủ Đức, Hồ Chí Minh 700000, Việt Nam',
         '0987778083',
         10.8478679::DOUBLE PRECISION, 106.7658716::DOUBLE PRECISION,
         '16280854763246570230', 'https://maps.app.goo.gl/95iCpcyd4wvkVYBn9'),
        ('Traky Hair Salon - Thủ Đức',
         '173 Võ Văn Ngân, Thành phố Thủ Đức, Hồ Chí Minh 71350, Việt Nam',
         '0928516666',
         10.8508105::DOUBLE PRECISION, 106.7623971::DOUBLE PRECISION,
         '15759376974258805692', 'https://maps.app.goo.gl/6qaXjKJhmzJW4oau8?g_st=ac'),
        ('1M Hair Salon',
         '40 Hoàng Diệu 2, Thành phố Thủ Đức, Hồ Chí Minh 700000, Việt Nam',
         '0967874565',
         10.8595317::DOUBLE PRECISION, 106.762082::DOUBLE PRECISION,
         '7066615520215932791', 'https://maps.app.goo.gl/HwpBJwCnX3Q6inbY9?g_st=ac'),
        ('Salon TÀI DESIGN',
         '250 Đặng Văn Bi, Thành phố Thủ Đức, Hồ Chí Minh, Việt Nam',
         '0977592697',
         10.8502513::DOUBLE PRECISION, 106.7588148::DOUBLE PRECISION,
         '9042415311697934864', 'https://maps.google.com/?cid=9042415311697934864'),
        ('Tâm Anh Hair Salon',
         '1210 Kha Vạn Cân, phường Linh Trung, Thành phố Thủ Đức, Hồ Chí Minh, Việt Nam',
         '0379868036',
         10.8612266::DOUBLE PRECISION, 106.7611032::DOUBLE PRECISION,
         '12713669135783038761', 'https://maps.google.com/?cid=12713669135783038761'),
        ('Viện Tóc Padaha',
         '135 Nguyễn Thị Nhung, KĐT Vạn Phúc, Hiệp Bình Phước, Thành phố Thủ Đức, Hồ Chí Minh, Việt Nam',
         '0939200366',
         10.8437442::DOUBLE PRECISION, 106.712004::DOUBLE PRECISION,
         '18311701144106686399', 'https://maps.google.com/?cid=18311701144106686399'),
        ('Bơ Hair Salon',
         '1094 Kha Vạn Cân, Thành phố Thủ Đức, Hồ Chí Minh 70000, Việt Nam',
         '0343779295',
         10.8579028::DOUBLE PRECISION, 106.7581512::DOUBLE PRECISION,
         '1982887223332079666', 'https://maps.app.goo.gl/6ZMYVnkYEZV3Sx728?g_st=ac'),
        ('ART Barbershop 1',
         '56 Hoàng Diệu 2, Thành phố Thủ Đức, Hồ Chí Minh 70000, Việt Nam',
         '0971324679',
         10.8575144::DOUBLE PRECISION, 106.76362::DOUBLE PRECISION,
         '11076559846869586685', 'https://maps.app.goo.gl/AEvrtRQfiSUwX6dW7?g_st=ac')
)
UPDATE salons s
SET name = d.name,
    address = d.address,
    phone = d.phone,
    latitude = d.latitude,
    longitude = d.longitude,
    description = 'Địa điểm thật được StyleLock tổng hợp từ nguồn khảo sát. Chưa xác nhận quan hệ đối tác; lịch hẹn cần được xác nhận trước khi sử dụng dịch vụ.',
    listing_source = 'PLATFORM_CURATED',
    source_provider = 'GOOGLE_MAPS',
    source_url = d.source_url,
    source_place_id = d.google_cid,
    location_verified_at = COALESCE(s.location_verified_at, CURRENT_TIMESTAMP),
    is_demo = FALSE,
    platform_managed = TRUE,
    booking_enabled = TRUE,
    business_hours_verified = TRUE,
    status = 'ACTIVE',
    updated_at = CURRENT_TIMESTAMP
FROM surveyed d
WHERE (s.source_provider = 'GOOGLE_MAPS' AND s.source_place_id = d.google_cid)
   OR (
       s.owner_id = (SELECT id FROM users WHERE email = 'platform.salons@stylelock.internal')
       AND LOWER(s.name) = LOWER(d.name)
       AND LOWER(COALESCE(s.address, '')) = LOWER(d.address)
       AND NOT EXISTS (
           SELECT 1 FROM salons linked
           WHERE linked.source_provider = 'GOOGLE_MAPS'
             AND linked.source_place_id = d.google_cid
             AND linked.id <> s.id
       )
   );

WITH surveyed (
    name, address, phone, latitude, longitude, google_cid, source_url
) AS (
    VALUES
        ('Amazing Hair Color', '25 Số 1, Khu Dân Cư Lilama, Thành phố Thủ Đức, Hồ Chí Minh 70000, Việt Nam', '0776192800', 10.8365254::DOUBLE PRECISION, 106.764237::DOUBLE PRECISION, '14201724843438120981', 'https://maps.app.goo.gl/pmo8Cfi86zipiZdN8?g_st=ac'),
        ('Hair Salon At Home - Tóc Đẹp Thủ Đức', '55 Dân Chủ, Thành phố Thủ Đức, Hồ Chí Minh 700000, Việt Nam', '0987778083', 10.8478679::DOUBLE PRECISION, 106.7658716::DOUBLE PRECISION, '16280854763246570230', 'https://maps.app.goo.gl/95iCpcyd4wvkVYBn9'),
        ('Traky Hair Salon - Thủ Đức', '173 Võ Văn Ngân, Thành phố Thủ Đức, Hồ Chí Minh 71350, Việt Nam', '0928516666', 10.8508105::DOUBLE PRECISION, 106.7623971::DOUBLE PRECISION, '15759376974258805692', 'https://maps.app.goo.gl/6qaXjKJhmzJW4oau8?g_st=ac'),
        ('1M Hair Salon', '40 Hoàng Diệu 2, Thành phố Thủ Đức, Hồ Chí Minh 700000, Việt Nam', '0967874565', 10.8595317::DOUBLE PRECISION, 106.762082::DOUBLE PRECISION, '7066615520215932791', 'https://maps.app.goo.gl/HwpBJwCnX3Q6inbY9?g_st=ac'),
        ('Salon TÀI DESIGN', '250 Đặng Văn Bi, Thành phố Thủ Đức, Hồ Chí Minh, Việt Nam', '0977592697', 10.8502513::DOUBLE PRECISION, 106.7588148::DOUBLE PRECISION, '9042415311697934864', 'https://maps.google.com/?cid=9042415311697934864'),
        ('Tâm Anh Hair Salon', '1210 Kha Vạn Cân, phường Linh Trung, Thành phố Thủ Đức, Hồ Chí Minh, Việt Nam', '0379868036', 10.8612266::DOUBLE PRECISION, 106.7611032::DOUBLE PRECISION, '12713669135783038761', 'https://maps.google.com/?cid=12713669135783038761'),
        ('Viện Tóc Padaha', '135 Nguyễn Thị Nhung, KĐT Vạn Phúc, Hiệp Bình Phước, Thành phố Thủ Đức, Hồ Chí Minh, Việt Nam', '0939200366', 10.8437442::DOUBLE PRECISION, 106.712004::DOUBLE PRECISION, '18311701144106686399', 'https://maps.google.com/?cid=18311701144106686399'),
        ('Bơ Hair Salon', '1094 Kha Vạn Cân, Thành phố Thủ Đức, Hồ Chí Minh 70000, Việt Nam', '0343779295', 10.8579028::DOUBLE PRECISION, 106.7581512::DOUBLE PRECISION, '1982887223332079666', 'https://maps.app.goo.gl/6ZMYVnkYEZV3Sx728?g_st=ac'),
        ('ART Barbershop 1', '56 Hoàng Diệu 2, Thành phố Thủ Đức, Hồ Chí Minh 70000, Việt Nam', '0971324679', 10.8575144::DOUBLE PRECISION, 106.76362::DOUBLE PRECISION, '11076559846869586685', 'https://maps.app.goo.gl/AEvrtRQfiSUwX6dW7?g_st=ac')
)
INSERT INTO salons (
    owner_id, name, phone, address, description, status,
    latitude, longitude, is_demo, listing_source, source_provider,
    source_url, source_place_id, location_verified_at,
    booking_enabled, platform_managed, business_hours_verified,
    created_at, updated_at
)
SELECT
    owner.id,
    d.name,
    d.phone,
    d.address,
    'Địa điểm thật được StyleLock tổng hợp từ nguồn khảo sát. Chưa xác nhận quan hệ đối tác; lịch hẹn cần được xác nhận trước khi sử dụng dịch vụ.',
    'ACTIVE',
    d.latitude,
    d.longitude,
    FALSE,
    'PLATFORM_CURATED',
    'GOOGLE_MAPS',
    d.source_url,
    d.google_cid,
    CURRENT_TIMESTAMP,
    TRUE,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM surveyed d
CROSS JOIN users owner
WHERE owner.email = 'platform.salons@stylelock.internal'
  AND NOT EXISTS (
      SELECT 1 FROM salons existing
      WHERE (existing.source_provider = 'GOOGLE_MAPS' AND existing.source_place_id = d.google_cid)
         OR (
             LOWER(existing.name) = LOWER(d.name)
             AND LOWER(COALESCE(existing.address, '')) = LOWER(d.address)
         )
  )
ON CONFLICT DO NOTHING;

-- No price list was supplied. This neutral zero-price item represents only a
-- booking/consultation request; the service and final price are paid at and
-- confirmed by the salon.
INSERT INTO services (
    salon_id, name, description, price, duration_minutes, status,
    created_at, updated_at
)
SELECT
    s.id,
    'Đặt lịch tư vấn – thanh toán tại salon',
    'Giá 0đ không phải giá dịch vụ. Giá thực tế được salon xác nhận và thanh toán tại salon; khoản thanh toán online (nếu có) chỉ là phí kết nối/đặt lịch StyleLock.',
    0,
    30,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM salons s
WHERE s.source_provider = 'GOOGLE_MAPS'
  AND s.source_place_id IN (
      '14201724843438120981', '16280854763246570230', '15759376974258805692',
      '7066615520215932791', '9042415311697934864', '12713669135783038761',
      '18311701144106686399', '1982887223332079666', '11076559846869586685'
  )
  AND NOT EXISTS (
      SELECT 1 FROM services service
      WHERE service.salon_id = s.id
        AND service.name = 'Đặt lịch tư vấn – thanh toán tại salon'
  );

WITH staff_seed (email, full_name, salon_cid, bio) AS (
    VALUES
        ('staff.amazing.assigned@stylelock.internal', 'Stylist do salon phân công', '14201724843438120981', 'Nhân sự cụ thể sẽ do salon xác nhận khi tiếp nhận yêu cầu.'),
        ('staff.home.nhu@stylelock.internal', 'NHƯ', '16280854763246570230', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi cắt kỹ và hỗ trợ sửa tóc hỏng.'),
        ('staff.home.bao@stylelock.internal', 'Mr Bảo', '16280854763246570230', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.home.thanh@stylelock.internal', 'Mrs Thanh', '16280854763246570230', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.bin@stylelock.internal', 'Bin', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.truong@stylelock.internal', 'Trường', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.cuong@stylelock.internal', 'Cường', '15759376974258805692', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi tay nghề tốt và biết lắng nghe.'),
        ('staff.traky.hieu@stylelock.internal', 'Hiếu', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.quoc@stylelock.internal', 'Quốc', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.dinh@stylelock.internal', 'Dinh', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.tuan@stylelock.internal', 'Tuấn', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.1m.phuong@stylelock.internal', 'Phương', '7066615520215932791', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi tư vấn kỹ và cắt tỉ mỉ.'),
        ('staff.1m.huy@stylelock.internal', 'Huy', '7066615520215932791', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi về kiểu layer và highlight.'),
        ('staff.tai.mrtai@stylelock.internal', 'Mr. Tài', '9042415311697934864', 'Tên chủ salon từ khảo sát người dùng; chưa phải tài khoản cá nhân trên StyleLock.'),
        ('staff.tamanh.owner@stylelock.internal', 'Mr. Tâm Anh', '12713669135783038761', 'Tên chủ salon từ khảo sát người dùng; chưa phải tài khoản cá nhân trên StyleLock.'),
        ('staff.tamanh.han@stylelock.internal', 'Ms. Hân', '12713669135783038761', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.padaha.nhuy@stylelock.internal', 'Như Ý', '18311701144106686399', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi tốt về gội đầu.'),
        ('staff.padaha.thuba@stylelock.internal', 'Thu Ba', '18311701144106686399', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi tốt về gội đầu.'),
        ('staff.bo.assigned@stylelock.internal', 'Stylist do salon phân công', '1982887223332079666', 'Nhân sự cụ thể sẽ do salon xác nhận khi tiếp nhận yêu cầu.'),
        ('staff.art.assigned@stylelock.internal', 'Stylist do salon phân công', '11076559846869586685', 'Nhân sự cụ thể sẽ do salon xác nhận khi tiếp nhận yêu cầu.')
)
INSERT INTO users (email, password_hash, full_name, status, created_at, updated_at)
SELECT
    d.email,
    '!STYLELOCK_SYSTEM_ACCOUNT_LOGIN_DISABLED!',
    d.full_name,
    'INACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM staff_seed d
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    status = 'INACTIVE',
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'STAFF'
WHERE u.email LIKE 'staff.%@stylelock.internal'
ON CONFLICT (user_id, role_id) DO NOTHING;

WITH staff_seed (email, salon_cid, bio) AS (
    VALUES
        ('staff.amazing.assigned@stylelock.internal', '14201724843438120981', 'Nhân sự cụ thể sẽ do salon xác nhận khi tiếp nhận yêu cầu.'),
        ('staff.home.nhu@stylelock.internal', '16280854763246570230', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi cắt kỹ và hỗ trợ sửa tóc hỏng.'),
        ('staff.home.bao@stylelock.internal', '16280854763246570230', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.home.thanh@stylelock.internal', '16280854763246570230', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.bin@stylelock.internal', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.truong@stylelock.internal', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.cuong@stylelock.internal', '15759376974258805692', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi tay nghề tốt và biết lắng nghe.'),
        ('staff.traky.hieu@stylelock.internal', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.quoc@stylelock.internal', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.dinh@stylelock.internal', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.traky.tuan@stylelock.internal', '15759376974258805692', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.1m.phuong@stylelock.internal', '7066615520215932791', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi tư vấn kỹ và cắt tỉ mỉ.'),
        ('staff.1m.huy@stylelock.internal', '7066615520215932791', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi về kiểu layer và highlight.'),
        ('staff.tai.mrtai@stylelock.internal', '9042415311697934864', 'Tên chủ salon từ khảo sát người dùng; chưa phải tài khoản cá nhân trên StyleLock.'),
        ('staff.tamanh.owner@stylelock.internal', '12713669135783038761', 'Tên chủ salon từ khảo sát người dùng; chưa phải tài khoản cá nhân trên StyleLock.'),
        ('staff.tamanh.han@stylelock.internal', '12713669135783038761', 'Tên từ khảo sát người dùng; salon xác nhận nhân sự khi tiếp nhận lịch.'),
        ('staff.padaha.nhuy@stylelock.internal', '18311701144106686399', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi tốt về gội đầu.'),
        ('staff.padaha.thuba@stylelock.internal', '18311701144106686399', 'Tên từ khảo sát người dùng; được nhắc đến với phản hồi tốt về gội đầu.'),
        ('staff.bo.assigned@stylelock.internal', '1982887223332079666', 'Nhân sự cụ thể sẽ do salon xác nhận khi tiếp nhận yêu cầu.'),
        ('staff.art.assigned@stylelock.internal', '11076559846869586685', 'Nhân sự cụ thể sẽ do salon xác nhận khi tiếp nhận yêu cầu.')
)
INSERT INTO stylists (user_id, salon_id, bio, experience_years, status, created_at, updated_at)
SELECT
    u.id,
    s.id,
    d.bio,
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM staff_seed d
JOIN users u ON u.email = d.email
JOIN salons s ON s.source_provider = 'GOOGLE_MAPS' AND s.source_place_id = d.salon_cid
ON CONFLICT (user_id) DO UPDATE
SET salon_id = EXCLUDED.salon_id,
    bio = EXCLUDED.bio,
    experience_years = NULL,
    status = 'ACTIVE',
    updated_at = CURRENT_TIMESTAMP;

-- Opening hours verified from the supplied public Google Maps listings.
WITH schedules (salon_cid, default_open, default_close) AS (
    VALUES
        ('14201724843438120981', TIME '09:00', TIME '20:00'),
        ('16280854763246570230', TIME '08:30', TIME '20:00'),
        ('15759376974258805692', TIME '09:00', TIME '21:00'),
        ('7066615520215932791', TIME '08:30', TIME '20:30'),
        ('9042415311697934864', TIME '08:30', TIME '19:30'),
        ('12713669135783038761', TIME '08:30', TIME '22:00'),
        ('18311701144106686399', TIME '09:00', TIME '20:00'),
        ('1982887223332079666', TIME '08:30', TIME '21:00'),
        ('11076559846869586685', TIME '07:30', TIME '20:00')
), hours AS (
    SELECT
        schedule.salon_cid,
        day_number::SMALLINT AS day_of_week,
        CASE
            WHEN schedule.salon_cid = '14201724843438120981' AND day_number = 1 THEN NULL
            ELSE schedule.default_open
        END AS open_time,
        CASE
            WHEN schedule.salon_cid = '14201724843438120981' AND day_number = 1 THEN NULL
            WHEN schedule.salon_cid = '11076559846869586685' AND day_number = 3 THEN TIME '20:30'
            ELSE schedule.default_close
        END AS close_time,
        (schedule.salon_cid = '14201724843438120981' AND day_number = 1) AS is_closed
    FROM schedules schedule
    CROSS JOIN generate_series(1, 7) AS days(day_number)
)
INSERT INTO salon_business_hours (salon_id, day_of_week, open_time, close_time, is_closed)
SELECT s.id, hours.day_of_week, hours.open_time, hours.close_time, hours.is_closed
FROM hours
JOIN salons s
  ON s.source_provider = 'GOOGLE_MAPS' AND s.source_place_id = hours.salon_cid
ON CONFLICT (salon_id, day_of_week) DO UPDATE
SET open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;
