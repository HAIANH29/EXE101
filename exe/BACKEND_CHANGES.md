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

## Files backend lien quan

- `exe/src/main/java/be/exe/auth/service/impl/AuthServiceImpl.java`
- `exe/src/main/java/be/exe/notification/service/EmailService.java`
- `exe/src/main/resources/static/email/stylelock-logo-transparent.png`
- `exe/src/main/resources/static/email/stylelock-logo.png`
- `exe/.env.example`

## Kiem tra

- Da chay `mvn -q test`: pass.
