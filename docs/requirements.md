# TÀI LIỆU YÊU CẦU VÀ CONTEXT HỆ THỐNG STYLELOCK (EXE101)

> **Mục đích tài liệu**: Đây là tài liệu quy chuẩn kỹ thuật (System Architecture & Context Reference) phản ánh chính xác 100% mã nguồn dự án tại thời điểm **14/10/2026**.  
> **Dành cho AI & Developers**: Bất kỳ AI Assistant (Cursor, Antigravity, Claude, ChatGPT...) hoặc Lập trình viên nào khi tham gia phát triển dự án **BẮT BUỘC** phải tuân thủ nghiêm ngặt các quy ước kiến trúc, luồng dữ liệu, mã lỗi, ràng buộc toàn vẹn và hợp đồng API được mô tả trong tài liệu này để tránh sinh code sai lệch hoặc phá vỡ cấu trúc modular của hệ thống.

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

StyleLock được thiết kế theo mô hình **Modular Monolith** (Clean Architecture kết hợp Ports & Adapters) ở phía Backend và **Microservice chuyên biệt** cho xử lý Trí tuệ nhân tạo (AI Try-On).

```
                      +---------------------------------------+
                      |      Client Web / Mobile (React)      |
                      +---------------------------------------+
                                          |
                                    HTTP / JSON (JWT)
                                          v
+-----------------------------------------------------------------------------------+
|                        STYLELOCK BACKEND (Spring Boot 3 / Java 21)               |
|                                                                                   |
|  [SecurityFilterChain & AuditFilter] -> logs all /api/**                          |
|                                                                                   |
|  +--------------------+  +--------------------+  +--------------------+           |
|  |    auth module     |  |   booking module   |  |    salon module    |           |
|  | - OTP & Password   |  | - Overlap check    |  | - Salons & Stylists|           |
|  | - JWT & GoogleAuth |  | - Reschedule/Cancel|  | - Business Hours   |           |
|  +--------------------+  +--------------------+  +--------------------+           |
|            |                        |                       |                     |
|  +--------------------+  +--------------------+  +--------------------+           |
|  |   catalog module   |  |   payment module   |  |  review & notify   |           |
|  | - Hair & Services  |  | - SePay Webhook    |  | - Ratings / Reviews|           |
|  | - Categories       |  | - Salon Pro Sub    |  | - Event Listeners  |           |
|  +--------------------+  +--------------------+  +--------------------+           |
|            |                        |                       |                     |
|  +--------------------+  +--------------------+  +--------------------+           |
|  |    admin module    |  |  reporting module  |  |    tryon module    |           |
|  | - User/Salon mgt   |  | - Stats & Revenue  |  | - Image validation |           |
|  | - Refund handling  |  | - Dashboard views  |  | - WebClient to AI  |           |
|  +--------------------+  +--------------------+  +--------------------+           |
|                                     |                                             |
|        [Spring ApplicationEventPublisher: AFTER_COMMIT / REQUIRES_NEW]             |
+-----------------------------------------------------------------------------------+
             |                                             |
             v                                             v
+-----------------------------+               +--------------------------------------+
|    PostgreSQL 16 (GIST)     |               |  AI Try-On Service (FastAPI / Python)|
|  - Flyway V1 - V105         |               |  - Replicate Custom-Hair Diffusion   |
|  - Exclusion Constraints    |               |  - Cloudinary Storage Bridge         |
+-----------------------------+               +--------------------------------------+
```

### 1.1 Nguyên tắc phân tách Module (Package by Feature)
1. Mã nguồn nằm trong package gốc: `be.exe`.
2. Danh sách các module nghiệp vụ độc lập:
   - `be.exe.auth`: Quản lý tài khoản, phân quyền, JWT, OTP email, Forgot password.
   - `be.exe.booking`: Nghiệp vụ đặt lịch hẹn, kiểm tra trùng lịch, đổi lịch, hủy lịch.
   - `be.exe.salon`: Quản lý hồ sơ salon, chi nhánh, thợ làm tóc (stylist), khung giờ mở cửa.
   - `be.exe.catalog`: Quản lý danh mục kiểu tóc (hairstyles), thể loại tóc, bảng giá dịch vụ.
   - `be.exe.payment`: Tích hợp cổng SePay (VietQR), gói Salon Pro, quản lý hoàn tiền.
   - `be.exe.review`: Đánh giá 1-5 sao và bình luận của khách hàng cho lịch hẹn đã hoàn thành.
   - `be.exe.notification`: Trung tâm phát và lưu trữ thông báo người dùng theo event.
   - `be.exe.tryon`: Xử lý yêu cầu thử tóc ảo, kết nối sang service AI.
   - `be.exe.admin`: Các API vận hành cấp cao dành riêng cho Quản trị viên hệ thống.
   - `be.exe.reporting`: Tổng hợp số liệu thống kê, báo cáo doanh thu và dashboard.
   - `be.exe.common`: Các thành phần dùng chung (Security filter, Base DTOs, Exception handler, Storage interface, Audit filter).

