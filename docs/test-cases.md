# Test Cases

Các case dưới đây khớp với ID request trong Postman (`[ID]`). Script collection dùng chung kiểm tra HTTP status và JSON success/timestamp; script riêng Auth-01/Auth-02 kiểm tra `data.accessToken` là string và lưu token. Do chưa có endpoint AI nên các case AI là gap/blocked, không phải test đã chạy.

| Test ID | Mô tả | Input | Kết quả mong đợi | Loại |
|---|---|---|---|---|
| AUTH-01 | Đăng ký hợp lệ | email mới, password 6-100, fullName | 200; `success=true`; accessToken/refreshToken string; lưu token | happy path |
| AUTH-02 | Đăng nhập hợp lệ/sai | credential hợp lệ hoặc sai | 200 với token; sai trả 401 `AUTH_002`; script kiểm tra status | security |
| AUTH-03 | Google token | idToken thật | 200 với login; token sai/hết hạn 401/500 theo verifier | edge case |
| AUTH-04 | Refresh token | refresh token hợp lệ/hết hạn | 200 token mới hoặc 401 `AUTH_003` | security |
| AUTH-06 | Token hết hạn/sai | Bearer token expired/random | 401 | security |
| AUTH-07 | User A đọc `/me` | token A | 200 chỉ trả user A | security |
| BOOK-01 | Đặt lịch tương lai | valid IDs, `2030-01-15T10:00:00Z` | 200; booking pending; payment được tạo qua event | happy path |
| BOOK-RACE | Hai request cùng slot | 2 concurrent POST cùng stylist/startAt | chỉ một booking thành công; request kia 409 `BOOKING_001`; cần chạy thủ công bằng Collection Runner/concurrent clients | security |
| BOOK-TZ | Timezone boundary | `2029-12-31T23:30:00+07:00` và UTC tương đương | Instant được diễn giải nhất quán; không lệch ngày/slot | edge case |
| BOOK-07 | Hủy lịch | booking của user, optional reason | 200 hoặc 400 `BOOKING_002` nếu trạng thái không cho hủy | happy path/edge case |
| BOOK-02 | User A truy cập booking B | token A + booking_id của B | 403/404, không lộ dữ liệu B | security |
| BOOK-04 | Sai role đọc salon booking | token customer | 403 | security |
| SALON-01 | Tạo salon | name hợp lệ | 200 pending approval | happy path |
| SALON-07 | Giờ mở cửa | dayOfWeek 1-7, LocalTime | 200; day 0/8 trả 400 | edge case |
| SERVICE-01 | Tạo service | price >=0, duration >=1 | 200; giá âm hoặc duration 0 trả 400 | edge case |
| HAIR-01 | Tạo hairstyle | name/imageUrl nonblank | 200; thiếu imageUrl trả 400 | happy path |
| REVIEW-01 | Review booking completed | rating 1-5, comment <=2000 | 200; rating 0/6/comment >2000 trả 400 | happy path/edge case |
| NOTIFY-01 | Xem notification | token user A | chỉ notification A; page/size optional | security |
| PAY-01 | Xem payment của booking | token A + booking A | 200; booking B không lộ | security |
| PAY-03 | Webhook đúng/sai API key | JSON SePay + Authorization | đúng key 200 `{"success":true}`; sai key 401 | security |
| REPORT-02 | Revenue timezone | `from/to` ISO date-time với Z/+07:00 | admin 200; thiếu/không parse được 400 | edge case |
| ADMIN-01 | Customer gọi admin | token customer | 403 | security |
| AI-01 | Upload ảnh không có mặt | multipart image | BLOCKED: không có route MultipartFile/try-on trong code | gap |
| AI-02 | Upload nhiều khuôn mặt | multipart image | BLOCKED: chưa có AI endpoint | gap |
| AI-03 | Sai định dạng / quá lớn / thiếu file | text, oversized, no file | BLOCKED: chưa có contract hoặc controller để test | gap |
| AI-04 | AI timeout | provider timeout | BLOCKED: không có AI service/controller/timeout contract | gap |
