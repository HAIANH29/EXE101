# Yêu cầu hiện trạng hệ thống

Tài liệu này mô tả hành vi đang có trong mã nguồn tại thời điểm 2026-10-02. Đây là tài liệu reverse-engineering, không phải yêu cầu thiết kế mới. Nguồn chính là controller, DTO, service, exception handler, security config, migration và `ai-tryon-service`.

## 1. Quy ước chung

### 1.1 Xác thực và phân quyền

- Backend stateless, dùng JWT Bearer. Mọi route cần JWT hợp lệ trừ các route public được nêu trong từng mục.
- Route public: `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, `/api/auth/refresh`, `/api/auth/logout`, `/api/public/**`, `/api/payment/webhook/**`, Swagger và API docs.
- Role được kiểm tra bằng `@PreAuthorize`: `ADMIN`, `SALON_OWNER`, `STAFF`.
- Request không có JWT hoặc JWT không hợp lệ thường trả HTTP 401. Request có JWT nhưng thiếu role trả HTTP 403.
- Các thao tác thuộc sở hữu người dùng được kiểm tra trong service, không phải lúc nào cũng thể hiện ở controller.

### 1.2 Response thành công

Các endpoint đọc và cập nhật hiện trả HTTP 200; endpoint tạo resource trả HTTP 201 Created. Tất cả dùng:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "timestamp": "2026-10-02T00:00:00Z"
}
```

`message` và `data` có thể bị bỏ qua khi null. Endpoint trả void có `data` null hoặc bị bỏ qua.

Danh sách phân trang nằm trong `data`:

```json
{
  "content": [],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 0,
  "totalPages": 0,
  "last": true
}
```

`page` mặc định 0; `size` mặc định 10; size <= 0 dùng 10; size > 100 bị giới hạn 100. Một số list có sort cố định theo controller, ví dụ booking sort `startAt DESC`.

### 1.3 Response lỗi

Lỗi được chuẩn hóa thành:

```json
{
  "success": false,
  "errorCode": "COMMON_003",
  "message": "Không tìm thấy dữ liệu",
  "timestamp": "2026-10-02T00:00:00Z",
  "path": "/api/...",
  "fieldErrors": [{"field": "email", "message": "..."}]
}
```

`fieldErrors` chỉ có khi validation bằng `@Valid` thất bại.

| Mã | HTTP | Thông báo mặc định |
|---|---:|---|
| `COMMON_001` | 500 | Đã có lỗi xảy ra, vui lòng thử lại sau |
| `COMMON_002` | 400 | Dữ liệu không hợp lệ |
| `COMMON_003` | 404 | Không tìm thấy dữ liệu |
| `COMMON_004` | 401 | Bạn chưa đăng nhập hoặc phiên đã hết hạn |
| `COMMON_005` | 403 | Bạn không có quyền thực hiện hành động này |
| `AUTH_001` | 409 | Email đã được sử dụng |
| `AUTH_002` | 401 | Email hoặc mật khẩu không đúng |
| `AUTH_003` | 401 | Refresh token không hợp lệ hoặc đã hết hạn |
| `AUTH_004` | 403 | Tài khoản đã bị khóa |
| `BOOKING_001` | 409 | Khung giờ này đã có người đặt |
| `BOOKING_002` | 400 | Không thể hủy lịch hẹn vào lúc này |
| `PAYMENT_001` | 409 | Đơn hàng này đã được thanh toán |
| `PAYMENT_002` | 400 | Chữ ký webhook không hợp lệ |
| `TRYON_001` | 400 | File ảnh không hợp lệ |
| `TRYON_002` | 500 | Xử lý thử tóc thất bại, vui lòng thử lại |
| `TRYON_003` | 404 | Không tìm thấy kết quả thử tóc |

Ngoài các mã trên, `BusinessException` có thể ghi đè message bằng thông báo cụ thể của nhánh xử lý. Exception không dự kiến trả `COMMON_001`.

## 2. Hợp đồng dữ liệu dùng bởi API

Các trường không đánh dấu bắt buộc là tùy chọn theo DTO/validation hiện tại.

- `RegisterRequest`: `email` string, bắt buộc, email hợp lệ; `password` string, bắt buộc, dài 6-100; `fullName` string, bắt buộc, tối đa 150; `phone` string tùy chọn.
- `LoginRequest`: `email` string bắt buộc; `password` string bắt buộc.
- `GoogleLoginRequest`: `idToken` string bắt buộc.
- `RefreshTokenRequest`: `refreshToken` string bắt buộc.
- `ChangePasswordRequest`: `oldPassword` string bắt buộc; `newPassword` string bắt buộc, dài 6-100.
- `CreateBookingRequest`: `salonId`, `stylistId`, `serviceId` long bắt buộc; `hairstyleId` long tùy chọn; `startAt` `Instant` bắt buộc; `note` string tùy chọn.
- `CancelBookingRequest`: `reason` string tùy chọn.
- `SalonRequest`: `name` string bắt buộc, tối đa 200; `phone`, `address`, `description`, `imageUrl` string tùy chọn.
- `StatusRequest`: `status` string bắt buộc.
- `CreateStylistRequest`: `userId` long bắt buộc; `bio` string và `experienceYears` integer tùy chọn.
- `UpdateStylistRequest`: `bio`, `experienceYears`, `status` tùy chọn.
- `BusinessHourRequest`: `dayOfWeek` integer bắt buộc, từ 1 đến 7; `openTime`, `closeTime` `LocalTime` tùy chọn; `closed` boolean.
- `ServiceRequest`: `name` string bắt buộc; `description` tùy chọn; `price` số bắt buộc, >= 0; `durationMinutes` integer bắt buộc, >= 1. Update thêm `status` tùy chọn.
- `CategoryRequest`: `name` string bắt buộc; `description` tùy chọn.
- `HairstyleRequest`: `name` và `imageUrl` string bắt buộc; `description`, `categoryId`, `gender` tùy chọn. Update thêm `status` tùy chọn.
- `CreateReviewRequest`: `bookingId` long bắt buộc; `rating` integer bắt buộc, 1-5; `comment` tùy chọn, tối đa 2000.
- `UpdateReviewRequest`: `rating` integer bắt buộc, 1-5; `comment` tùy chọn, tối đa 2000.
- `SepayWebhookRequest`: `id` long, `gateway`, `transactionDate`, `accountNumber`, `content`, `transferType` string, `transferAmount`, `accumulated` số. Source hiện không thể hiện các field này là bắt buộc bằng Bean Validation.

Các response được trả trong `data` gồm các trường tương ứng DTO response: `UserResponse` (id, email, fullName, phone, avatarUrl, status, roles, createdAt); booking response/detail; salon response/detail; stylist response; service response; hairstyle/category response; review/summary; notification; payment; dashboard/report. Mã nguồn DTO là nguồn chuẩn khi khác với tài liệu OpenAPI cũ.

## 3. API hiện tại

### 3.1 Auth

**API-01 - POST `/api/auth/register`**

- Mục đích: tạo tài khoản local và trả phiên đăng nhập.
- Input: JSON `RegisterRequest`; `email`, `password`, `fullName` bắt buộc; `phone` tùy chọn.
- Xác thực: public.
- Thành công: HTTP 200, `data` là login response gồm user, access token và refresh token.
- Lỗi: 400 nếu field không hợp lệ (`COMMON_002` và `fieldErrors`); 409 nếu email đã tồn tại (`AUTH_001`); lỗi khác 500.

**API-02 - POST `/api/auth/login`**

- Mục đích: xác thực email/password.
- Input: JSON `LoginRequest`, cả hai trường bắt buộc.
- Xác thực: public.
- Thành công: HTTP 200, `data` gồm user, access token, refresh token.
- Lỗi: 400 validation; 401 email/password sai (`AUTH_002`); 403 nếu tài khoản bị khóa (`AUTH_004`); lỗi khác 500.

**API-03 - POST `/api/auth/google`**

- Mục đích: xác thực Google ID token do frontend lấy được.
- Input: JSON `{ "idToken": string }`, bắt buộc.
- Xác thực: public; không dùng redirect OAuth của Spring Security.
- Thành công: HTTP 200, login response.
- Lỗi: 400 validation; token Google không hợp lệ có thể thành lỗi xác thực/500 tùy verifier và exception được ném ra; mã cụ thể chưa được xác nhận trong toàn bộ flow.

**API-04 - POST `/api/auth/refresh`**

- Mục đích: đổi refresh token lấy access token mới.
- Input: JSON `RefreshTokenRequest`, `refreshToken` bắt buộc.
- Xác thực: public ở lớp route; token được kiểm tra trong service.
- Thành công: HTTP 200, `data` là token response.
- Lỗi: 400 validation; 401 refresh token sai/hết hạn/đã revoke (`AUTH_003`); lỗi khác 500.

**API-05 - POST `/api/auth/logout`**

- Mục đích: revoke một refresh token.
- Input: JSON `RefreshTokenRequest`, `refreshToken` bắt buộc.
- Xác thực: public ở lớp route; refresh token là input nghiệp vụ.
- Thành công: HTTP 200, success message, không có data.
- Lỗi: 400 validation. Nếu refresh token không tồn tại trong DB, service không ném lỗi và endpoint vẫn trả thành công; logout không gọi `jwtService.isValid` và không trả `AUTH_003` cho token sai/hết hạn.

**API-06 - POST `/api/auth/logout-all`**

- Mục đích: revoke toàn bộ refresh token của user hiện tại.
- Input: không có body.
- Xác thực: JWT bắt buộc.
- Thành công: HTTP 200, success message, không có data.
- Lỗi: 401 thiếu/sai JWT; lỗi khác 500.

**API-07 - GET `/api/auth/me`**

- Mục đích: lấy user hiện tại từ principal.
- Input: không có.
- Xác thực: JWT bắt buộc.
- Thành công: HTTP 200, `data` là `UserResponse`.
- Lỗi: 401 thiếu/sai JWT; 404 nếu user không còn tồn tại; lỗi khác 500.

**API-08 - POST `/api/auth/change-password`**

- Mục đích: đổi mật khẩu của user hiện tại.
- Input: JSON `ChangePasswordRequest`; `oldPassword`, `newPassword` bắt buộc; new password dài 6-100.
- Xác thực: JWT bắt buộc.
- Thành công: HTTP 200, success message.
- Lỗi: 400 validation hoặc mật khẩu cũ không đúng theo exception service; 401 thiếu/sai JWT; 403 nếu tài khoản bị khóa; lỗi khác 500.

### 3.2 Booking

**API-09 - POST `/api/bookings`**

- Mục đích: tạo lịch hẹn.
- Input: JSON `CreateBookingRequest`. `salonId`, `stylistId`, `serviceId`, `startAt` bắt buộc; `hairstyleId`, `note` tùy chọn.
- Xác thực: JWT bắt buộc.
- Thành công: HTTP 201 Created, `data` `BookingResponse`; trạng thái ban đầu là pending theo domain; event tạo payment được phát sau khi lưu booking.
- Lỗi: 400 validation; 404 nếu salon/stylist/service/hairstyle không tồn tại; 400 nếu salon, stylist, service hoặc hairstyle không active, hoặc stylist/service không thuộc salon; 409 `BOOKING_001` nếu slot giao nhau, kể cả bị DB exclusion constraint chặn trong race; lỗi khác 500.

**API-10 - GET `/api/bookings/{bookingId}`**

- Mục đích: xem chi tiết một booking.
- Input: path `bookingId` long bắt buộc.
- Xác thực: JWT; service chỉ cho chủ booking xem.
- Thành công: HTTP 200, `BookingDetailResponse` gồm thông tin booking và tên salon/service/hairstyle.
- Lỗi: 403 nếu không sở hữu; 404 nếu không tồn tại; 401 thiếu JWT.

**API-11 - GET `/api/bookings/me`**

- Mục đích: liệt kê booking của user hiện tại.
- Input: query `page`, `size` tùy chọn; sort `startAt DESC`.
- Xác thực: JWT.
- Thành công: HTTP 200, `PageResponse<BookingResponse>`.
- Lỗi: 401 thiếu/sai JWT; lỗi parse/ngoài phạm vi query có thể 400; lỗi khác 500.

**API-12 - GET `/api/bookings/salon/{salonId}`**

- Mục đích: liệt kê booking của salon.
- Input: path `salonId` long; query `page`, `size` tùy chọn; sort `startAt DESC`.
- Xác thực: JWT + role `SALON_OWNER`; service còn kiểm tra quyền sở hữu salon.
- Thành công: HTTP 200, page booking.
- Lỗi: 401, 403 thiếu role/không sở hữu, 404 salon không tồn tại nếu service kiểm tra; lỗi khác 500.

**API-13 - GET `/api/bookings/stylist/{stylistId}`**

- Mục đích: liệt kê booking theo stylist.
- Input: path `stylistId` long; query `page`, `size` tùy chọn.
- Xác thực: JWT theo global rule; không có `@PreAuthorize` riêng tại controller.
- Thành công: HTTP 200, page booking.
- Lỗi: 401; 404 nếu service không tìm thấy stylist/nguồn dữ liệu; lỗi khác 500. Ownership/role cụ thể chưa được thể hiện ở controller.

**API-14 - PATCH `/api/bookings/{bookingId}/confirm`**

- Mục đích: chuyển booking sang confirmed.
- Input: path `bookingId` long.
- Xác thực: JWT + một trong `SALON_OWNER`, `STAFF`, `ADMIN`.
- Thành công: HTTP 200, `BookingResponse`; phát event booking confirmed.
- Lỗi: 401/403; 404 booking không tồn tại; lỗi trạng thái không hợp lệ do domain; lỗi khác 500.

**API-15 - PATCH `/api/bookings/{bookingId}/cancel`**

- Mục đích: khách hủy booking của mình.
- Input: path `bookingId`; body tùy chọn `CancelBookingRequest`, `reason` tùy chọn.
- Xác thực: JWT; service yêu cầu requester là chủ booking.
- Thành công: HTTP 200, `BookingResponse`; phát event cancelled.
- Lỗi: 401; 403 không phải chủ; 404 không tồn tại; 400 `BOOKING_002` nếu đã cancelled/completed hoặc còn dưới 2 giờ trước giờ hẹn; lỗi khác 500.

**API-16 - PATCH `/api/bookings/{bookingId}/complete`**

- Mục đích: đánh dấu booking hoàn tất.
- Input: path `bookingId`.
- Xác thực: JWT + `SALON_OWNER`, `STAFF` hoặc `ADMIN`.
- Thành công: HTTP 200, `BookingResponse`; phát event completed.
- Lỗi: 401/403; 404; lỗi chuyển trạng thái do domain; lỗi khác 500.

### 3.3 Salon và stylist

**API-17 - POST `/api/salons`**

- Mục đích: tạo salon mới.
- Input: JSON `SalonRequest`; `name` bắt buộc, các trường còn lại tùy chọn.
- Xác thực: JWT + `SALON_OWNER`.
- Thành công: HTTP 201 Created, `SalonResponse`, salon mới ở trạng thái chờ duyệt theo flow service.
- Lỗi: 400 validation; 401/403; lỗi khác 500.

**API-18 - PUT `/api/salons/{salonId}`**

- Mục đích: cập nhật thông tin salon.
- Input: path `salonId`; JSON `SalonRequest`.
- Xác thực: JWT + `SALON_OWNER`; ownership được kiểm tra ở service.
- Thành công: HTTP 200, `SalonResponse`.
- Lỗi: 400 validation; 401/403; 404 salon; lỗi khác 500.

**API-19 - PATCH `/api/salons/{salonId}/status`**

- Mục đích: admin đổi trạng thái salon.
- Input: path `salonId`; JSON `StatusRequest` với `status` bắt buộc.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, `SalonResponse`.
- Lỗi: 400 validation/trạng thái enum sai; 401/403; 404; lỗi khác 500.

**API-20 - GET `/api/salons/{salonId}`**

- Mục đích: xem chi tiết salon.
- Input: path `salonId`.
- Xác thực: JWT.
- Thành công: HTTP 200, `SalonDetailResponse`.
- Lỗi: 401; 404 salon; lỗi khác 500.

**API-21 - GET `/api/salons`**

- Mục đích: tìm/list salon.
- Input: query `status`, `page`, `size` tùy chọn.
- Xác thực: JWT.
- Thành công: HTTP 200, page `SalonResponse`.
- Lỗi: 401; status enum/param parse sai có thể 400; lỗi khác 500.

**API-22 - GET `/api/salons/my-salons`**

- Mục đích: list salon do owner hiện tại sở hữu.
- Input: query `page`, `size` tùy chọn.
- Xác thực: JWT + `SALON_OWNER`.
- Thành công: HTTP 200, page `SalonResponse`.
- Lỗi: 401/403; lỗi khác 500.

**API-23 - PUT `/api/salons/{salonId}/business-hours`**

- Mục đích: thay danh sách giờ hoạt động salon.
- Input: path `salonId`; body JSON array `BusinessHourRequest`; `dayOfWeek` 1-7; giờ là `LocalTime`; `closed` boolean.
- Xác thực: JWT + `SALON_OWNER`; ownership ở service.
- Thành công: HTTP 200, success message, không có data.
- Lỗi: 400 validation, day ngoài 1-7 hoặc giờ không parse được; 401/403; 404 salon; lỗi khác 500.

**API-24 - POST `/api/salons/{salonId}/stylists`**

- Mục đích: thêm user làm stylist cho salon.
- Input: path `salonId`; JSON `CreateStylistRequest`, `userId` bắt buộc.
- Xác thực: JWT + `SALON_OWNER`.
- Thành công: HTTP 201 Created, `StylistResponse`.
- Lỗi: 400 validation hoặc user đã là stylist của salon khác; 401/403; 404 salon. Service không tự tìm user để trả 404, nên userId không tồn tại có thể chỉ lộ ra qua lỗi persistence tùy database.

**API-25 - PUT `/api/stylists/{stylistId}`**

- Mục đích: cập nhật bio, kinh nghiệm, status stylist.
- Input: path `stylistId`; JSON `UpdateStylistRequest`.
- Xác thực: JWT + `SALON_OWNER`.
- Thành công: HTTP 200, `StylistResponse`.
- Lỗi: 400 validation/enum; 401/403; 404; lỗi khác 500.

**API-26 - GET `/api/stylists/{stylistId}`**

- Mục đích: xem stylist.
- Input: path `stylistId`.
- Xác thực: JWT.
- Thành công: HTTP 200, `StylistResponse`.
- Lỗi: 401; 404; lỗi khác 500.

**API-27 - GET `/api/salons/{salonId}/stylists`**

- Mục đích: list stylist của salon.
- Input: path `salonId`; query `page`, `size` tùy chọn.
- Xác thực: JWT.
- Thành công: HTTP 200, page `StylistResponse`.
- Lỗi: 401; service query trực tiếp theo salonId nên id salon không tồn tại có thể trả page rỗng thay vì 404; lỗi khác 500.

### 3.4 Service và catalog kiểu tóc

**API-28 - POST `/api/salons/{salonId}/services`**

- Mục đích: tạo dịch vụ cho salon.
- Input: path `salonId`; JSON `ServiceRequest`: `name`, `price`, `durationMinutes` bắt buộc; `description` tùy chọn.
- Xác thực: JWT + `SALON_OWNER`.
- Thành công: HTTP 201 Created, `ServiceResponse`.
- Lỗi: 400 validation, price âm, duration < 1; 401/403; 404 salon; lỗi khác 500.

**API-29 - PUT `/api/services/{serviceId}`**

- Mục đích: cập nhật dịch vụ.
- Input: path `serviceId`; JSON các trường `ServiceRequest`, thêm `status` tùy chọn.
- Xác thực: JWT + `SALON_OWNER`.
- Thành công: HTTP 200, `ServiceResponse`.
- Lỗi: 400 validation/enum; 401/403; 404; lỗi khác 500.

**API-30 - GET `/api/services/{serviceId}`**

- Mục đích: xem một dịch vụ.
- Input: path `serviceId`.
- Xác thực: JWT.
- Thành công: HTTP 200, `ServiceResponse`.
- Lỗi: 401; 404; lỗi khác 500.

**API-31 - GET `/api/salons/{salonId}/services`**

- Mục đích: list dịch vụ của salon.
- Input: path `salonId`; query `page`, `size` tùy chọn.
- Xác thực: JWT.
- Thành công: HTTP 200, page `ServiceResponse`.
- Lỗi: 401; service query trực tiếp theo salonId nên id salon không tồn tại có thể trả page rỗng thay vì 404; lỗi khác 500.

**API-32 - POST `/api/catalog/hairstyles`**

- Mục đích: admin tạo kiểu tóc trong catalog.
- Input: JSON `HairstyleRequest`; `name`, `imageUrl` bắt buộc; `description`, `categoryId`, `gender` tùy chọn.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 201 Created, `HairstyleResponse`.
- Lỗi: 400 validation hoặc gender enum; 401/403; 404 category nếu có nhưng không tồn tại; lỗi khác 500.

**API-33 - PUT `/api/catalog/hairstyles/{hairstyleId}`**

- Mục đích: admin cập nhật kiểu tóc.
- Input: path `hairstyleId`; body `HairstyleRequest` thêm `status` tùy chọn.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, `HairstyleResponse`.
- Lỗi: 400 validation/enum; 401/403; 404; lỗi khác 500.

**API-34 - GET `/api/catalog/hairstyles/{hairstyleId}`**

- Mục đích: xem kiểu tóc.
- Input: path `hairstyleId`.
- Xác thực: JWT.
- Thành công: HTTP 200, `HairstyleResponse`.
- Lỗi: 401; 404; lỗi khác 500.

**API-35 - GET `/api/catalog/hairstyles`**

- Mục đích: list kiểu tóc, có thể lọc category.
- Input: query `categoryId`, `page`, `size` tùy chọn.
- Xác thực: JWT.
- Thành công: HTTP 200, page `HairstyleResponse`.
- Lỗi: 401; query parse sai có thể 400; lỗi khác 500.

**API-36 - POST `/api/salons/{salonId}/hairstyles/{hairstyleId}`**

- Mục đích: owner gán kiểu tóc catalog vào salon.
- Input: path `salonId`, `hairstyleId`; không body.
- Xác thực: JWT + `SALON_OWNER`; ownership ở service.
- Thành công: HTTP 200, success message.
- Lỗi: 401/403; 404 salon/hairstyle; lỗi duplicate hoặc trạng thái không hợp lệ tùy service; lỗi khác 500.

**API-37 - DELETE `/api/salons/{salonId}/hairstyles/{hairstyleId}`**

- Mục đích: bỏ gán kiểu tóc khỏi salon.
- Input: hai path id.
- Xác thực: JWT + `SALON_OWNER`.
- Thành công: HTTP 200, success message.
- Lỗi: 401/403; 404 hoặc lỗi quan hệ không tồn tại tùy service; lỗi khác 500.

**API-38 - GET `/api/salons/{salonId}/hairstyles`**

- Mục đích: list kiểu tóc salon đang cung cấp.
- Input: path `salonId`.
- Xác thực: JWT.
- Thành công: HTTP 200, mảng `HairstyleResponse`.
- Lỗi: 401; service lấy quan hệ theo salonId nên id salon không tồn tại có thể trả mảng rỗng thay vì 404; lỗi khác 500.

**API-39 - POST `/api/catalog/hairstyle-categories`**

- Mục đích: admin tạo category kiểu tóc.
- Input: JSON `CategoryRequest`; `name` bắt buộc, `description` tùy chọn.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 201 Created, category response.
- Lỗi: 400 validation; 401/403; lỗi khác 500.

**API-40 - GET `/api/catalog/hairstyle-categories`**

- Mục đích: lấy toàn bộ category.
- Input: không có.
- Xác thực: JWT.
- Thành công: HTTP 200, mảng category response.
- Lỗi: 401; lỗi khác 500.

### 3.5 Review

**API-41 - POST `/api/reviews`**

- Mục đích: khách tạo review cho booking đã hoàn tất.
- Input: JSON `CreateReviewRequest`; `bookingId`, `rating` bắt buộc; comment tối đa 2000.
- Xác thực: JWT.
- Thành công: HTTP 201 Created, `ReviewResponse`.
- Lỗi: 400 validation; 403 nếu không phải customer của booking; 404 booking; 400 nếu booking chưa completed hoặc đã có review; lỗi khác 500.

**API-42 - PUT `/api/reviews/{reviewId}`**

- Mục đích: chủ review cập nhật review.
- Input: path `reviewId`; JSON `UpdateReviewRequest`.
- Xác thực: JWT; service kiểm tra owner.
- Thành công: HTTP 200, `ReviewResponse`.
- Lỗi: 400 validation; 403 không phải chủ; 404 review; lỗi khác 500.

**API-43 - GET `/api/reviews/{reviewId}`**

- Mục đích: xem review.
- Input: path `reviewId`.
- Xác thực: JWT.
- Thành công: HTTP 200, `ReviewResponse`.
- Lỗi: 401; 404 review; lỗi khác 500.

**API-44 - GET `/api/salons/{salonId}/reviews`**

- Mục đích: list review của salon.
- Input: path `salonId`; query `page`, `size` tùy chọn.
- Xác thực: JWT.
- Thành công: HTTP 200, page `ReviewResponse`.
- Lỗi: 401; query parse sai có thể 400; service query trực tiếp theo salonId nên salon không tồn tại có thể trả page rỗng; lỗi khác 500.

**API-45 - GET `/api/salons/{salonId}/reviews/summary`**

- Mục đích: lấy điểm trung bình và tổng số review salon.
- Input: path `salonId`.
- Xác thực: JWT.
- Thành công: HTTP 200, `SalonRatingSummaryResponse` gồm salonId, averageRating, totalReviews; không có review trả average 0.0.
- Lỗi: 401; không có bước kiểm tra salon tồn tại trong service review; salon không có review trả summary average 0.0/total 0, kể cả khi id salon không tồn tại; lỗi khác 500.

### 3.6 Notification

**API-46 - GET `/api/notifications`**

- Mục đích: list notification của user hiện tại, mới nhất trước.
- Input: query `page`, `size` tùy chọn.
- Xác thực: JWT; service lọc theo userId trong token.
- Thành công: HTTP 200, page `NotificationResponse`.
- Lỗi: 401; lỗi query có thể 400; lỗi khác 500.

**API-47 - GET `/api/notifications/unread-count`**

- Mục đích: đếm notification chưa đọc của user.
- Input: không có.
- Xác thực: JWT.
- Thành công: HTTP 200, `data` là số nguyên long.
- Lỗi: 401; lỗi khác 500.

**API-48 - PATCH `/api/notifications/{notificationId}/read`**

- Mục đích: đánh dấu một notification đã đọc.
- Input: path `notificationId`.
- Xác thực: JWT; service kiểm tra notification thuộc user.
- Thành công: HTTP 200, success message.
- Lỗi: 401; 403 không sở hữu; 404 notification; lỗi khác 500.

**API-49 - PATCH `/api/notifications/read-all`**

- Mục đích: đánh dấu toàn bộ notification của user đã đọc.
- Input: không có.
- Xác thực: JWT.
- Thành công: HTTP 200, success message.
- Lỗi: 401; lỗi khác 500.

### 3.7 Payment

**API-50 - GET `/api/bookings/{bookingId}/payment`**

- Mục đích: xem payment của booking thuộc user hiện tại.
- Input: path `bookingId`.
- Xác thực: JWT; service kiểm tra customer sở hữu booking.
- Thành công: HTTP 200, `PaymentResponse`: id, bookingId, provider, transactionId, referenceCode, amount, status, paymentUrl, paidAt, createdAt.
- Lỗi: 401; 403 không sở hữu; 404 booking/payment; lỗi khác 500.

**API-51 - GET `/api/payments/{paymentId}`**

- Mục đích: xem payment theo id.
- Input: path `paymentId`.
- Xác thực: JWT; service truy ngược booking và chỉ cho customer sở hữu booking xem payment.
- Thành công: HTTP 200, `PaymentResponse`.
- Lỗi: 401; 403 nếu không sở hữu booking; 404 payment/booking; lỗi khác 500.

**API-52 - POST `/api/payment/webhook/sepay`**

- Mục đích: nhận thông báo giao dịch từ SePay.
- Input: JSON `SepayWebhookRequest`; header Authorization phải chứa API key SePay cấu hình.
- Xác thực: permitAll ở Spring Security nhưng kiểm tra API key thủ công trong controller.
- Thành công: HTTP 200 với acknowledgement `{"success":true}`. Giao dịch tiền ra bị bỏ qua; không tìm thấy payment pending khớp, khớp nhiều payment hoặc chuyển thiếu vẫn trả 200 để tránh SePay retry; transaction đã xử lý được bỏ qua.
- Lỗi: 400 nếu payload thiếu `id`, `content`, `transferType` hoặc `transferAmount`; 401 nếu Authorization không đúng, body là plain text `Unauthorized`; lỗi khác 500.

### 3.8 Admin

**API-53 - GET `/api/admin/users`**

- Mục đích: admin list user.
- Input: query `status`, `page`, `size` tùy chọn.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, page `UserResponse`.
- Lỗi: 401/403; status/query sai có thể 400; lỗi khác 500.

**API-54 - PATCH `/api/admin/users/{userId}/status`**

- Mục đích: admin đổi trạng thái user.
- Input: path `userId`; JSON `StatusRequest`, status bắt buộc.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, `UserResponse`.
- Lỗi: 400 validation/enum; 401/403; 404 user; lỗi khác 500.

**API-55 - GET `/api/admin/salons`**

- Mục đích: admin list salon theo status.
- Input: query `status`, `page`, `size` tùy chọn.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, page `SalonResponse`.
- Lỗi: 401/403; status/query sai có thể 400; lỗi khác 500.

**API-56 - PATCH `/api/admin/salons/{salonId}/approve`**

- Mục đích: admin duyệt salon.
- Input: path `salonId`, không body.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, `SalonResponse`.
- Lỗi: 401/403; 404 salon; lỗi trạng thái không phù hợp tùy service; lỗi khác 500.

**API-57 - PATCH `/api/admin/salons/{salonId}/reject`**

- Mục đích: admin từ chối salon.
- Input: path `salonId`, không body.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, `SalonResponse`.
- Lỗi: 401/403; 404 salon; lỗi trạng thái không phù hợp tùy service; lỗi khác 500.

### 3.9 Reporting

**API-58 - GET `/api/dashboard/overview`**

- Mục đích: tổng quan dashboard admin.
- Input: không có.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, `DashboardOverviewResponse` gồm tổng user, user mới, tổng salon, salon active/pending, tổng booking, booking pending/completed/cancelled và revenue; khoảng thời gian là từ đầu tháng hiện tại theo `Asia/Ho_Chi_Minh` đến hiện tại.
- Lỗi: 401/403; lỗi khác 500.

**API-59 - GET `/api/dashboard/revenue`**

- Mục đích: báo cáo revenue trong khoảng thời gian.
- Input: query `from`, `to` bắt buộc, parse thành `Instant` ISO date-time.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, `RevenueReportResponse` gồm from, to, revenue, totalBookings.
- Lỗi: 400 nếu thiếu, không parse được from/to hoặc `from > to`; 401/403; lỗi khác 500.

**API-60 - GET `/api/dashboard/bookings/statistics`**

- Mục đích: đếm booking theo trạng thái.
- Input: không có.
- Xác thực: JWT + `ADMIN`.
- Thành công: HTTP 200, `BookingStatisticsResponse` gồm pending, confirmed, completed, cancelled và total là tổng bốn số.
- Lỗi: 401/403; lỗi khác 500.

### 3.10 Try-on

**API-61 - POST `/api/tryon`**

- Mục đích: upload ảnh khách, lưu ảnh gốc, gọi AI tính vị trí overlay tóc; không tạo ảnh ghép cuối.
- Input: `multipart/form-data`: part `image` là `MultipartFile` bắt buộc; part `hairstyleId` là Long bắt buộc.
- Xác thực: JWT bắt buộc; controller lấy `userId` từ `CustomUserDetails` và truyền vào service.
- Thành công theo code: HTTP 201 Created, message `Đã tính vị trí thử tóc, chờ khách chỉnh`; `data` gồm requestId, status `READY_FOR_ADJUST`, hairstyleImageUrl, x, y, width, height.
- Lỗi: 400 `TRYON_001` nếu file rỗng, > 5 MB, content type không phải `image/jpeg`, `image/png`, `image/webp`, hoặc filename null/chứa `..`; 500 `TRYON_002` nếu Java không gọi được AI; lỗi lưu DB/storage khác có thể 500. AI không tìm thấy mẫu tóc hoặc không phát hiện mặt được Python ném lỗi, Java gom thành `TRYON_002`.

**API-62 - PUT `/api/tryon/{requestId}/finalize`**

- Mục đích: nhận tọa độ ảnh đã được frontend điều chỉnh, server-side merge ảnh bằng Python AI service, lưu ảnh kết quả.
- Input: path `requestId` Long; body JSON `TryOnFinalizeRequest` chứa `x, y, width, height` bắt buộc.
- Xác thực: JWT bắt buộc; service chỉ truy cập request thuộc `userId` hiện tại.
- Thành công theo code: HTTP 200, message `Lưu kết quả thử tóc thành công`; `data` gồm requestId, status `DONE`, resultImageUrl.
- Lỗi: 400 nếu payload JSON sai; 404 resource not found nếu requestId không tồn tại (`COMMON_003` theo ResourceNotFoundException); 500 nếu gọi AI `/merge` hoặc upload/DB lỗi. Bảng `tryon_results` unique theo request_id nên finalize lần hai có thể gây lỗi 500 nếu không được xử lý.

### 3.11 Availability, reschedule và try-on result

**API-63 - GET `/api/bookings/salon/{salonId}/stylists/{stylistId}/availability`**

- Mục đích: xem giờ mở cửa và các khoảng đã có booking của stylist trong một ngày.
- Input: path `salonId`, `stylistId`; query `date` kiểu ISO `LocalDate`, bắt buộc.
- Xác thực: JWT.
- Thành công: HTTP 200, `AvailabilityResponse` gồm salonId, stylistId, date, closed, openTime, closeTime và `bookedIntervals[{startAt,endAt}]`. Booking CANCELLED không xuất hiện.
- Lỗi: 400 nếu date không parse được hoặc stylist không thuộc salon/không active; 401 thiếu JWT; 404 salon/stylist; lỗi khác 500.

**API-64 - PATCH `/api/bookings/{bookingId}/reschedule`**

- Mục đích: khách đổi thời gian booking của mình.
- Input: path `bookingId`; JSON `{ "startAt": "..." }`, startAt bắt buộc và phải ở tương lai.
- Xác thực: JWT; service kiểm tra owner.
- Thành công: HTTP 200, `BookingResponse` với endAt tính theo duration dịch vụ; giữ nguyên salon, stylist, service và giá snapshot.
- Lỗi: 400 nếu validation, booking không ở PENDING/CONFIRMED, còn dưới 2 giờ, hoặc dịch vụ không active; 403 không phải owner; 404 booking/service; 409 `BOOKING_001` nếu trùng slot, kể cả race DB.

**API-65 - GET `/api/tryon/{requestId}/result`**

- Mục đích: đọc ảnh kết quả try-on đã finalize.
- Input: path `requestId`.
- Xác thực: JWT; chỉ user sở hữu request được đọc.
- Thành công: HTTP 200, `TryOnResultResponseDto` gồm requestId, status, resultImageUrl, createdAt.
- Lỗi: 404 request không thuộc user/không tồn tại (`COMMON_003`) hoặc request chưa có result (`TRYON_003`); 401 thiếu JWT; lỗi khác 500.

**API-66 - GET `/api/tryon/results`**

- Mục đích: list các kết quả try-on đã hoàn tất của user hiện tại.
- Input: query `page`, `size` tùy chọn.
- Xác thực: JWT; chỉ lấy request của user hiện tại có status DONE.
- Thành công: HTTP 200, `PageResponse<TryOnResultResponseDto>`.
- Lỗi: 401 thiếu/sai JWT; lỗi query có thể 400; lỗi khác 500.

## 4. Hàm logic quan trọng

**FUNC-01 - `BookingServiceImpl.createBooking(customerId, request)`**

- Mục đích: xác thực các entity liên quan, tính thời gian kết thúc, chống trùng slot và tạo booking.
- Input: customerId từ JWT; salonId, stylistId, serviceId, hairstyleId tùy chọn, startAt, note.
- Output: `BookingResponse`; phát `BookingCreatedEvent` sau khi insert thành công.
- Quy tắc: salon/stylist/service phải tồn tại và active; stylist/service phải thuộc salon; hairstyle nếu có phải active; `endAt = startAt + durationMinutes`; kiểm tra overlap ở application rồi flush để bắt exclusion constraint DB. Slot race trả `BOOKING_001`.

**FUNC-02 - `BookingServiceImpl.cancelBooking(bookingId, requesterId, request)`**

- Kiểm tra owner; không cho hủy booking cancelled/completed; phải còn ít nhất 2 giờ trước `startAt`; phát event có reason tùy chọn. Vi phạm trả 403 hoặc `BOOKING_002`.

**FUNC-03 - `BookingServiceImpl.confirmBooking` và `completeBooking`**

- Tìm booking, gọi chuyển trạng thái trong domain, phát event tương ứng, trả `BookingResponse`. Booking không tồn tại hoặc chuyển trạng thái không hợp lệ là lỗi.

**FUNC-04 - `ReviewServiceImpl.createReview(customerId, request)`**

- Lấy booking; requester phải là customer; booking phải completed; mỗi booking chỉ một review; rating/comment đã được DTO validate. Output là review mới; các vi phạm trả 403, 404 hoặc 400.

**FUNC-05 - `ReviewServiceImpl.updateReview(reviewId, customerId, request)`**

- Tìm review, kiểm tra owner, cập nhật rating/comment. Output `ReviewResponse`; lỗi owner 403, không tồn tại 404.

**FUNC-06 - `PaymentServiceImpl.createPaymentForBooking(bookingId, amount)`**

- Nếu payment đã tồn tại thì bỏ qua; nếu chưa có, tạo reference dạng `DH` + bookingId + 4 ký tự random, tạo QR URL và lưu payment pending. Đây là logic nội bộ qua booking event, không có endpoint create payment.

**FUNC-07 - `PaymentServiceImpl.handleSepayWebhook(payload)`**

- Chỉ xử lý transfer incoming. Bỏ qua transactionId đã xử lý; tìm tất cả payment pending khớp nội dung và chỉ xử lý khi có đúng một payment. Không tìm thấy, khớp nhiều payment hoặc amount chuyển nhỏ hơn amount yêu cầu thì log và return. Amount bằng/lớn hơn thì mark paid và phát `PaymentCompletedEvent`.

**FUNC-08 - `NotificationServiceImpl.getMyNotifications/countUnread/markAsRead/markAllAsRead`**

- List/count chỉ theo userId hiện tại. Mark một notification phải tìm thấy và đúng owner; mark-all cập nhật toàn bộ của user. Không sở hữu trả 403, không tồn tại trả 404.

**FUNC-09 - `AuthServiceImpl.logout` và `AuthServiceImpl.refreshToken`**

- `refreshToken` validate JWT, tìm token hash, kiểm tra chưa revoke, revoke token cũ rồi rotate access/refresh token; token sai, không tìm thấy hoặc không còn valid trả `AUTH_003`.
- `logout` chỉ hash raw token, tìm bản ghi rồi revoke nếu có; không validate JWT và không báo lỗi nếu token không có trong DB.

**FUNC-10 - `ReportingServiceImpl.getDashboardOverview/getRevenueReport/getBookingStatistics`**

- Chỉ đọc dữ liệu qua service module khác. Overview tính tháng hiện tại theo múi giờ Việt Nam; revenue dùng khoảng Instant truyền vào; statistics cộng pending, confirmed, completed, cancelled thành total.

**FUNC-11 - `HairstyleServiceImpl.createHairstyle/updateHairstyle/assignToSalon/unassignFromSalon`**

- Tạo/cập nhật catalog kiểu tóc, chuyển string gender/status sang enum, tìm entity không có thì ResourceNotFound; owner gán/bỏ gán kiểu tóc catalog vào salon của mình.

**FUNC-12 - `SalonService` và `StylistService` ownership/status operations**

- Tạo salon gắn với owner hiện tại; owner sửa salon, business hours, stylist và service theo các service public. Admin thay trạng thái salon. Chi tiết ownership cụ thể phụ thuộc implementation/service method và không phải route nào cũng có controller annotation riêng.

**FUNC-13 - `TryOnService.process` và `TryOnService.finalize`**

- `process(file, hairstyleId, userId)`: Validate file, upload vào `tryon/originals`, lưu request PENDING, gọi Java `AiTryOnClient.computeOverlay`, rồi đổi status thành `READY_FOR_ADJUST` và map overlay. Có cơ chế compensation: nếu lỗi (AI hoặc DB), sẽ xóa file vừa upload trên Cloudinary.
- `finalize(requestId, request, userId)`: Lấy tọa độ từ request JSON, gọi Java `AiTryOnClient.mergeImages`, nhận base64 kết quả, decode và upload lên Cloudinary `tryon/results`, lưu kết quả vào DB. Có compensation tự động xóa ảnh nếu lưu DB thất bại.

**FUNC-14 - Python `compute_overlay(image_url, hairstyle_id)`**

- `compute_overlay(image_url, hairstyle_id)`: Tải ảnh gốc và ảnh tóc, tính toán bằng MediaPipe Face Mesh, trả về tọa độ đặt tóc.
- `merge_images(image_url, hairstyle_image_url, x, y, width, height)`: Tải 2 ảnh, resize ảnh tóc theo tọa độ, dùng Pillow dán ảnh tóc lên ảnh gốc bằng alpha channel mask, sau đó convert sang JPEG và encode Base64 trả về cho Java.

**FUNC-15 - `ImageFileValidator.validate(file)`

- Từ chối null/rỗng, lớn hơn 5 MB, content type ngoài JPEG/PNG/WebP, filename null hoặc chứa `..`; mỗi trường hợp ném `TRYON_001` với message cụ thể.

**FUNC-16 - `PaginationUtils.of(page, size, sortBy, sortDirection)`

- Chuẩn hóa page âm/null về 0, size null/<=0 về 10, size tối đa 100; sort direction chỉ DESC khi chuỗi bằng DESC, còn lại ASC.

## 5. Cảnh báo và cần xác nhận

1. Comment cũ trong `docs/api-inventory.md`, `docs/feature-coverage.md`, `docs/openapi.yaml` vẫn nói try-on chưa tồn tại hoặc tất cả success là HTTP 200, trái với source hiện tại. Cần cập nhật các tài liệu này theo `requirements.md` hoặc chỉ định một nguồn chuẩn duy nhất.
2. `TRYON_RESULT_NOT_FOUND` vẫn được khai báo nhưng chưa có endpoint đọc result; hiện chỉ có finalize và không có API get/list kết quả.
3. [Đã xử lý] `GET /api/payments/{paymentId}` kiểm tra ownership qua booking/customer trước khi trả payment.
4. [Đã xử lý một phần] Webhook SePay đã validate field chính, chống transaction trùng, reject match mơ hồ và có unique index `transaction_id`; vẫn cần test với payload thật của SePay.
5. [Đã xử lý một phần] AI service có internal token, giới hạn concurrency, HTTPS host allowlist và giới hạn bytes ảnh; production phải cấu hình `AI_TRYON_INTERNAL_TOKEN` và `AI_ALLOWED_IMAGE_HOSTS`, không để token rỗng.
6. Chưa có test tự động hoặc runtime smoke test cho flow try-on mới: JWT ownership, request status, duplicate finalize, AI timeout, ảnh không có mặt, ảnh nhiều mặt, URL ảnh lỗi và payload webhook thiếu field.
8. Python service có health endpoint và báo `DEGRADED` nếu thiếu internal token, nhưng chưa kiểm tra readiness thực tế của MediaPipe hoặc khả năng tải các nguồn ảnh.
9. [Đã xử lý] Booking validate `startAt` phải ở tương lai; revenue từ chối `from > to`; domain chỉ cho chuyển trạng thái `PENDING -> CONFIRMED -> COMPLETED`. Chưa có test runtime xác nhận đầy đủ các chuyển trạng thái.
10. [Đã xử lý] Đã thêm `BookingReminderService` (cron job nhắc lịch tự động trước 2 giờ) và tạo `BookingReminderEvent` gửi qua notification.
11. [Đã xử lý] AI service giờ có endpoint `/merge` (server-side merge bằng Python Pillow); Java gửi tọa độ thay vì ảnh client tự merge.
12. [Đã xử lý] Đã thêm logic compensation trong `TryOnService`: catch Exception và gọi `StorageService.delete` để dọn file orphan Cloudinary ngay khi giao dịch lỗi.
13. Đã thêm `AuditLog`, `AuditFilter` (global) để log lại tất cả access/time/userId cho toàn bộ request `/api/`.
14. [Đã xử lý] Tài liệu cũ `docs/api-inventory.md`, `docs/feature-coverage.md` đã được cập nhật đồng bộ để phản ánh đúng danh sách 68 endpoint.

## 6. Phạm vi chưa có trong code

Không thấy endpoint cho payment initiate trực tiếp từ cổng thanh toán. Try-on result, availability, reschedule, audit log, nhắc lịch, xóa user, **và refund payment** đã được thêm.