### 1.2 Nguyên tắc giao tiếp giữa các Module (Anti-Coupling Rules)
- **TUYỆT ĐỐI KHÔNG** import trực tiếp `Entity` hoặc `Repository` của module này vào module khác.
- Khi module A cần dữ liệu từ module B, **BẮT BUỘC** gọi qua `Service` interface công khai của module B (hoặc qua Port interface).
- Dữ liệu trả về giữa các module sử dụng các Summary Record:
  - `SalonService.getSalonOrThrow(Long id) -> SalonSummaryResponse`
  - `StylistService.getStylistOrThrow(Long id) -> StylistSummaryResponse`
  - `ServiceCatalogService.getServiceOrThrow(Long id) -> ServiceCatalogSummaryResponse`
  - `HairstyleService.getHairstyleOrThrow(Long id) -> HairstyleSummaryResponse`
  - `BookingService.getBookingOrThrow(Long id) -> BookingSummaryResponse`
- Khi cần thực hiện side-effects (ví dụ: tạo booking -> tạo payment pending; thanh toán xong -> gửi notification), **BẮT BUỘC** dùng cơ chế **Spring Domain Events** (`ApplicationEventPublisher`).

### 1.3 Ma trận Sự kiện Hệ thống (Event Choreography)
Tất cả event listener liên module đều bắt buộc dùng `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` kết hợp `@Transactional(propagation = Propagation.REQUIRES_NEW)`:

| Sự kiện (`domain.event`) | Module phát | Module lắng nghe | Hành động kích hoạt |
|---|---|---|---|
| `BookingCreatedEvent` | `booking` | `payment`<br>`notification` | - Tạo bản ghi `Payment` PENDING (phí 5.000đ + tiền dịch vụ).<br>- Gửi thông báo cho khách hoàn tất thanh toán. |
| `BookingConfirmedEvent` | `booking` | `notification` | Gửi thông báo cho khách: salon đã xác nhận lịch hẹn. |
| `BookingCancelledEvent` | `booking` | `payment`<br>`notification` | - Cập nhật trạng thái Payment sang `CANCELLED`.<br>- Gửi thông báo lý do hủy lịch hẹn. |
| `BookingCompletedEvent` | `booking` | `notification` | Gửi thông báo cảm ơn và mời khách hàng đánh giá salon. |
| `BookingReminderEvent` | `booking` (scheduler) | `notification` | Gửi thông báo nhắc khách lịch hẹn sắp diễn ra trong 2 giờ. |
| `PaymentCompletedEvent` | `payment` (webhook) | `notification` | Gửi thông báo xác nhận thanh toán thành công. |
| `PaymentRefundRequestedEvent` | `payment` | `notification` | Gửi thông báo đang xử lý hoàn tiền cho lịch hẹn bị hủy. |
| `PaymentRefundedEvent` | `payment` (admin) | `notification` | Gửi thông báo hoàn tiền thành công kèm mã đối soát. |

---

## 2. BẢO MẬT, XÁC THỰC VÀ VÒNG ĐỜI TÀI KHOẢN

### 2.1 Cơ chế JWT & Phân quyền (Security & Claims)
- **Kiến trúc**: Stateless Session (`SessionCreationPolicy.STATELESS`). Mọi request xác thực qua HTTP Header `Authorization: Bearer <access-token>`.
- **Claims trong Token**:
  - `sub`: ID người dùng (String dạng số).
  - `email`: Địa chỉ email.
  - `roles`: Danh sách quyền (ví dụ `["ROLE_CUSTOMER"]`, `["ROLE_SALON_OWNER"]`).
- **Thời hạn Token**:
  - Access Token: Mặc định 1 giờ (`app.jwt.access-token-expiration-ms: 3600000`).
  - Refresh Token: Mặc định 7 ngày (`app.jwt.refresh-token-expiration-ms: 604800000`).
- **Cơ chế Token Rotation**:
  - Refresh token được lưu trong bảng `refresh_tokens` dưới dạng hash SHA-256 (`token_hash`).
  - Khi gọi `POST /api/auth/refresh`, token cũ lập tức bị thu hồi (`revoked = true`) và hệ thống phát sinh cặp Access/Refresh Token mới.
  - Hỗ trợ `POST /api/auth/logout-all`: thu hồi toàn bộ refresh token chưa hết hạn của người dùng.
- **Cách lấy User hiện tại trong Controller**:
  ```java
  @GetMapping("/me")
  public ResponseEntity<ApiResponse<UserResponse>> getMe(
          @AuthenticationPrincipal CustomUserDetails principal) {
      Long currentUserId = principal.getUserId();
      // ...
  }
  ```

### 2.2 Danh mục Vai trò (Roles) và Trạng thái (Statuses)
- **RoleName**:
  - `ADMIN`: Quản trị viên toàn hệ thống, toàn quyền duyệt salon, quản lý user, hoàn tiền, báo cáo doanh thu.
  - `SALON_OWNER`: Chủ salon. Được quản lý thông tin salon, stylist, dịch vụ, giờ hoạt động, xem lịch hẹn của quán mình và đăng ký gói Salon Pro.
  - `STAFF`: Nhân viên/Thợ làm tóc của salon. Được xác nhận/hoàn thành lịch hẹn.
  - `CUSTOMER`: Khách hàng thông thường. Được đặt lịch, hủy/đổi lịch, đánh giá, thử tóc AI.
- **UserStatus**:
  - `ACTIVE`: Hoạt động bình thường.
  - `INACTIVE`: Chưa kích hoạt.
  - `BANNED`: Bị khóa bởi admin (từ chối đăng nhập và trả về `AUTH_004`).
