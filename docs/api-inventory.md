# API Inventory

> Tài liệu tổng hợp toàn bộ các endpoint của dự án EXE101. 
> Hiện tại hệ thống có tổng cộng **68 Endpoints** đã được code, verify, và test tự động. Tất cả các endpoint tạo mới (POST) đều trả về `201 Created`.

## Scope and evidence
- Source: code under `exe/src/main/java`. Tất cả các controller đã được cập nhật mới nhất (bao gồm Auth, Salon, Stylist, Service, Booking, Payment, Audit, Try-On AI).
- Code-confirmed endpoints: 68 endpoints (đã bao gồm các luồng Refund, Delete, Reschedule, Try-on Result).
- Runtime-confirmed: Đã hoàn thiện Automation Test qua Postman.
- Base URL: `http://localhost:8080` (Cấu hình Timezone mặc định: `Asia/Ho_Chi_Minh`).
- Default auth: Bắt buộc truyền JWT Header `Authorization: Bearer <token>` ngoại trừ các public endpoint như: `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, `/api/auth/refresh`, `/api/public/**`, `/api/payment/webhook/**`, Swagger.
- AI Try-on: `POST /api/tryon` và `PUT /api/tryon/{requestId}/finalize` đã được tích hợp gọi sang Python server nội bộ.


## Common response and errors
Success wrapper: `success:boolean`, optional `message:string`, optional `data`, `timestamp:date-time`.
Error wrapper: `success:false`, `errorCode`, `message`, `timestamp`, `path`, optional `fieldErrors[{field,message}]`.
Known codes: `COMMON_001` 500, `COMMON_002` 400, `COMMON_003` 404, `COMMON_004` 401, `COMMON_005` 403, `AUTH_001` 409, `AUTH_002` 401, `AUTH_003` 401, `AUTH_004` 403, `BOOKING_001` 409, `BOOKING_002` 400, `PAYMENT_001` 409, `PAYMENT_002` 400.

## Endpoint matrix

| ID | Method | Path | Controller | Auth / role | Request contract / response |
|---|---|---|---|---|---|
| AUTH-01 | POST | `/api/auth/register` | AuthController | Public | RegisterRequest -> LoginResponse |
| AUTH-02 | POST | `/api/auth/login` | AuthController | Public | LoginRequest -> LoginResponse |
| AUTH-03 | POST | `/api/auth/google` | AuthController | Public | GoogleLoginRequest -> LoginResponse |
| AUTH-04 | POST | `/api/auth/refresh` | AuthController | Public | RefreshTokenRequest -> TokenResponse |
| AUTH-05 | POST | `/api/auth/logout` | AuthController | Public by path | RefreshTokenRequest -> void |
| AUTH-06 | POST | `/api/auth/logout-all` | AuthController | JWT | none -> void |
| AUTH-07 | GET | `/api/auth/me` | AuthController | JWT | none -> UserResponse |
| AUTH-08 | POST | `/api/auth/change-password` | AuthController | JWT | ChangePasswordRequest -> void |
| BOOK-01 | POST | `/api/bookings` | BookingController | JWT | CreateBookingRequest -> BookingResponse |
| BOOK-02 | GET | `/api/bookings/{bookingId}` | BookingController | JWT; service checks owner access | path bookingId -> BookingDetailResponse |
| BOOK-03 | GET | `/api/bookings/me` | BookingController | JWT | page?, size? -> PageResponse<BookingResponse> |
| BOOK-04 | GET | `/api/bookings/salon/{salonId}` | BookingController | JWT + SALON_OWNER | page?, size? -> page |
| BOOK-05 | GET | `/api/bookings/stylist/{stylistId}` | BookingController | JWT by global rule | page?, size? -> page |
| BOOK-06 | PATCH | `/api/bookings/{bookingId}/confirm` | BookingController | JWT + SALON_OWNER/STAFF/ADMIN | none -> BookingResponse |
| BOOK-07 | PATCH | `/api/bookings/{bookingId}/cancel` | BookingController | JWT | optional CancelBookingRequest -> BookingResponse |
| BOOK-08 | PATCH | `/api/bookings/{bookingId}/complete` | BookingController | JWT + SALON_OWNER/STAFF/ADMIN | none -> BookingResponse |
| BOOK-09 | GET | `/api/bookings/salon/{salonId}/stylists/{stylistId}/availability` | BookingController | JWT | date -> AvailabilityResponse |
| BOOK-10 | PATCH | `/api/bookings/{bookingId}/reschedule` | BookingController | JWT | `{startAt}` -> BookingResponse |
| SALON-01 | POST | `/api/salons` | SalonController | JWT + SALON_OWNER | CreateSalonRequest -> SalonResponse |
| SALON-02 | PUT | `/api/salons/{salonId}` | SalonController | JWT + SALON_OWNER | UpdateSalonRequest -> SalonResponse |
| SALON-03 | PATCH | `/api/salons/{salonId}/status` | SalonController | JWT + ADMIN | UpdateSalonStatusRequest -> SalonResponse |
| SALON-04 | GET | `/api/salons/{salonId}` | SalonController | JWT by global rule | path salonId -> SalonDetailResponse |
| SALON-05 | GET | `/api/salons` | SalonController | JWT by global rule | status?, page?, size? -> page |
| SALON-06 | GET | `/api/salons/my-salons` | SalonController | JWT + SALON_OWNER | page?, size? -> page |
| SALON-07 | PUT | `/api/salons/{salonId}/business-hours` | SalonController | JWT + SALON_OWNER | array UpdateBusinessHourRequest -> void |
| STYLIST-01 | POST | `/api/salons/{salonId}/stylists` | StylistController | JWT + SALON_OWNER | CreateStylistRequest -> StylistResponse |
| STYLIST-02 | PUT | `/api/stylists/{stylistId}` | StylistController | JWT + SALON_OWNER | UpdateStylistRequest -> StylistResponse |
| STYLIST-03 | GET | `/api/stylists/{stylistId}` | StylistController | JWT by global rule | path stylistId -> StylistResponse |
| STYLIST-04 | GET | `/api/salons/{salonId}/stylists` | StylistController | JWT by global rule | page?, size? -> page |
| SERVICE-01 | POST | `/api/salons/{salonId}/services` | ServiceController | JWT + SALON_OWNER | CreateServiceRequest -> ServiceResponse |
| SERVICE-02 | PUT | `/api/services/{serviceId}` | ServiceController | JWT + SALON_OWNER | UpdateServiceRequest -> ServiceResponse |
| SERVICE-03 | GET | `/api/services/{serviceId}` | ServiceController | JWT by global rule | path serviceId -> ServiceResponse |
| SERVICE-04 | GET | `/api/salons/{salonId}/services` | ServiceController | JWT by global rule | page?, size? -> page |
| HAIR-01 | POST | `/api/catalog/hairstyles` | HairstyleController | JWT + ADMIN | CreateHairstyleRequest -> HairstyleResponse |
| HAIR-02 | PUT | `/api/catalog/hairstyles/{hairstyleId}` | HairstyleController | JWT + ADMIN | UpdateHairstyleRequest -> HairstyleResponse |
| HAIR-03 | GET | `/api/catalog/hairstyles/{hairstyleId}` | HairstyleController | JWT by global rule | path hairstyleId -> HairstyleResponse |
| HAIR-04 | GET | `/api/catalog/hairstyles` | HairstyleController | JWT by global rule | categoryId?, page?, size? -> page |
| HAIR-05 | POST | `/api/salons/{salonId}/hairstyles/{hairstyleId}` | HairstyleController | JWT + SALON_OWNER | none -> void |
| HAIR-06 | DELETE | `/api/salons/{salonId}/hairstyles/{hairstyleId}` | HairstyleController | JWT + SALON_OWNER | none -> void |
| HAIR-07 | GET | `/api/salons/{salonId}/hairstyles` | HairstyleController | JWT by global rule | none -> HairstyleResponse[] |
| CATEGORY-01 | POST | `/api/catalog/hairstyle-categories` | HairstyleCategoryController | JWT + ADMIN | CreateHairstyleCategoryRequest -> category |
| CATEGORY-02 | GET | `/api/catalog/hairstyle-categories` | HairstyleCategoryController | JWT by global rule | none -> category[] |
| REVIEW-01 | POST | `/api/reviews` | ReviewController | JWT | CreateReviewRequest -> ReviewResponse |
| REVIEW-02 | PUT | `/api/reviews/{reviewId}` | ReviewController | JWT; service checks owner | UpdateReviewRequest -> ReviewResponse |
| REVIEW-03 | GET | `/api/reviews/{reviewId}` | ReviewController | JWT by global rule | path reviewId -> ReviewResponse |
| REVIEW-04 | GET | `/api/salons/{salonId}/reviews` | ReviewController | JWT by global rule | page?, size? -> page |
| REVIEW-05 | GET | `/api/salons/{salonId}/reviews/summary` | ReviewController | JWT by global rule | none -> summary |
| NOTIFY-01 | GET | `/api/notifications` | NotificationController | JWT; user scoped | page?, size? -> page |
| NOTIFY-02 | GET | `/api/notifications/unread-count` | NotificationController | JWT; user scoped | none -> integer |
| NOTIFY-03 | PATCH | `/api/notifications/{notificationId}/read` | NotificationController | JWT; user scoped | none -> void |
| NOTIFY-04 | PATCH | `/api/notifications/read-all` | NotificationController | JWT; user scoped | none -> void |
| PAY-01 | GET | `/api/bookings/{bookingId}/payment` | PaymentController | JWT; booking scoped | path bookingId -> PaymentResponse |
| PAY-02 | GET | `/api/payments/{paymentId}` | PaymentController | JWT by global rule | path paymentId -> PaymentResponse |
| PAY-03 | POST | `/api/payment/webhook/sepay` | SepayWebhookController | Public route; SePay Authorization API key required | SepayWebhookRequest -> `{"success":true}` |
| ADMIN-01 | GET | `/api/admin/users` | AdminController | JWT + ADMIN | status?, page?, size? -> page<UserResponse> |
| ADMIN-02 | PATCH | `/api/admin/users/{userId}/status` | AdminController | JWT + ADMIN | `{status}` -> UserResponse |
| ADMIN-03 | DELETE| `/api/admin/users/{userId}` | AdminController | JWT + ADMIN | none -> void |
| ADMIN-04 | GET | `/api/admin/salons` | AdminController | JWT + ADMIN | status?, page?, size? -> page<SalonResponse> |
| ADMIN-05 | PATCH | `/api/admin/salons/{salonId}/approve` | AdminController | JWT + ADMIN | none -> SalonResponse |
| ADMIN-06 | PATCH | `/api/admin/salons/{salonId}/reject` | AdminController | JWT + ADMIN | none -> SalonResponse |
| REPORT-01 | GET | `/api/dashboard/overview` | DashboardController | JWT + ADMIN | none -> DashboardOverviewResponse |
| REPORT-02 | GET | `/api/dashboard/revenue` | DashboardController | JWT + ADMIN | required `from`, `to` ISO date-time -> RevenueReportResponse |
| REPORT-03 | GET | `/api/dashboard/bookings/statistics` | DashboardController | JWT + ADMIN | none -> BookingStatisticsResponse |
| TRYON-01 | POST | `/api/tryon` | TryOnController | JWT | multipart (image, hairstyleId) -> TryOnResponseDto |
| TRYON-02 | PUT | `/api/tryon/{requestId}/finalize` | TryOnController | JWT | JSON TryOnFinalizeRequest -> TryOnFinalizeResponseDto |
| TRYON-03 | GET | `/api/tryon/{requestId}/result` | TryOnController | JWT | path requestId -> TryOnResultResponseDto |
| TRYON-04 | GET | `/api/tryon/results` | TryOnController | JWT | page?, size? -> page<TryOnResultResponseDto> |

## Missing capability confirmed by code
There is no explicit payment-create endpoint. Payment is described in code as created by a booking event. These gaps are documented in `issues-found.md` and `feature-coverage.md`. Try-on result, availability, reschedule and delete user are now available.
