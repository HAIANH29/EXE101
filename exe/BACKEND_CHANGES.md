# Backend Changes

Ngay 2026-10-07, backend trong thu muc `exe` da duoc cap nhat cac phan sau:

## Auth email flow

- Giu luong dang ky bang OTP qua email:
  - `POST /api/auth/register/send-otp`
  - `POST /api/auth/register/verify-otp`
  - `POST /api/auth/register`
- Giu luong quen mat khau:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- Link reset password dung config `app.password-reset.frontend-reset-url`.
- Thoi han reset password dung config `app.password-reset.expiration-minutes` thay vi hardcode.

## Email HTML template

- OTP dang ky va forgot password gui bang HTML email.
- Email dung logo StyleLock inline voi CID `stylelock-logo`.
- Nen ngoai email la xam nhe `#F5F5F3`.
- Header card email giu mau da `#EFE6D8`.
- Noi dung card mau trang, nut Verify mau da co vien nhe de khong bi chim nen.
- Mau chu/nut duoc dong bo theo theme kem/nau hien tai.

## Email service

- `EmailService` ho tro gui HTML email bang `MimeMessageHelper`.
- Tu dong dinh kem inline logo tu `static/email/stylelock-logo-transparent.png` neu template co `cid:stylelock-logo`.
- Kiem tra cau hinh mail truoc khi gui:
  - `PASSWORD_RESET_MAIL_ENABLED`
  - `MAIL_USERNAME`
  - `MAIL_PASSWORD`
  - `MAIL_FROM`

## Config/env

- `.env.example` bo sung:
  - `PASSWORD_RESET_EXPIRATION_MINUTES=30`
- `application.yml` da co mapping:
  - `app.password-reset.expiration-minutes`
  - `app.password-reset.mail-enabled`
  - `app.password-reset.frontend-reset-url`
  - `app.password-reset.mail-from`

## Salon owner account

- Admin tạo tài khoản chủ salon qua:
  - `POST /api/admin/users/salon-owner`
- Tài khoản được tạo trực tiếp với role `SALON_OWNER`.
- Đăng ký công khai và đăng nhập Google vẫn chỉ tạo tài khoản role `CUSTOMER`.
- Việc tạo tài khoản chủ salon không còn phụ thuộc vào bước tự đăng ký hoặc tự xin cấp quyền.

## Salon dashboard

Backend bổ sung dashboard riêng cho chủ salon. Các endpoint yêu cầu JWT hợp lệ
và role `SALON_OWNER`. Chủ salon chỉ được xem dữ liệu của salon thuộc tài khoản
đang đăng nhập; nếu `owner_id` không khớp, API trả về lỗi không có quyền.

### Tổng quan dashboard

```text
GET /api/salons/{salonId}/dashboard
```

Dashboard trả về:

- Tổng số booking trong tháng hiện tại.
- Số booking diễn ra trong ngày hiện tại.
- Số booking sắp tới, không bao gồm booking đã hủy.
- Số booking theo trạng thái `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`.
- Doanh thu trong tháng từ các booking đã hoàn thành.
- Số stylist đang hoạt động.

Ví dụ response:

```json
{
  "salonId": 1,
  "bookingsThisMonth": 42,
  "bookingsToday": 6,
  "upcomingBookings": 18,
  "pendingBookings": 4,
  "confirmedBookings": 8,
  "completedBookings": 27,
  "cancelledBookings": 3,
  "revenueThisMonth": 12500000,
  "activeStylists": 5
}
```

### Lịch hẹn sắp tới

```text
GET /api/salons/{salonId}/dashboard/upcoming-bookings?page=0&size=10
```

- Trả về danh sách booking dạng phân trang.
- Sắp xếp theo `startAt` tăng dần.
- Chỉ trả về booking từ thời điểm hiện tại trở đi.
- Không trả về booking có trạng thái `CANCELLED`.

Dashboard admin tại `/api/dashboard/**` vẫn giữ nguyên và tiếp tục hiển thị
số liệu tổng hợp toàn hệ thống; dashboard salon chỉ hiển thị dữ liệu theo từng
salon.

## Files backend lien quan

- `exe/src/main/java/be/exe/auth/service/impl/AuthServiceImpl.java`
- `exe/src/main/java/be/exe/notification/service/EmailService.java`
- `exe/src/main/resources/static/email/stylelock-logo-transparent.png`
- `exe/src/main/resources/static/email/stylelock-logo.png`
- `exe/.env.example`

## Kiem tra

- Da chay `mvn -q test`: pass.