- **Xóa mềm (Soft Delete)**:
  - Bảng `users` có cột `is_deleted BOOLEAN NOT NULL DEFAULT FALSE`.
  - Khách tự xóa tài khoản qua `DELETE /api/auth/me`.
  - Admin xóa tài khoản qua `DELETE /api/admin/users/{userId}` (chặn admin tự xóa chính mình).
  - Tài khoản đã xóa mềm sẽ bị chặn đăng nhập và không thể cấp quyền mới.

### 2.3 Phân loại Route Security trong `SecurityConfig`
- **Public Endpoints (Không cần JWT)**:
  - `POST /api/auth/register`, `/api/auth/register/send-otp`, `/api/auth/register/verify-otp`.
  - `POST /api/auth/login`, `/api/auth/google`, `/api/auth/refresh`, `/api/auth/logout`.
  - `POST /api/auth/forgot-password`, `/api/auth/reset-password`.
  - `GET /api/salons`, `/api/salons/{id}`, `/api/catalog/**`, `/api/services/**`, `/api/stylists/**`.
  - `POST /api/payment/webhook/**` (Bảo mật bằng SePay API key trong header).
  - `/swagger-ui/**`, `/v3/api-docs/**`, `/uploads/**`.
- **Yêu cầu quyền SALON_OWNER**:
  - Tạo/sửa salon, sửa business hours, thêm/sửa stylist, thêm/sửa dịch vụ, gán kiểu tóc vào salon, đăng ký gói Salon Pro.
- **Yêu cầu quyền ADMIN**:
  - Tất cả route `/api/admin/**` và `/api/dashboard/**`, tạo kiểu tóc dùng chung `/api/catalog/**`.
- **Yêu cầu JWT xác thực chung**:
  - Tất cả các endpoint còn lại (`/api/bookings/**`, `/api/notifications/**`, `/api/reviews/**`, `/api/payments/**`).

---

## 3. CHUẨN HÓA DỮ LIỆU & QUY ƯỚC MÃ LỖI (DATA CONTRACTS & ERRORS)

### 3.1 Chuẩn Wrapper Response Thành công (`ApiResponse<T>`)
```json
{
  "success": true,
  "message": "Mô tả kết quả (tuỳ chọn)",
  "data": { ... },
  "timestamp": "2026-10-14T04:30:00Z"
}
```

### 3.2 Chuẩn Phân trang (`PageResponse<T>`)
Mọi danh sách phân trang được trả về trong trường `data`:
```json
{
  "content": [ ... ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 45,
  "totalPages": 5,
  "last": false
}
```
- **Quy chuẩn `PaginationUtils.of(page, size, sortBy, sortDirection)`**:
  - `page`: Mặc định 0 nếu null hoặc < 0.
  - `size`: Mặc định 10 nếu null hoặc <= 0; Giới hạn tối đa 100 nếu truyền > 100.
  - `sortDirection`: Mặc định `ASC`, chỉ nhận `DESC` nếu truyền đúng chuỗi "DESC".

### 3.3 Chuẩn Wrapper Response Lỗi (`GlobalExceptionHandler`)
```json
{
  "success": false,
  "errorCode": "BOOKING_001",
  "message": "Khung giờ này đã có người đặt",
  "timestamp": "2026-10-14T04:30:00Z",
  "path": "/api/bookings",
  "fieldErrors": [
    { "field": "startAt", "message": "Thời gian hẹn phải ở tương lai" }
  ]
}
```

### 3.4 Bảng Mã Lỗi Hệ thống Đầy đủ (`ErrorCode`)
| Mã lỗi | HTTP Status | Thông báo mặc định | Trường hợp kích hoạt |
|---|---:|---|---|
| `COMMON_001` | 500 | Đã có lỗi xảy ra, vui lòng thử lại sau | Lỗi runtime chưa lường trước, NPE, lỗi kết nối DB |
| `COMMON_002` | 400 | Dữ liệu không hợp lệ | Vi phạm Bean Validation (`@Valid`) |
| `COMMON_003` | 404 | Không tìm thấy dữ liệu | Không tìm thấy ID entity (`ResourceNotFoundException`) |
| `COMMON_004` | 401 | Bạn chưa đăng nhập hoặc phiên đã hết hạn | Thiếu token, token sai chữ ký hoặc hết hạn |
| `COMMON_005` | 403 | Bạn không có quyền thực hiện hành động này | Sai quyền Role hoặc không phải chủ sở hữu resource |
| `COMMON_006` | 503 | Chưa gửi được email, vui lòng kiểm tra cấu hình SMTP | Lỗi kết nối máy chủ gửi mail |
| `MAIL_001` | 503 | Dịch vụ gửi email tạm thời không khả dụng, vui lòng thử lại sau | Mail transport provider không phản hồi hoặc lỗi hạ tầng |
| `MAIL_002` | 500 | Gửi email thất bại, vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau | Lỗi định dạng/xử lý nội dung email hoặc provider từ chối |
| `AUTH_001` | 409 | Email đã được sử dụng | Đăng ký trùng email đã tồn tại |
| `AUTH_002` | 401 | Email hoặc mật khẩu không đúng | Sai mật khẩu hoặc email không tồn tại khi login |
| `AUTH_003` | 401 | Refresh token không hợp lệ hoặc đã hết hạn | Token bị revoke, hash không khớp hoặc quá hạn 7 ngày |
| `AUTH_004` | 403 | Tài khoản đã bị khóa | User có status `BANNED` hoặc `INACTIVE` |
| `AUTH_005` | 400 | Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn | Token khôi phục mật khẩu không khớp hoặc quá hạn |
| `AUTH_006` | 400 | Mã OTP không chính xác | Mã OTP nhập vào không khớp với mã đã phát |
| `AUTH_007` | 400 | Mã OTP đã hết hạn, vui lòng yêu cầu mã mới | Mã OTP đã vượt quá thời gian hiệu lực (mặc định 5 phút) |
| `AUTH_008` | 429 | Bạn đã gửi yêu cầu quá nhanh, vui lòng chờ trong giây lát | Vi phạm cooldown gửi lại OTP (60s) hoặc vượt quá 5 lần/giờ |
| `AUTH_009` | 429 | Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới | Nhập sai OTP quá 5 lần; token bị hủy lập tức |
| `BOOKING_001` | 409 | Khung giờ này đã có người đặt | Trùng slot thợ (app check hoặc DB exclusion constraint) |
| `BOOKING_002` | 400 | Không thể hủy lịch hẹn vào lúc này | Hủy lịch trước giờ hẹn dưới 2 tiếng hoặc sai status |
| `PAYMENT_001` | 409 | Đơn hàng này đã được thanh toán | Thao tác trên giao dịch đã PAID |
| `PAYMENT_002` | 400 | Chữ ký webhook không hợp lệ | Sai SePay API key trong header |
| `TRYON_001` | 400 | File ảnh không hợp lệ | File rỗng, quá 5MB, sai định dạng (chỉ JPEG/PNG/WebP) |
| `TRYON_002` | 500 | Xử lý thử tóc thất bại, vui lòng thử lại | Lỗi khi gọi Python AI service hoặc Replicate API |
| `TRYON_003` | 404 | Không tìm thấy kết quả thử tóc | Không tìm thấy kết quả tương ứng |
| `TRYON_004` | 409 | Yêu cầu thử tóc chưa sẵn sàng để lưu kết quả | Trạng thái request không hợp lệ |
| `TRYON_005` | 409 | Yêu cầu thử tóc đã có kết quả | Trùng lặp kết quả thử tóc |

