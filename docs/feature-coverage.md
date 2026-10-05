# Feature Capability Map

Đây là đối chiếu heuristic dựa trên pattern phổ biến của app đặt lịch salon + AI thử tóc, **không phải đánh giá theo requirements chính thức** vì project chưa có tài liệu requirements được cung cấp.

| Nhóm tính năng | Trạng thái | Endpoint liên quan | Ghi chú |
|---|---|---|---|
| Đăng ký, đăng nhập, Google login, refresh/logout | Đã có | AUTH-01..08 | JWT stateless; change password và user profile hiện có. |
| Quản lý salon | Đã có | SALON-01..07 | Tạo/sửa, list/detail, business hours, trạng thái admin. |
| Quản lý stylist | Đã có | STYLIST-01..04 | Owner thêm/sửa, user xem detail/list. |
| Danh mục dịch vụ | Đã có | SERVICE-01..04 | CRUD hạn chế; không có delete/availability riêng. |
| Danh mục kiểu tóc | Đã có | CATEGORY-01..02, HAIR-01..07 | CRUD admin và gán kiểu tóc cho salon. |
| Xem lịch trống | Đã có một phần | API-63 | Trả giờ mở cửa và booked intervals theo ngày/stylist; frontend vẫn tự chia slot theo duration. |
| Đặt lịch | Đã có | BOOK-01..08, API-64 | Tạo, xem, confirm, cancel, complete và đổi lịch cho owner. |
| Race condition/trùng slot | Một phần | BOOK-01 | DB migration có exclusion constraint và ErrorCode `BOOKING_001`; chưa có HTTP integration test xác nhận. |
| Đổi lịch | Đã có | API-64 | Chỉ PENDING/CONFIRMED, owner, trước giờ hẹn ít nhất 2 giờ và không trùng slot. |
| Thanh toán | Một phần | PAY-01..03 | Payment tạo theo booking event, xem payment, SePay webhook; không có API initiate/payment retry/refund. |
| Thông báo | Đã có | NOTIFY-01..04 | List/unread/read/read-all; event listener tạo notification. |
| Review/đánh giá | Đã có | REVIEW-01..05 | Tạo/sửa/xem/list/summary; service kiểm tra quan hệ booking. |
| AI thử tóc, upload ảnh | Đã có | API-61, API-62 | Java có `TryOnController`/`TryOnService`; API-61 upload ảnh và gọi AI overlay, API-62 lưu ảnh finalize (Server-side merge). |
| Lưu/xem kết quả AI | Đã có | API-62, API-65..66 | Có finalize, đọc một result và list result theo user; mỗi request chỉ có một result theo unique constraint. |
| Xử lý ảnh không mặt/nhiều mặt/size/type | Đã có | API-61, API-62 | Java validate rỗng, tối đa 5 MB, JPEG/PNG/WebP và filename; Python từ chối ảnh không phát hiện mặt. Chưa có contract riêng cho nhiều mặt; MediaPipe chỉ lấy tối đa một mặt. |
| Nhắc lịch | Đã có | Scheduler | Có `BookingReminderService` chạy ngầm. |
| Quản trị user | Đã có | ADMIN-01..03 | List, cập nhật status, xóa (soft-delete). |
| Duyệt salon | Đã có | ADMIN-04..06 | List, approve, reject. |
| Báo cáo admin | Đã có | REPORT-01..03 | Overview, revenue theo Instant range, booking statistics. |
| Phân quyền và ownership | Một phần | Security toàn bộ API | Role checks tồn tại ở nhiều controller; một số read route chỉ có global JWT, ownership phụ thuộc service, cần HTTP test User A/B. |
| Audit/observability API | Đã có | AuditFilter | Đã thêm bảng `audit_logs` và `AuditFilter` cho `/api/`. |

## Đối chiếu service với endpoint

- Có service nhưng không có endpoint riêng: tạo payment cho booking và hủy payment cho booking được gọi qua booking/payment event flow; `getBookingOrThrow`, `getSalonOrThrow`, `getServiceOrThrow`, `getHairstyleOrThrow` và các hàm đếm/báo cáo chỉ là service nội bộ hoặc được endpoint khác sử dụng.
- Không thấy service hoặc endpoint cho refund, initiate payment riêng. Nhắc lịch, xóa user, audit log đã được thêm.
- Ownership được kiểm tra ở service cho booking detail/cancel, salon update/business hours, stylist create/update, service create/update, hairstyle assign/unassign, review update/create, notification read và payment theo booking. Một số list/detail như stylist/service/hairstyle/review theo salon chỉ query theo id và có thể trả danh sách rỗng nếu salon không tồn tại.
- Tài liệu này dùng tên API theo `requirements.md` hiện tại. Các mã `AUTH-01`, `BOOK-01`... trong tài liệu audit cũ là mã inventory trước đó, không phải mã mới của tài liệu requirements.
