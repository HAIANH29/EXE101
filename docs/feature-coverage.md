# Feature Capability Map

Bảng đối chiếu hiện trạng tính năng hệ thống StyleLock (EXE101) dựa trên mã nguồn thực tế tại backend (`exe/src/main/java`) và Python AI service (`ai-tryon-service`).

| Nhóm tính năng | Trạng thái | Endpoint liên quan | Ghi chú chi tiết |
|---|---|---|---|
| Xác thực, Token & Tài khoản | Hoàn thiện | AUTH-01..13 | Đăng ký, Đăng nhập local, Google OAuth2, Refresh Token Rotation, Đăng xuất/Đăng xuất mọi thiết bị, Đổi mật khẩu, Quên/Đặt lại mật khẩu qua email token, Cập nhật profile, Upload Avatar Cloudinary, Xóa tài khoản (soft delete). |
| Quản lý Salon | Hoàn thiện | SALON-01..07 | Đăng ký salon (chờ duyệt), cập nhật thông tin salon, business hours (thứ 2 - CN), trạng thái salon, chi tiết và danh sách. |
| Quản lý Stylist | Hoàn thiện | STYLIST-01..04 | Thêm stylist vào salon, cập nhật stylist, xem chi tiết và danh sách stylist theo salon. |
| Quản lý Dịch vụ | Hoàn thiện | SERVICE-01..04 | Tạo dịch vụ, cập nhật thông tin/giá/thời lượng, xem chi tiết và danh sách dịch vụ theo salon. |
| Danh mục & Kiểu tóc | Hoàn thiện | CATEGORY-01..02, HAIR-01..07 | Admin tạo danh mục và kiểu tóc catalog; Salon gán/bỏ gán kiểu tóc làm việc; xem danh sách kiểu tóc salon. |
| Xem lịch trống (Availability) | Hoàn thiện | BOOK-09 | Trả về giờ hoạt động của salon và các khoảng thời gian đã được đặt lịch của stylist theo ngày (`bookedIntervals`). |
| Đặt lịch hẹn | Hoàn thiện | BOOK-01..08, BOOK-10 | Đặt lịch mới, xem chi tiết (chống lộ chéo), xem lịch của tôi, xem lịch theo salon/stylist, xác nhận, hủy lịch, hoàn thành lịch. |
| Ngăn chặn trùng slot (Race condition) | Hoàn thiện | BOOK-01, BOOK-10 | Ràng buộc DB exclusion / unique constraint kèm bắt lỗi trả về `BOOKING_001` (409 Conflict). |
| Đổi lịch hẹn (Reschedule) | Hoàn thiện | BOOK-10 | Khách hàng đổi sang giờ hẹn mới trước ít nhất 2 giờ, chỉ áp dụng cho đơn `PENDING`/`CONFIRMED`, tự động kiểm tra trùng slot. |
| Thanh toán & Webhook | Hoàn thiện | PAY-01..03, ADMIN-07 | Tạo Payment tự động khi đặt lịch, xem payment của booking, Webhook SePay tự động xác thực và cập nhật `PAID` kèm chuyển booking sang `CONFIRMED`; Admin có API hoàn tiền `REFUNDED` (`ADMIN-07`). |
| Thông báo (Notification) | Hoàn thiện | NOTIFY-01..04 | Lắng nghe sự kiện hệ thống (BookingCreated, BookingConfirmed, BookingCancelled, BookingCompleted, BookingReminder, PaymentCompleted, PaymentRefunded) để tự động sinh thông báo; API xem unread, read, read all. |
| Nhắc lịch tự động | Hoàn thiện | Scheduler | `BookingReminderService` chạy định kỳ mỗi 15 phút, quét booking trong 2 giờ tới chưa gửi thông báo để phát `BookingReminderEvent`. |
| Đánh giá & Nhận xét | Hoàn thiện | REVIEW-01..05 | Tạo đánh giá sau khi booking `COMPLETED`, chỉnh sửa đánh giá, xem danh sách đánh giá salon và xem tóm tắt rating (sao trung bình, biểu đồ sao). |
| AI Thử tóc 2 bước | Hoàn thiện | TRYON-01..04 | Bước 1: Upload ảnh gốc -> MediaPipe Face Mesh phát hiện 468 điểm mặt -> trả tọa độ overlay ban đầu (`TRYON-01`). Bước 2: Khách căn chỉnh và xác nhận -> Python Pillow thực hiện server-side merge -> lưu kết quả lên Cloudinary (`TRYON-02`). Đọc chi tiết kết quả (`TRYON-03`) và xem danh sách lịch sử thử tóc (`TRYON-04`). |
| Validate file ảnh AI | Hoàn thiện | TRYON-01 | Kiểm tra kích thước tối đa 5MB, định dạng JPEG/PNG/WebP, chống path traversal filename, Python kiểm tra khuôn mặt trước khi xử lý. |
| Quản trị Người dùng & Duyệt Salon | Hoàn thiện | ADMIN-01..06 | Danh sách người dùng, khóa/mở khóa tài khoản, xóa tài khoản, danh sách salon, duyệt/từ chối salon. |
| Quản trị Hoàn tiền | Hoàn thiện | ADMIN-07 | Admin xử lý hoàn tiền giao dịch hợp lệ, lưu lý do hoàn tiền và gửi thông báo cho khách. |
| Báo cáo & Thống kê | Hoàn thiện | REPORT-01..03 | Dashboard Overview (theo timezone `Asia/Ho_Chi_Minh`), báo cáo doanh thu theo dải thời gian `from - to`, thống kê số lượng booking theo trạng thái. |
| Ghi vết truy cập (Audit Log) | Hoàn thiện | AuditFilter | Bộ lọc `AuditFilter` bắt toàn bộ request `/api/**`, ghi log IP, method, URI, status, response time, userId vào bảng `audit_logs`. |

## Đối chiếu kiến trúc & sự kiện

1. **Event-Driven Architecture**: Booking, Payment và Notification liên kết lỏng lẻo thông qua Spring `ApplicationEventPublisher`. Khi một trạng thái thay đổi, event được bắn ra và `NotificationEventListener` xử lý tạo thông báo tương ứng.
2. **AI Processing Pipeline**: Tách biệt giữa xử lý tính toán khuôn mặt (Python MediaPipe/Pillow) và quản lý nghiệp vụ/lưu trữ (Java Spring Boot/Cloudinary). Giao tiếp nội bộ qua HTTP RestClient với `Internal-Token` bảo mật.
3. **Transaction & Compensation**: Khi upload ảnh AI hoặc finalize thất bại sau khi đã tải ảnh lên Cloudinary, hệ thống tự động gọi `StorageService.delete` để dọn dẹp file rác.