---

## 4. CHI TIẾT DANH MỤC 74 ENDPOINTS BACKEND

### 4.1 Auth Module (13 Endpoints)
1. `POST /api/auth/register/send-otp`: Nhận `SendOtpRequest(email)`. Gửi mã OTP 6 số qua email template StyleLock.
2. `POST /api/auth/register/verify-otp`: Nhận `VerifyOtpRequest(email, otp)`. Xác thực mã OTP.
3. `POST /api/auth/register`: Nhận `RegisterRequest(email, password, fullName, phone)`. Tạo user (yêu cầu email đã verify OTP), trả về `LoginResponse`.
4. `POST /api/auth/login`: Nhận `LoginRequest(email, password)`. Trả về `LoginResponse` (gồm Access + Refresh Token).
5. `POST /api/auth/google`: Nhận `GoogleLoginRequest(idToken)`. Verify token Google, tự động tạo tài khoản nếu chưa có.
6. `POST /api/auth/refresh`: Nhận `RefreshTokenRequest(refreshToken)`. Cấp cặp token mới, revoke token cũ.
7. `POST /api/auth/logout`: Nhận `RefreshTokenRequest(refreshToken)`. Thu hồi token trong DB.
8. `POST /api/auth/logout-all`: [JWT] Thu hồi toàn bộ refresh token của tài khoản.
9. `GET /api/auth/me`: [JWT] Lấy profile người dùng hiện tại (`UserResponse`).
10. `POST /api/auth/change-password`: [JWT] Nhận `ChangePasswordRequest(oldPassword, newPassword)`. Đổi mật khẩu.
11. `POST /api/auth/forgot-password`: Nhận `ForgotPasswordRequest(email)`. Gửi email HTML chứa link token đặt lại mật khẩu.
12. `POST /api/auth/reset-password`: Nhận `ResetPasswordRequest(token, newPassword)`. Cập nhật mật khẩu mới.
13. `DELETE /api/auth/me`: [JWT] Khách hàng tự xóa mềm tài khoản của mình (`is_deleted = true`).

### 4.2 Booking Module (10 Endpoints)
14. `POST /api/bookings`: [JWT] Nhận `CreateBookingRequest(salonId, stylistId, serviceId, hairstyleId, startAt, note)`. Tạo booking, kiểm tra slot, phát `BookingCreatedEvent`. HTTP 201 Created.
15. `GET /api/bookings/{bookingId}`: [JWT] Xem chi tiết lịch hẹn (`BookingDetailResponse`). Kiểm tra quyền chủ sở hữu.
16. `GET /api/bookings/me`: [JWT] Lấy danh sách lịch hẹn của tôi (Phân trang, sort `startAt DESC`).
17. `GET /api/bookings/salon/{salonId}`: [SALON_OWNER] Lấy danh sách lịch hẹn tại salon của mình.
18. `GET /api/bookings/stylist/{stylistId}`: [JWT] Lấy danh sách lịch hẹn của stylist.
19. `GET /api/bookings/salon/{salonId}/stylists/{stylistId}/availability`: [JWT] Tra cứu giờ mở cửa và các khoảng giờ đã kín lịch trong ngày (`AvailabilityResponse`).
20. `PATCH /api/bookings/{bookingId}/confirm`: [OWNER / STAFF / ADMIN] Duyệt lịch hẹn (`PENDING -> CONFIRMED`). Phát `BookingConfirmedEvent`.
21. `PATCH /api/bookings/{bookingId}/cancel`: [JWT] Khách hủy lịch hẹn (bắt buộc trước 2 tiếng). Phát `BookingCancelledEvent`.
22. `PATCH /api/bookings/{bookingId}/reschedule`: [JWT] Khách đổi giờ hẹn sang khung giờ mới (bắt buộc trước 2 tiếng).
23. `PATCH /api/bookings/{bookingId}/complete`: [OWNER / STAFF / ADMIN] Hoàn tất lịch hẹn (`CONFIRMED -> COMPLETED`). Phát `BookingCompletedEvent`.

