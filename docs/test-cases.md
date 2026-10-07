# Test Cases

Bảng kịch bản kiểm thử (Test Cases) của hệ thống StyleLock (EXE101), bao gồm cả kiểm thử chức năng (Happy path), kiểm thử bảo mật (Security), kiểm thử ngoại lệ (Edge case) và kiểm thử hiệu năng/đồng thời (Race condition).

Tất cả các endpoint tạo mới (POST) trả về **HTTP 201 Created**, các thao tác xem/sửa trả về **HTTP 200 OK**.

| Test ID | Phân hệ / Mô tả | Đầu vào (Input) | Kết quả mong đợi (Expected Result) | Loại test |
|---|---|---|---|---|
| **AUTH-01** | Đăng ký tài khoản mới | `email` hợp lệ chưa tồn tại, `password` (6-100 ký tự), `fullName` | HTTP 201; `success=true`; trả `accessToken`, `refreshToken`, `user` | Happy path |
| **AUTH-02** | Đăng ký trùng email | `email` đã tồn tại trong DB | HTTP 409 Conflict; `errorCode=AUTH_001` | Edge case |
| **AUTH-03** | Đăng nhập đúng thông tin | Email & mật khẩu chính xác | HTTP 200; trả `accessToken`, `refreshToken`, `user` | Happy path |
| **AUTH-04** | Đăng nhập sai mật khẩu | Email đúng, mật khẩu sai | HTTP 401 Unauthorized; `errorCode=AUTH_002` | Security |
| **AUTH-05** | Đăng nhập tài khoản bị khóa | Tài khoản có `status=LOCKED` | HTTP 403 Forbidden; `errorCode=AUTH_004` | Security |
| **AUTH-06** | Đăng nhập bằng Google | `idToken` hợp lệ từ Google | HTTP 200; tự động tạo user nếu chưa có hoặc trả token nếu đã có | Happy path |
| **AUTH-07** | Làm mới Access Token (RTR) | `refreshToken` hợp lệ | HTTP 200; cấp cặp `accessToken` và `refreshToken` mới, thu hồi token cũ | Security |
| **AUTH-08** | Refresh token giả/hết hạn | `refreshToken` không tồn tại hoặc đã hết hạn | HTTP 401 Unauthorized; `errorCode=AUTH_003` | Security |
| **AUTH-09** | Đăng xuất thiết bị hiện tại | `refreshToken` hợp lệ | HTTP 200; token bị thu hồi trong DB | Happy path |
| **AUTH-10** | Đăng xuất tất cả thiết bị | Bearer Token hợp lệ | HTTP 200; toàn bộ refresh token của user bị thu hồi | Happy path |
| **AUTH-11** | Cập nhật thông tin cá nhân | Bearer Token, `fullName`, `phone` hợp lệ | HTTP 200; trả `UserResponse` cập nhật mới | Happy path |
| **AUTH-12** | Upload ảnh đại diện | File ảnh JPEG/PNG <= 5MB | HTTP 200; ảnh được lưu Cloudinary, `avatarUrl` cập nhật | Happy path |
| **AUTH-13** | Đổi mật khẩu | `oldPassword` đúng, `newPassword` hợp lệ | HTTP 200; mật khẩu đổi thành công | Happy path |
| **AUTH-14** | Yêu cầu quên mật khẩu | `email` đã đăng ký | HTTP 200; tạo token 30 phút trong DB và gửi email | Happy path |
| **AUTH-15** | Đặt lại mật khẩu với token | `token` hợp lệ chưa sử dụng, `newPassword` | HTTP 200; mật khẩu cập nhật, token đánh dấu used=true | Happy path |
| **AUTH-16** | Tự xóa tài khoản (Soft Delete) | Bearer Token hợp lệ | HTTP 200; user chuyển `INACTIVE`, thu hồi toàn bộ token | Security |
| **BOOK-01** | Đặt lịch hẹn mới hợp lệ | `salonId`, `stylistId`, `serviceId`, `startAt` hợp lệ (tương lai) | HTTP 201; Booking `PENDING`; Payment được tạo tự động; phát sự kiện | Happy path |
| **BOOK-02** | Đặt lịch vào giờ quá khứ | `startAt` nằm trong quá khứ | HTTP 400 Bad Request; báo lỗi thời gian không hợp lệ | Edge case |
| **BOOK-03** | Đặt lịch trùng slot (Race condition) | 2 request đồng thời cùng stylist & khung giờ | Đúng 1 request thành công (201); request thứ 2 nhận HTTP 409 `BOOKING_001` | Race condition |
| **BOOK-04** | Kiểm tra lịch trống (Availability) | `salonId`, `stylistId`, `date` | HTTP 200; trả về giờ mở/đóng cửa và danh sách `bookedIntervals` | Happy path |
| **BOOK-05** | Khách xem lịch hẹn của mình | Bearer Token Customer | HTTP 200; chỉ trả về danh sách booking của chính customer | Security |
| **BOOK-06** | Khách xem lịch hẹn người khác | Bearer Token Khách A, ID booking Khách B | HTTP 403 Forbidden; không lộ dữ liệu người khác | Security |
| **BOOK-07** | Đổi lịch hẹn hợp lệ | Booking `PENDING`/`CONFIRMED`, `startAt` mới cách giờ cũ >= 2 giờ | HTTP 200; cập nhật giờ hẹn mới | Happy path |
| **BOOK-08** | Đổi lịch hẹn trễ hạn | Booking cách giờ bắt đầu < 2 giờ | HTTP 400 Bad Request; báo lỗi không được đổi lịch sát giờ | Edge case |
| **BOOK-09** | Salon xác nhận lịch hẹn | Token `SALON_OWNER`/`STAFF` | HTTP 200; trạng thái chuyển `CONFIRMED`; bắn notification cho khách | Happy path |
| **BOOK-10** | Hủy lịch hẹn | Booking `PENDING` hoặc `CONFIRMED` | HTTP 200; trạng thái chuyển `CANCELLED`; hoàn trả slot | Happy path |
| **BOOK-11** | Hoàn tất lịch hẹn | Token `SALON_OWNER`/`STAFF`, booking `CONFIRMED` | HTTP 200; trạng thái chuyển `COMPLETED`; cho phép khách đánh giá | Happy path |
| **SALON-01** | Tạo salon mới | Token `SALON_OWNER`, tên, địa chỉ, ảnh | HTTP 201; salon tạo ở trạng thái `PENDING_APPROVAL` | Happy path |
| **SALON-02** | Cấu hình giờ mở cửa salon | Mảng 7 ngày (thứ 2 - CN), `openTime`, `closeTime` | HTTP 200; lưu cấu hình hoạt động | Happy path |
| **STYLIST-01** | Thêm thợ làm tóc vào salon | Token Owner của salon, `userId` nhân viên | HTTP 201; thợ được gán vào salon | Happy path |
| **SERVICE-01** | Tạo dịch vụ cho salon | Tên, giá >= 0, thời lượng >= 1 phút | HTTP 201; dịch vụ được thêm vào salon | Happy path |
| **TRYON-01** | Thử tóc bước 1: Phân tích khuôn mặt | Multipart file ảnh chân dung rõ mặt, `hairstyleId` | HTTP 201; trả về `requestId`, `hairstyleImageUrl`, tọa độ `(x, y, w, h)` | Happy path |
| **TRYON-02** | Thử tóc bước 1: Ảnh không có mặt | File ảnh phong cảnh / không phát hiện được mặt | HTTP 400/500 `TRYON_002`; Python báo không tìm thấy mặt, tự động xóa ảnh rác | Edge case |
| **TRYON-03** | Thử tóc bước 1: File quá kích thước | File ảnh > 5MB hoặc sai định dạng (.exe, .pdf) | HTTP 400 Bad Request `TRYON_001`; từ chối ngay tại Java | Edge case |
| **TRYON-04** | Thử tóc bước 2: Finalize & Merge ảnh | `requestId`, tọa độ `(x, y, width, height)` do khách chỉnh | HTTP 200; Server Python merge ảnh tóc với ảnh gốc; lưu Cloudinary | Happy path |
| **TRYON-05** | Thử tóc bước 2: Finalize sai chủ sở hữu | Token User B gọi finalize trên `requestId` của User A | HTTP 403 Forbidden; bảo vệ quyền sở hữu | Security |
| **TRYON-06** | Xem chi tiết kết quả thử tóc | `requestId` hợp lệ của chính người dùng | HTTP 200; trả về URL ảnh gốc, ảnh kết quả và thông tin kiểu tóc | Happy path |
| **TRYON-07** | Xem danh sách lịch sử thử tóc | Bearer Token hợp lệ | HTTP 200; trả danh sách phân trang các lần thử tóc của user | Happy path |
| **PAY-01** | Webhook SePay thanh toán thành công | Header `Authorization: API_KEY`, transferAmount đủ | HTTP 200 `{"success":true}`; Payment chuyển `PAID`, Booking chuyển `CONFIRMED` | Happy path |
| **PAY-02** | Webhook SePay sai API Key | Header `Authorization` không khớp cấu hình | HTTP 401 Unauthorized / 400 Bad Request; từ chối xử lý | Security |
| **PAY-03** | Webhook SePay trùng giao dịch | Gửi lại `transaction_id` đã từng xử lý | Bỏ qua idempotently hoặc trả success mà không cộng dồn doanh thu | Edge case |
| **ADMIN-01** | Admin phê duyệt salon | Token Admin, `salonId` đang `PENDING_APPROVAL` | HTTP 200; salon chuyển `ACTIVE` | Happy path |
| **ADMIN-02** | Admin hoàn tiền giao dịch | Token Admin, `paymentId` đang `PAID`, `refundReason` | HTTP 200; Payment chuyển `REFUNDED`; gửi thông báo cho khách | Happy path |
| **ADMIN-03** | Admin hoàn tiền giao dịch chưa trả | Token Admin, `paymentId` đang `PENDING` | HTTP 400 Bad Request; chỉ hoàn tiền giao dịch đã thanh toán | Edge case |
| **ADMIN-04** | Người dùng thường gọi API Admin | Token Customer truy cập `/api/admin/**` | HTTP 403 Forbidden; chặn theo `@PreAuthorize("hasRole('ADMIN')")` | Security |
| **REVIEW-01** | Đánh giá sau khi hoàn thành | Booking `COMPLETED`, rating 1-5, comment | HTTP 201; tạo đánh giá thành công | Happy path |
| **REVIEW-02** | Đánh giá khi lịch chưa hoàn thành | Booking `PENDING` hoặc `CONFIRMED` | HTTP 400 Bad Request; chỉ cho phép đánh giá lịch đã hoàn thành | Edge case |
| **NOTIFY-01** | Xem và đánh dấu đã đọc thông báo | Token User, `notificationId` của chính user | HTTP 200; cập nhật `read=true`, giảm unread-count | Happy path |
| **SCHED-01** | Tự động nhắc lịch trước 2 giờ | Cron job chạy ngầm mỗi 15 phút | Tự động phát `BookingReminderEvent` và tạo Notification nhắc khách | Happy path |