### 4.3 Salon & Stylist Module (11 Endpoints)
24. `POST /api/salons`: [SALON_OWNER] Tạo salon mới ở trạng thái chờ duyệt PENDING. HTTP 201 Created.
25. `PUT /api/salons/{salonId}`: [SALON_OWNER] Cập nhật thông tin salon.
26. `PATCH /api/salons/{salonId}/status`: [ADMIN] Admin duyệt/khóa salon (`ACTIVE`, `INACTIVE`, `REJECTED`).
27. `GET /api/salons/{salonId}`: [Public] Xem thông tin chi tiết salon.
28. `GET /api/salons`: [Public] Tìm kiếm danh sách salon phân trang theo trạng thái.
29. `GET /api/salons/my-salons`: [SALON_OWNER] Danh sách các salon thuộc quyền sở hữu của user hiện tại.
30. `PUT /api/salons/{salonId}/business-hours`: [SALON_OWNER] Cập nhật lịch hoạt động 7 ngày trong tuần.
31. `POST /api/salons/{salonId}/stylists`: [SALON_OWNER] Gán user làm stylist của salon. HTTP 201 Created.
32. `PUT /api/stylists/{stylistId}`: [SALON_OWNER] Cập nhật bio, số năm kinh nghiệm, trạng thái stylist.
33. `GET /api/stylists/{stylistId}`: [Public] Xem hồ sơ stylist.
34. `GET /api/salons/{salonId}/stylists`: [Public] Lấy danh sách stylist của salon.

### 4.4 Catalog Dịch vụ & Kiểu tóc (13 Endpoints)
35. `POST /api/salons/{salonId}/services`: [SALON_OWNER] Thêm dịch vụ cho salon. HTTP 201 Created.
36. `PUT /api/services/{serviceId}`: [SALON_OWNER] Cập nhật thông tin dịch vụ.
37. `GET /api/services/{serviceId}`: [Public] Xem chi tiết dịch vụ.
38. `GET /api/salons/{salonId}/services`: [Public] Danh sách dịch vụ của salon.
39. `POST /api/catalog/hairstyles`: [ADMIN] Thêm mẫu tóc vào catalog chung hệ thống. HTTP 201 Created.
40. `PUT /api/catalog/hairstyles/{hairstyleId}`: [ADMIN] Sửa mẫu tóc catalog.
41. `GET /api/catalog/hairstyles/{hairstyleId}`: [Public] Xem chi tiết mẫu tóc catalog.
42. `GET /api/catalog/hairstyles`: [Public] Danh sách mẫu tóc catalog (lọc theo category, phân trang).
43. `POST /api/salons/{salonId}/hairstyles/{hairstyleId}`: [SALON_OWNER] Salon gán mẫu tóc catalog vào quán mình.
44. `DELETE /api/salons/{salonId}/hairstyles/{hairstyleId}`: [SALON_OWNER] Salon gỡ mẫu tóc khỏi quán mình.
45. `GET /api/salons/{salonId}/hairstyles`: [Public] Danh sách mẫu tóc salon đang cung cấp.
46. `POST /api/catalog/hairstyle-categories`: [ADMIN] Tạo thể loại kiểu tóc mới. HTTP 201 Created.
47. `GET /api/catalog/hairstyle-categories`: [Public] Danh sách tất cả thể loại kiểu tóc.

### 4.5 Review Module (5 Endpoints)
48. `POST /api/reviews`: [JWT] Đánh giá booking đã hoàn thành (`COMPLETED`). HTTP 201 Created.
49. `PUT /api/reviews/{reviewId}`: [JWT] Sửa đánh giá của chính mình.
50. `GET /api/reviews/{reviewId}`: [Public] Xem chi tiết một đánh giá.
51. `GET /api/salons/{salonId}/reviews`: [Public] Danh sách đánh giá của salon.
52. `GET /api/salons/{salonId}/reviews/summary`: [Public] Xem tổng quan điểm đánh giá trung bình và tổng số review.

### 4.6 Notification Module (4 Endpoints)
53. `GET /api/notifications`: [JWT] Danh sách thông báo của tôi (phân trang).
54. `GET /api/notifications/unread-count`: [JWT] Đếm số thông báo chưa đọc.
55. `PATCH /api/notifications/{notificationId}/read`: [JWT] Đánh dấu thông báo đã đọc.
56. `PATCH /api/notifications/read-all`: [JWT] Đánh dấu toàn bộ thông báo đã đọc.

### 4.7 Payment Module (5 Endpoints)
57. `GET /api/bookings/{bookingId}/payment`: [JWT] Lấy thông tin thanh toán (mã QR, số tiền, mã tham chiếu) của booking.
58. `GET /api/payments/{paymentId}`: [JWT] Lấy chi tiết thanh toán theo ID (kiểm tra quyền sở hữu).
59. `GET /api/payments/history`: [JWT] Lấy lịch sử giao dịch cá nhân phân trang (`PaymentResponse`).
60. `POST /api/salons/{salonId}/pro/subscribe`: [SALON_OWNER] Đăng ký gói Salon Pro theo tháng (150.000 VNĐ), tạo payment PENDING và link QR SePay.
61. `POST /api/payment/webhook/sepay`: [Public - API Key] Nhận webhook từ SePay. Khớp đơn tự động, idempotent, phát `PaymentCompletedEvent`.

### 4.8 Admin Module (8 Endpoints)
62. `GET /api/admin/users`: [ADMIN] Quản lý danh sách người dùng toàn hệ thống.
63. `PATCH /api/admin/users/{userId}/status`: [ADMIN] Cập nhật trạng thái tài khoản (`ACTIVE`, `INACTIVE`, `BANNED`).
64. `PATCH /api/admin/users/{userId}/salon-owner`: [ADMIN] Cấp quyền `SALON_OWNER` cho tài khoản người dùng.
65. `DELETE /api/admin/users/{userId}`: [ADMIN] Xóa mềm tài khoản người dùng (chặn admin tự xóa chính mình).
66. `GET /api/admin/salons`: [ADMIN] Danh sách salon toàn hệ thống (lọc salon chờ duyệt).
67. `PATCH /api/admin/salons/{salonId}/approve`: [ADMIN] Duyệt mở salon (`ACTIVE`).
68. `PATCH /api/admin/salons/{salonId}/reject`: [ADMIN] Từ chối duyệt salon (`REJECTED`).
69. `PATCH /api/admin/payments/{paymentId}/refund`: [ADMIN] Hoàn tiền giao dịch (`REFUNDED`), phát `PaymentRefundedEvent`.

### 4.9 Reporting Module (3 Endpoints)
70. `GET /api/dashboard/overview`: [ADMIN] Số liệu tổng quan tháng hiện tại: tổng user, user mới, salon, booking, doanh thu.
71. `GET /api/dashboard/revenue`: [ADMIN] Báo cáo doanh thu theo khoảng thời gian (`from` - `to` ISO Date-Time).
72. `GET /api/dashboard/bookings/statistics`: [ADMIN] Thống kê số lượng booking theo 4 trạng thái (vẽ chart).

### 4.10 Try-On AI Module (2 Endpoints)
73. `POST /api/tryon`: [Public / JWT] Upload ảnh chân dung (`image`) + chọn `hairstyleId`. Gọi model Replicate diffusion sinh trực tiếp ảnh kết quả, upload Cloudinary và trả về `TryOnResponseDto(requestId, status, resultImageUrl)`.
74. `POST /api/tryon/{requestId}/regenerate`: [Public / JWT] Tạo lại kết quả thử tóc khi khách chưa ưng ý (dùng lại ảnh gốc và kiểu tóc cũ, cập nhật đè kết quả).

---

## 5. CƠ SỞ DỮ LIỆU, SCHEMA & MIGRATIONS (FLYWAY V1 - V106)

### 5.1 Danh sách Migrations Đã Triển khai
- `V1__create_auth.sql`: Bảng `users`, `roles`, `user_roles`, `refresh_tokens`.
- `V2__create_salon.sql`: Bảng `salons`, `business_hours`, `stylists`.
- `V3__create_catalog.sql`: Bảng `hairstyles`, `hairstyle_categories`, `services`, `salon_hairstyles`.
- `V4__create_booking.sql`: Bảng `bookings` và `btree_gist` exclusion constraint.
- `V5__create_payment.sql`: Bảng `payments`.
- `V6__create_tryon.sql`: Bảng `tryon_requests`, `tryon_results`.
- `V7__create_review_notification.sql`: Bảng `reviews`, `notifications`.
- `V8__create_indexes.sql`: Các chỉ mục tối ưu hiệu năng truy vấn.
- `V11__seed_mock_data.sql`: Dữ liệu mẫu chuẩn hóa môi trường test (hợp nhất từ V100 cũ).
- `V12__create_otp_token.sql`: Bảng `verification_tokens` phục vụ xác thực OTP đăng ký.
- `V101__create_password_reset_tokens.sql`: Bảng `password_reset_tokens`.
- `V102__add_payment_transaction_id_unique_index.sql`: Index chống trùng lặp `transaction_id`.
- `V103__add_booking_reminded_and_audit_log.sql`: Thêm cờ `reminded` vào `bookings` và bảng `audit_logs`.
- `V104__add_payment_refund_columns.sql`: Thêm các cột hoàn tiền vào `payments`.
- `V105__add_billing_fields_and_payment_history.sql`: Cột `customer_id`, `salon_id`, `payment_type`, `service_amount`, `fee_amount` và cho phép `booking_id NULL`.
- `V106__add_verification_token_attempts.sql`: Thêm cột `attempt_count INT NOT NULL DEFAULT 0` vào `verification_tokens` và index composite `(email, token_type, created_at)`.

### 5.2 Chi tiết Ràng buộc Đặc biệt (Database Constraints)
1. **Chống trùng slot hẹn tuyệt đối (`excl_stylist_overlap`)**:
   ```sql
   CONSTRAINT excl_stylist_overlap
       EXCLUDE USING gist (
           stylist_id WITH =,
           tstzrange(start_at, end_at) WITH &&
       )
       WHERE (status <> 'CANCELLED');
   ```
   *Lưu ý cho AI*: Khi lưu booking mới, phải gọi `bookingRepository.flush()` trong try-catch để bắt `DataIntegrityViolationException` và chuyển đổi thành mã lỗi `BOOKING_001`.
2. **Khóa duy nhất kết quả thử tóc**:
   `request_id BIGINT NOT NULL UNIQUE` trong bảng `tryon_results`. Khi regenerate, phải dùng `orElseGet` để cập nhật đè thay vì insert mới.
3. **Mỗi booking chỉ được đánh giá 1 lần**:
   `booking_id BIGINT NOT NULL UNIQUE` trong bảng `reviews`.
4. **Phân loại thanh toán**:
   Cột `payment_type VARCHAR(40) NOT NULL DEFAULT 'BOOKING_CONNECTION'`. Cột `booking_id` có thể mang giá trị `NULL` đối với giao dịch `SALON_PRO_SUBSCRIPTION`.

---

## 6. QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)

1. **Phí kết nối lịch hẹn (Booking Connection Fee)**:
   - Cấu hình qua `app.billing.booking-fee` (mặc định 5.000 VNĐ).
   - Khi khách đặt lịch, hệ thống tính: `total_amount = service_price + booking_fee`.
   - `Payment` được tự động tạo với `serviceAmount = service_price`, `feeAmount = booking_fee`, `amount = total_amount`.
2. **Gói đăng ký Salon Pro (Salon Pro Subscription)**:
   - Cấu hình qua `app.billing.salon-pro-monthly-fee` (mặc định 150.000 VNĐ/tháng).
   - Mã thanh toán sinh theo định dạng: `"PRO" + salonId + 4_RANDOM_CHARS`.
3. **Giới hạn thời gian Hủy và Đổi lịch (2 Hours Rule)**:
   - Hủy lịch (`cancelBooking`) hoặc Đổi lịch (`rescheduleBooking`) bắt buộc phải thực hiện **trước giờ hẹn ít nhất 2 tiếng**:
     `now.plus(2, ChronoUnit.HOURS).isAfter(booking.getStartAt()) -> throw BOOKING_002`.
4. **Nhắc lịch hẹn tự động (Booking Reminder Cron)**:
   - Scheduler chạy mỗi 5 phút quét các booking `CONFIRMED`, chưa được nhắc (`reminded = false`), có thời gian bắt đầu trong 2 giờ tới, tự động gửi thông báo và đánh dấu `reminded = true`.
5. **Đăng ký bằng OTP, Khôi phục Mật khẩu & Hạ tầng Email**:
   - **Bảo mật sinh mã OTP**: Sử dụng `java.security.SecureRandom` tạo mã 6 chữ số ngẫu nhiên, không thể đoán trước.
   - **Chống brute-force & Rate limit OTP**:
     - Cooldown gửi lại: Tối thiểu 60 giây giữa 2 lần gửi (`app.otp.resend-cooldown-seconds: 60`, ném `AUTH_008`).
     - Giới hạn tần suất: Tối đa 5 lần gửi / giờ / email (`app.otp.max-sends-per-hour: 5`, ném `AUTH_008`).
     - Giới hạn nhập sai: Tối đa 5 lần thử (`app.otp.max-verify-attempts: 5`). Khi nhập sai tăng `attempt_count` và ném `AUTH_006`; nếu vượt quá 5 lần token lập tức bị hủy (`used = true`) và ném `AUTH_009`.
     - Vô hiệu hóa OTP cũ: Khi cấp mã mới, toàn bộ mã OTP chưa dùng của email lập tức bị đánh dấu `used = true`.
     - Hết hạn: Mã có hiệu lực 5 phút (`app.otp.expiration-minutes: 5`, ném `AUTH_007`).
   - **Bảo mật Quên mật khẩu (Anti-Enumeration)**:
     - Endpoint `POST /api/auth/forgot-password` luôn trả về HTTP 200 kèm thông báo thành công dù email có tồn tại hay không, ngăn chặn kẻ tấn công dò tìm email người dùng.
     - Token reset có hiệu lực cấu hình qua `app.reset-password.expiration-minutes` (mặc định 30 phút).
     - Link reset trỏ về customer app: `http://localhost:8081/reset-password?token=...` (cấu hình qua `app.reset-password.frontend-reset-url`).
   - **Kiến trúc Email Pluggable (`MailTransport`) & Bất đồng bộ**:
     - Mọi email gửi qua `EmailService.sendHtmlEmailAsync` được đẩy vào ThreadPool riêng và chỉ kích hoạt sau khi database transaction commit thành công (`TransactionSynchronizationManager.afterCommit()`).
     - Hỗ trợ chuyển đổi phương thức gửi bằng biến môi trường `MAIL_PROVIDER`:
       - `smtp`: Gửi qua giao thức SMTP (Gmail port 587) có cấu hình connection/read/write timeout 10 giây.
       - `brevo`: Gửi qua Brevo Transactional Email HTTP API (cổng 443 REST API), **vượt qua triệt để rào cản chặn cổng SMTP (25, 465, 587) trên Render gói miễn phí**.
     - Template HTML chuẩn Brand Identity StyleLock (màu nền `#F5F5F3`, header `#EFE6D8`, inline logo CID `stylelock-logo`).
6. **Mô hình Thử tóc AI (Replicate Custom-Hair Pipeline)**:
   - Backend gọi FastAPI Python endpoint `POST /tryon`.
   - Python gọi Replicate model `subhash25rawat/custom-hair:d4e9506ab3dd3d2d47384d78118f708ff6a79fe19a5013b9614021f0355543b9`.
   - Ảnh sinh ra từ Replicate là tạm thời; Python tải về và re-upload lên Cloudinary vĩnh viễn trước khi lưu DB.

---

## 7. BIẾN MÔI TRƯỜNG & HẠ TẦNG TRIỂN KHAI

### 7.1 Môi trường Backend (`application.yml` / `.env`)
```properties
# Server & DB
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/exe101
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

# JWT
APP_JWT_SECRET=your-256-bit-secret-your-256-bit-secret
APP_JWT_ACCESS_EXPIRATION_MS=3600000
APP_JWT_REFRESH_EXPIRATION_MS=604800000

# SePay Webhook & Gateway
SEPAY_WEBHOOK_API_KEY=your_sepay_api_key
SEPAY_ACCOUNT_NUMBER=your_account_number
SEPAY_BANK_NAME=your_bank_name

# Billing Properties
STYLELOCK_BOOKING_FEE=5000
STYLELOCK_SALON_PRO_MONTHLY_FEE=150000

# Pluggable Email Service (smtp | brevo)
MAIL_PROVIDER=smtp
MAIL_ENABLED=true
MAIL_FROM=booking5m1.noreply@gmail.com
MAIL_FROM_NAME=Salon5M1Booking
MAIL_RETRY_MAX_ATTEMPTS=3

# SMTP (Local hoặc Server hỗ trợ gửi SMTP port 587)
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_gmail@gmail.com
SPRING_MAIL_PASSWORD=your_app_password

# Brevo HTTP API (Dành riêng cho Render Free - gửi qua HTTPS port 443 không lo bị chặn port)
BREVO_API_KEY=your_brevo_api_key
BREVO_API_URL=https://api.brevo.com/v3/smtp/email

# Password Reset & OTP Configuration
APP_FRONTEND_RESET_URL=http://localhost:8081/reset-password
APP_RESET_EXPIRATION_MINUTES=30
APP_OTP_EXPIRATION_MINUTES=5
APP_OTP_RESEND_COOLDOWN_SECONDS=60
APP_OTP_MAX_SENDS_PER_HOUR=5
APP_OTP_MAX_VERIFY_ATTEMPTS=5

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Service URL
AI_TRYON_SERVICE_URL=http://localhost:8000
```

### 7.2 Môi trường AI Try-On Service (`ai-tryon-service/.env`)
```properties
PORT=8000
REPLICATE_API_TOKEN=r8_your_replicate_token
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 7.3 Đóng gói Docker
- Đã có `Dockerfile` đa tầng (Maven compile JDK 21 + Runtime Eclipse Temurin 21 JRE).
- Chạy dưới user không đặc quyền `spring:spring`, mở cổng `8080`.

---

## 8. HƯỚNG DẪN DÀNH CHO AI KHI SINH MÃ NGUỒN (AI CODING GUIDELINES)

Khi sinh mã nguồn mới hoặc chỉnh sửa mã nguồn hiện có, AI **BẮT BUỘC** tuân thủ các quy tắc sau:

### NHỮNG ĐIỀU BẮT BUỘC LÀM (DO's)
1. **Luôn dùng Constructor Injection** (không dùng `@Autowired` trên field).
2. **Luôn bọc response bằng `ApiResponse<T>`**:
   - Tạo mới thành công: `return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Message", data));`
   - Đọc/sửa thành công: `return ResponseEntity.ok(ApiResponse.success(data));` hoặc `ApiResponse.success("Message", data)`.
3. **Luôn dùng `PaginationUtils.of(page, size, sortBy, sortDirection)`** cho các repository method có phân trang và bọc kết quả bằng `PageResponse.from(pageResult)`.
4. **Luôn lấy ID người dùng từ `CustomUserDetails`**:
   `@AuthenticationPrincipal CustomUserDetails principal` -> `principal.getUserId()`.
5. **Luôn dùng `BCryptPasswordEncoder`** cho mật khẩu.
6. **Xử lý ngoại lệ chuẩn**:
   - Entity không tìm thấy: ném `ResourceNotFoundException("TênEntity", id)`.
   - Vi phạm logic: ném `BusinessException(ErrorCode.XYZ, "Thông báo cụ thể")`.
   - Vi phạm quyền hạn: ném `ForbiddenException("Thông báo")`.
7. **Luôn tạo migration mới** nếu cần thay đổi DB (tên file dạng `V106__mo_ta.sql`), **KHÔNG BAO GIỜ** sửa file migration cũ đã tồn tại.

### NHỮNG ĐIỀU TUYỆT ĐỐI CẤM (DON'Ts)
1. **KHÔNG** import Entity/Repository của module khác vượt ranh giới module. Phải dùng Service interface hoặc Port.
2. **KHÔNG** query cơ sở dữ liệu bên trong vòng lặp `for`/`while` (N+1 query problem).
3. **KHÔNG** dùng `@EventListener` thông thường cho các tác vụ liên module cần commit DB; phải dùng `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` với `@Transactional(propagation = Propagation.REQUIRES_NEW)`.
4. **KHÔNG** trả về `null` cho `ApiResponse.data` mà không có lý do; nếu endpoint trả void thì dùng `ApiResponse.success("Message")`.
5. **KHÔNG** hardcode thời gian hệ thống; luôn dùng `Instant.now()` cho UTC trong DB và convert sang `Asia/Ho_Chi_Minh` khi hiển thị cho người dùng.
