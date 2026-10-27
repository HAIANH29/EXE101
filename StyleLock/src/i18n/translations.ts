import { AppLanguage } from './LanguageContext';

type TranslationEntry = {
  vi: string;
  en: string;
};

const entries: TranslationEntry[] = [
  { vi: 'Đang kiểm tra phiên đăng nhập...', en: 'Checking your session...' },
  { vi: 'Trang chủ', en: 'Home' },
  { vi: 'Khám phá', en: 'Explore' },
  { vi: 'AI Camera', en: 'AI Camera' },
  { vi: 'Lịch hẹn', en: 'Bookings' },
  { vi: 'Cá nhân', en: 'Profile' },
  { vi: 'Thông báo', en: 'Notifications' },
  { vi: 'Quay lại', en: 'Back' },
  { vi: 'Đăng nhập', en: 'Login' },
  { vi: 'Đăng nhập', en: 'Sign In' },
  { vi: 'Đăng ký', en: 'Sign Up' },
  { vi: 'Bỏ qua', en: 'Skip' },
  { vi: 'Email', en: 'EMAIL' },
  { vi: 'Mật khẩu', en: 'PASSWORD' },
  { vi: 'Quên?', en: 'Forgot?' },
  { vi: 'Đang kết nối...', en: 'Connecting...' },
  { vi: 'HOẶC TIẾP TỤC VỚI', en: 'OR CONTINUE WITH' },
  { vi: 'Bạn chưa có tài khoản?', en: "Don't have an account?" },
  { vi: 'Chuyên gia tạo kiểu AI cá nhân của bạn. Đăng nhập để truy cập bộ sưu tập.', en: 'Your personal AI styling expert. Sign in to access your gallery.' },
  { vi: 'Thiếu thông tin', en: 'Missing information' },
  { vi: 'Vui lòng nhập email và mật khẩu để đăng nhập backend.', en: 'Please enter email and password to sign in to the backend.' },
  { vi: 'Không đăng nhập được backend', en: 'Could not sign in to backend' },
  { vi: 'Vào demo', en: 'Enter demo' },
  { vi: 'OK', en: 'OK' },
  { vi: 'Hủy', en: 'Cancel' },
  { vi: 'Đóng', en: 'Close' },
  { vi: 'Tiếp tục demo', en: 'Continue demo' },
  { vi: 'Cần đăng nhập', en: 'Sign in required' },
  { vi: 'Vui lòng đăng nhập để đặt lịch với dữ liệu backend.', en: 'Please sign in to book with backend data.' },
  { vi: 'Tạo tài khoản', en: 'Create Account' },
  { vi: 'Lưu các ảnh thử tóc, lịch đặt và lịch sử salon của bạn.', en: 'Save your try-on looks, bookings, and salon history.' },
  { vi: 'HỌ TÊN', en: 'FULL NAME' },
  { vi: 'SỐ ĐIỆN THOẠI', en: 'PHONE' },
  { vi: 'XÁC NHẬN MẬT KHẨU', en: 'CONFIRM PASSWORD' },
  { vi: 'Ít nhất 8 ký tự', en: 'At least 8 characters' },
  { vi: 'Nhập lại mật khẩu', en: 'Re-enter password' },
  { vi: 'Hiện', en: 'Show' },
  { vi: 'Ẩn', en: 'Hide' },
  { vi: 'Đang tạo...', en: 'Creating...' },
  { vi: 'Bạn đã có tài khoản?', en: 'Already have an account?' },
  { vi: 'Vui lòng nhập họ tên, email và mật khẩu.', en: 'Please enter your full name, email, and password.' },
  { vi: 'Mật khẩu quá ngắn', en: 'Password too short' },
  { vi: 'Mật khẩu nên có ít nhất 8 ký tự.', en: 'Password should be at least 8 characters.' },
  { vi: 'Mật khẩu mới nên có ít nhất 8 ký tự.', en: 'New password should be at least 8 characters.' },
  { vi: 'Mật khẩu chưa khớp', en: 'Passwords do not match' },
  { vi: 'Vui lòng nhập lại đúng mật khẩu xác nhận.', en: 'Please re-enter the correct password confirmation.' },
  { vi: 'Đăng ký thất bại', en: 'Sign up failed' },
  { vi: 'Quên mật khẩu', en: 'Forgot Password' },
  { vi: 'Kiểm tra Gmail của bạn', en: 'Check Your Gmail' },
  { vi: 'Email đã gửi', en: 'Email sent' },
  { vi: 'Quay lại đăng nhập', en: 'Back to Login' },
  { vi: 'Tôi có link đặt lại', en: 'I Have A Reset Link' },
  { vi: 'Gửi email xác minh', en: 'Send Verification Email' },
  { vi: 'Đang gửi...', en: 'Sending...' },
  { vi: 'Bạn nhớ mật khẩu rồi?', en: 'Remember your password?' },
  { vi: 'Thiếu email', en: 'Missing email' },
  { vi: 'Vui lòng nhập email của tài khoản cần khôi phục.', en: 'Please enter the email of the account you want to recover.' },
  { vi: 'Backend chưa gửi được email khôi phục.', en: 'Backend could not send the recovery email yet.' },
  { vi: 'Mật khẩu mới', en: 'New Password' },
  { vi: 'Đổi mật khẩu thành công', en: 'Password changed successfully' },
  { vi: 'Bạn có thể đăng nhập bằng mật khẩu mới.', en: 'You can sign in with your new password.' },
  { vi: 'MÃ XÁC MINH', en: 'VERIFY TOKEN' },
  { vi: 'Dán token từ link reset', en: 'Paste token from reset link' },
  { vi: 'MẬT KHẨU MỚI', en: 'NEW PASSWORD' },
  { vi: 'Nhập lại mật khẩu mới', en: 'Re-enter new password' },
  { vi: 'Thiếu mã xác minh', en: 'Missing verify token' },
  { vi: 'Link reset không có token. Vui lòng mở lại link trong Gmail.', en: 'Reset link has no token. Please open the link from Gmail again.' },
  { vi: 'Xin chào, Sarah', en: 'Hello, Sarah' },
  { vi: 'Tìm phong cách đặc trưng tiếp theo của bạn.', en: 'Find your next signature look.' },
  { vi: 'BỘ SƯU TẬP THEO MÙA', en: 'SEASONAL COLLECTION' },
  { vi: 'Kiểu tóc hè mới', en: 'New Summer Styles' },
  { vi: 'Khám phá ngay', en: 'Explore Now' },
  { vi: 'Thử kiểu tóc', en: 'Try Hairstyle' },
  { vi: 'Đặt salon', en: 'Book Salon' },
  { vi: 'Tư vấn AI', en: 'AI Consult' },
  { vi: 'Lịch hẹn sắp tới', en: 'Upcoming Appointment' },
  { vi: 'Chưa có lịch hẹn sắp tới', en: 'No upcoming appointment' },
  { vi: 'Đặt lịch với salon gần bạn', en: 'Book with a nearby salon' },
  { vi: 'Chọn kiểu tóc, salon và khung giờ phù hợp', en: 'Choose a hairstyle, salon, and time slot that fits' },
  { vi: 'Gợi ý cho bạn', en: 'Recommended for You' },
  { vi: 'Xem tất cả', en: 'See All' },
  { vi: 'Tìm kiểu tóc, salon hoặc stylist...', en: 'Search styles, salons, or stylists...' },
  { vi: 'Khám phá kiểu tóc', en: 'Explore Styles' },
  { vi: 'Đang thịnh hành', en: 'Trending Now' },
  { vi: 'Thử ngay', en: 'Try Now' },
  { vi: 'Bộ lọc', en: 'Filters' },
  { vi: 'GIỚI TÍNH', en: 'GENDER' },
  { vi: 'ĐỘ DÀI', en: 'LENGTH' },
  { vi: 'PHONG CÁCH', en: 'STYLE' },
  { vi: 'Xóa tất cả', en: 'Clear All' },
  { vi: 'Áp dụng bộ lọc', en: 'Apply Filters' },
  { vi: 'Tất cả', en: 'All' },
  { vi: 'Nữ', en: 'Women' },
  { vi: 'Nam', en: 'Men' },
  { vi: 'Gợn sóng', en: 'Wavy' },
  { vi: 'Sắp tới', en: 'Upcoming' },
  { vi: 'Đã hoàn tất', en: 'Completed' },
  { vi: 'Đã hủy', en: 'Cancelled' },
  { vi: 'Đang chờ', en: 'PENDING' },
  { vi: 'Đã xác nhận', en: 'CONFIRMED' },
  { vi: 'Đang phục vụ', en: 'IN SERVICE' },
  { vi: 'Hoàn tất', en: 'COMPLETED' },
  { vi: 'ĐÃ HỦY', en: 'CANCELLED' },
  { vi: 'Chờ duyệt', en: 'Pending' },
  { vi: 'Đã duyệt', en: 'Confirmed' },
  { vi: 'Nam', en: 'Male' },
  { vi: 'Nữ', en: 'Female' },
  { vi: 'Unisex', en: 'Unisex' },
  { vi: 'Ngắn', en: 'Short' },
  { vi: 'Trung bình', en: 'Medium' },
  { vi: 'Dài', en: 'Long' },
  { vi: 'Layer', en: 'Layered' },
  { vi: 'Uốn xoăn', en: 'Curly' },
  { vi: 'Duỗi thẳng', en: 'Straight' },
  { vi: 'Màu nhuộm', en: 'Color' },
  { vi: 'Cổ điển', en: 'Classic' },
  { vi: 'Tìm kiểu tóc, màu nhuộm, xu hướng...', en: 'Search hairstyles, colors, trends...' },
  { vi: 'GIÁ DỰ KIẾN', en: 'EST. PRICE' },
  { vi: 'Dáng mặt', en: 'Face Shapes' },
  { vi: 'Bảo dưỡng', en: 'Maintenance' },
  { vi: 'Thấp', en: 'Low' },
  { vi: 'Loại tóc', en: 'Hair Type' },
  { vi: 'Thẳng, gợn sóng', en: 'Straight, Wavy' },
  { vi: 'Thời gian tạo kiểu', en: 'Styling Time' },
  { vi: '15 phút', en: '15 mins' },
  { vi: 'Ghi chú stylist', en: 'Stylist Notes' },
  { vi: 'STYLIST CHÍNH', en: 'MASTER STYLIST' },
  { vi: 'Sản phẩm gợi ý', en: 'Recommended Products' },
  { vi: 'Xịt tạo texture', en: 'Texture Spray' },
  { vi: 'Sáp matte', en: 'Matte Pomade' },
  { vi: 'Serum dưỡng ẩm', en: 'Hydrating Serum' },
  { vi: 'THỬ TÓC', en: 'TRY ON' },
  { vi: 'ĐẶT KIỂU NÀY', en: 'BOOK THIS STYLE' },
  { vi: 'Chia sẻ', en: 'Share' },
  { vi: 'Sản phẩm gợi ý chăm sóc kiểu tóc này ($28)', en: 'Recommended care product for this hairstyle ($28)' },
  { vi: 'Sản phẩm gợi ý giữ nếp kiểu tóc này ($32)', en: 'Recommended hold product for this hairstyle ($32)' },
  { vi: 'Tinh chất dưỡng tóc mềm mượt ($35)', en: 'Softening hair serum ($35)' },
  { vi: 'Camera chưa sẵn sàng', en: 'Camera is not ready' },
  { vi: 'Vui lòng đợi camera mở xong rồi thử lại.', en: 'Please wait for the camera to open, then try again.' },
  { vi: 'Không chụp được ảnh', en: 'Could not capture photo' },
  { vi: 'Thiết bị hoặc trình duyệt chưa cho phép mở camera.', en: 'The device or browser has not allowed camera access.' },
  { vi: 'Quyền camera', en: 'Camera permission' },
  { vi: 'Vui lòng cấp quyền Camera để chụp ảnh khuôn mặt!', en: 'Please grant camera permission to capture your face!' },
  { vi: 'Quyền truy cập', en: 'Access permission' },
  { vi: 'Vui lòng cấp quyền thư viện ảnh để chọn ảnh khuôn mặt!', en: 'Please grant photo library access to choose a face photo!' },
  { vi: 'Đang kiểm tra camera...', en: 'Checking camera...' },
  { vi: 'StyleLock cần quyền camera', en: 'StyleLock needs camera permission' },
  { vi: 'Cho phép camera để xem preview trực tiếp và chụp ảnh khuôn mặt.', en: 'Allow camera access to see a live preview and capture your face.' },
  { vi: 'Cho phép Camera', en: 'Allow Camera' },
  { vi: 'THEO DÕI TRỰC TIẾP', en: 'LIVE TRACKING' },
  { vi: 'DÁNG MẶT NHẬN DIỆN', en: 'DETECTED SHAPE' },
  { vi: 'Oval', en: 'Oval' },
  { vi: 'ĐỘ TIN CẬY', en: 'CONFIDENCE' },
  { vi: 'Đặt kiểu tóc này', en: 'Book This Hairstyle' },
  { vi: 'Bob', en: 'Bob' },
  { vi: 'Sóng nhẹ', en: 'Waves' },
  { vi: 'Mượt thẳng', en: 'Sleek' },
  { vi: 'Shag', en: 'Shag' },
  { vi: 'Di chuyển & chỉnh tỉ lệ cho khớp với khuôn mặt', en: 'Move and scale to match your face' },
  { vi: 'Công cụ căn chỉnh mẫu tóc', en: 'Hair alignment tools' },
  { vi: 'Phóng to', en: 'Zoom in' },
  { vi: 'Thu nhỏ', en: 'Zoom out' },
  { vi: 'Xoay trái', en: 'Rotate left' },
  { vi: 'Xoay phải', en: 'Rotate right' },
  { vi: 'Lên', en: 'Up' },
  { vi: 'Xuống', en: 'Down' },
  { vi: 'Trái', en: 'Left' },
  { vi: 'Phải', en: 'Right' },
  { vi: 'Đặt lại', en: 'Reset' },
  { vi: 'Đổi ảnh khác', en: 'Choose another photo' },
  { vi: 'Chỉnh ghép kiểu tóc', en: 'Adjust hairstyle overlay' },
  { vi: 'Đổi mẫu tóc', en: 'Change hairstyle' },
  { vi: 'LƯU Ý TRẢI NGHIỆM THỬ TÓC:', en: 'TRY-ON EXPERIENCE NOTE:' },
  { vi: 'TÌM TIỆM LÀM KIỂU NÀY', en: 'FIND A SALON FOR THIS STYLE' },
  { vi: '“Kết quả thử mang tính tham khảo trực quan. Vui lòng tham vấn thợ salon dựa trên chất tóc và chất da đầu thực tế trước khi thực hiện dịch vụ.”', en: '“The try-on result is a visual reference. Please consult a salon stylist based on your actual hair and scalp condition before the service.”' },
  { vi: 'Tìm salon gần bạn...', en: 'Search salons near you...' },
  { vi: 'KIỂU TÓC ĐÃ CHỌN:', en: 'SELECTED HAIRSTYLE:' },
  { vi: 'Hiển thị salon đối tác có thể làm kiểu này', en: 'Showing partner salons that craft this style' },
  { vi: 'Đang mở cửa', en: 'Open Now' },
  { vi: 'Khoảng cách', en: 'Distance' },
  { vi: 'Đánh giá', en: 'Rating' },
  { vi: 'Giá', en: 'Price' },
  { vi: 'Gần nhất', en: 'Nearest' },
  { vi: 'Dưới 2 km', en: 'Under 2 km' },
  { vi: 'Dưới 5 km', en: 'Under 5 km' },
  { vi: 'Dưới 10 km', en: 'Under 10 km' },
  { vi: 'Giá thấp → cao', en: 'Price: Low to High' },
  { vi: 'Giá cao → thấp', en: 'Price: High to Low' },
  { vi: 'Dưới 200k', en: 'Under 200k' },
  { vi: '200k - 400k', en: '200k - 400k' },
  { vi: 'Trên 400k', en: 'Over 400k' },
  { vi: 'Điểm cao nhất', en: 'Highest rating' },
  { vi: 'Bảng giá:', en: 'Price range:' },
  { vi: 'Giá từ', en: 'From' },
  { vi: 'Đặt', en: 'Book' },
  { vi: 'Trung tâm', en: 'Center' },
  { vi: 'Dịch vụ tạo kiểu tóc & màu cao cấp', en: 'Premium hair styling & color' },
  { vi: 'Nhận làm chuẩn mẫu tóc này', en: 'Can recreate this hairstyle' },
  { vi: 'Tham vấn thợ trước khi làm', en: 'Consult stylist first' },
  { vi: 'Địa chỉ', en: 'Address' },
  { vi: 'Số điện thoại', en: 'Phone' },
  { vi: 'Giờ làm việc', en: 'Opening hours' },
  { vi: 'Chi tiết salon', en: 'Salon Detail' },
  { vi: 'ẢNH THỬ TÓC ĐÍNH KÈM:', en: 'ATTACHED HAIRSTYLE:' },
  { vi: 'Ảnh sẽ được gửi kèm yêu cầu đặt lịch', en: 'Photo will be attached to booking request' },
  { vi: 'Stylist nổi bật', en: 'Top Stylists' },
  { vi: 'Dịch vụ', en: 'Services' },
  { vi: 'Bộ sưu tập', en: 'Portfolio' },
  { vi: 'Đánh giá', en: 'Reviews' },
  { vi: 'Giới thiệu', en: 'About' },
  { vi: 'Chuyên gia màu tóc', en: 'Master Colorist' },
  { vi: 'Cắt tóc chính xác', en: 'Precision Cuts' },
  { vi: 'Dịch vụ tạo kiểu trọn gói với dưỡng tóc tùy chỉnh và hoàn thiện đặc trưng.', en: 'Full dimensional service with custom conditioning & signature styling.' },
  { vi: 'Salon này chưa có dịch vụ từ backend.', en: 'This salon has no backend services yet.' },
  { vi: 'Chọn ngày', en: 'Select Date' },
  { vi: 'Chọn giờ', en: 'Select Time' },
  { vi: 'Vị trí', en: 'Location' },
  { vi: 'Nhắn tin', en: 'Message' },
  { vi: 'Đặt lịch', en: 'Book Appointment' },
  { vi: 'Nhắn salon', en: 'Message Salon' },
  { vi: 'Thiếu lựa chọn', en: 'Selection Missing' },
  { vi: 'Vui lòng chọn dịch vụ, stylist, ngày và khung giờ!', en: 'Please select a service, stylist, date and time slot!' },
  { vi: 'Bất kỳ ai', en: 'Anyone' },
  { vi: 'StyleLock stylist', en: 'StyleLock stylist' },
  { vi: 'Chọn', en: 'Select' },
  { vi: 'Đã chọn', en: 'Selected' },
  { vi: 'Booking', en: 'Booking' },
  { vi: 'Đã xác nhận booking!', en: 'Booking Confirmed!' },
  { vi: 'Đang xác nhận...', en: 'Confirming...' },
  { vi: 'Xác nhận đặt lịch', en: 'Confirm Booking' },
  { vi: 'Chọn dịch vụ', en: 'Select Service' },
  { vi: 'Chọn stylist', en: 'Choose Stylist' },
  { vi: 'Ngày & giờ', en: 'Date & Time' },
  { vi: 'KIỂU TÓC ĐÍNH KÈM', en: 'ATTACHED HAIRSTYLE' },
  { vi: 'Salon sẽ xem ảnh thử tóc này', en: 'The salon will review this try-on photo' },
  { vi: 'Thông tin của bạn', en: 'Your Details' },
  { vi: 'Họ tên *', en: 'Full Name *' },
  { vi: 'Số điện thoại *', en: 'Phone Number *' },
  { vi: 'TỔNG CỘNG', en: 'TOTAL' },
  { vi: 'Nhập tên của bạn', en: 'Enter your name' },
  { vi: 'VD: 0988 123 456', en: 'e.g. 0988 123 456' },
  { vi: 'Vui lòng chọn dịch vụ và stylist.', en: 'Please select a service and stylist.' },
  { vi: 'Vui lòng nhập tên người đặt!', en: 'Please enter the booking name!' },
  { vi: 'Vui lòng nhập số điện thoại hợp lệ!', en: 'Please enter a valid phone number!' },
  { vi: 'Backend không tạo được booking.', en: 'Backend could not create the booking.' },
  { vi: 'Không tạo được booking backend', en: 'Could not create backend booking' },
  { vi: 'Lịch sử đặt lịch', en: 'My Bookings' },
  { vi: 'Lịch sử thanh toán', en: 'Payment History' },
  { vi: 'Sắp tới', en: 'Upcoming' },
  { vi: 'Đã hoàn thành', en: 'Completed' },
  { vi: 'Đã hủy', en: 'Cancelled' },
  { vi: 'Tất cả', en: 'All' },
  { vi: 'Chờ thanh toán', en: 'Pending Payment' },
  { vi: 'Đã thanh toán', en: 'Paid' },
  { vi: 'Hoàn tiền', en: 'Refund' },
  { vi: 'Chạm để quét mã QR thanh toán ngay ➔', en: 'Tap to scan QR and pay now ➔' },
  { vi: 'Bạn chưa có giao dịch thanh toán nào.', en: 'You have no payment transactions yet.' },
  { vi: 'Không có giao dịch nào ở mục này.', en: 'No transactions in this category.' },
  { vi: 'Các giao dịch giữ chỗ và hóa đơn dịch vụ sẽ xuất hiện tại đây.', en: 'Reservation transactions and service receipts will appear here.' },
  { vi: 'Chưa có lịch hẹn nào', en: 'No bookings yet' },
  { vi: 'Khám phá các kiểu tóc mới và đặt lịch giữ chỗ ngay hôm nay!', en: 'Explore new hairstyles and reserve your spot today!' },
  { vi: 'Hủy lịch hẹn', en: 'Cancel appointment' },
  { vi: 'Bạn có chắc chắn muốn hủy lịch hẹn này?', en: 'Are you sure you want to cancel this appointment?' },
  { vi: 'Xác nhận hủy', en: 'Confirm cancellation' },
  { vi: 'Đổi lịch', en: 'Reschedule' },
  { vi: 'Đổi lịch hẹn', en: 'Reschedule appointment' },
  { vi: 'Chọn giờ mới', en: 'Choose new time' },
  { vi: 'Tin nhắn', en: 'Message' },
  { vi: 'Không tải được lịch hẹn', en: 'Could not load bookings' },
  { vi: 'Không tải được lịch hẹn backend.', en: 'Could not load backend bookings.' },
  { vi: 'Lịch hẹn của bạn đã được hủy thành công.', en: 'Your booking has been cancelled successfully.' },
  { vi: 'Hủy thất bại', en: 'Cancel failed' },
  { vi: 'Không thể hủy booking backend.', en: 'Could not cancel backend booking.' },
  { vi: 'Xem chi tiết', en: 'View details' },
  { vi: 'Bạn muốn hủy lịch hẹn này?', en: 'Do you want to cancel this booking?' },
  { vi: 'Hủy lịch', en: 'Cancel booking' },
  { vi: 'Chi tiết đặt lịch', en: 'Booking details' },
  { vi: 'Không tìm thấy thông tin đặt lịch', en: 'Booking information not found' },
  { vi: 'Đang chờ salon xác nhận', en: 'Waiting for salon confirmation' },
  { vi: 'Yêu cầu đặt lịch đã được gửi đến salon. Salon sẽ xác nhận trong vòng vài phút.', en: 'Your booking request has been sent to the salon. The salon will confirm within a few minutes.' },
  { vi: 'Đã xác nhận lịch hẹn', en: 'Booking confirmed' },
  { vi: 'Salon đã chấp nhận đặt lịch. Vui lòng đến đúng giờ hẹn để trải nghiệm dịch vụ.', en: 'The salon accepted your booking. Please arrive on time for your service.' },
  { vi: 'Đang phục vụ tại salon', en: 'In service at salon' },
  { vi: 'Lịch hẹn đang được thực hiện. Bạn có thể theo dõi trạng thái hoàn tất tại đây.', en: 'Your appointment is in progress. You can track completion here.' },
  { vi: 'Dịch vụ đã hoàn thành', en: 'Service completed' },
  { vi: 'Dịch vụ đã hoàn tất. Cảm ơn bạn đã sử dụng StyleLock.', en: 'The service is complete. Thank you for using StyleLock.' },
  { vi: 'Lịch hẹn đã bị hủy', en: 'Booking cancelled' },
  { vi: 'Lịch hẹn đã bị hủy do salon bận hoặc do khách hàng thay đổi kế hoạch.', en: 'This booking was cancelled because the salon was busy or the customer changed plans.' },
  { vi: 'Về trang chủ', en: 'Back to home' },
  { vi: 'Simulator cho demo', en: 'Demo simulator' },
  { vi: 'Giả lập salon xác nhận lịch hẹn', en: 'Simulate salon confirming booking' },
  { vi: 'Giả lập quét mã và hoàn thành dịch vụ', en: 'Simulate QR scan and service completion' },
  { vi: 'Mã xác minh tại salon', en: 'Salon verification code' },
  { vi: 'Đưa mã này cho thu ngân khi đến salon', en: 'Show this code to the cashier when you arrive' },
  { vi: 'Mã booking', en: 'Booking code' },
  { vi: 'Thông tin lịch hẹn', en: 'Booking information' },
  { vi: 'Các thông tin salon cần để phục vụ bạn', en: 'Details the salon needs to serve you' },
  { vi: 'Mã đặt lịch', en: 'Booking ID' },
  { vi: 'Salon tiếp nhận', en: 'Receiving salon' },
  { vi: 'Thời gian làm tóc', en: 'Hair appointment time' },
  { vi: 'Ngày', en: 'Date' },
  { vi: 'Dịch vụ chọn', en: 'Selected service' },
  { vi: 'Cắt tạo kiểu', en: 'Cut and style' },
  { vi: 'Khách hàng', en: 'Customer' },
  { vi: 'Tổng chi phí dịch vụ', en: 'Total service cost' },
  { vi: 'Mẫu tóc Try-On đã chọn', en: 'Selected try-on hairstyle' },
  { vi: 'Salon sẽ dùng ảnh này làm tham chiếu tạo kiểu', en: 'The salon will use this image as a styling reference' },
  { vi: 'Thợ cắt sẽ căn cứ vào ảnh Try-On này để tạo hình đúng sở thích của bạn.', en: 'The stylist will use this try-on image as a reference for your preferred look.' },
  { vi: 'Lịch sử đặt lịch', en: 'Booking history' },
  { vi: 'Đang tải thông báo...', en: 'Loading notifications...' },
  { vi: 'Chưa xem được thông báo', en: 'Could not load notifications' },
  { vi: 'Bạn cần đăng nhập để xem thông báo.', en: 'Please sign in to view notifications.' },
  { vi: 'Không tải được thông báo.', en: 'Could not load notifications.' },
  { vi: 'Không đánh dấu đã đọc được.', en: 'Could not mark notification as read.' },
  { vi: 'Không đánh dấu tất cả đã đọc được.', en: 'Could not mark all notifications as read.' },
  { vi: 'Thử lại', en: 'Try again' },
  { vi: 'Chưa có thông báo', en: 'No notifications yet' },
  { vi: 'Khi lịch hẹn hoặc thanh toán có thay đổi, thông báo sẽ xuất hiện ở đây.', en: 'When bookings or payments change, notifications will appear here.' },
  { vi: 'Tất cả đã được đọc', en: 'All caught up' },
  { vi: 'Vừa xong', en: 'Just now' },
  { vi: 'Xem lịch hẹn', en: 'View booking' },
  { vi: 'Xác nhận', en: 'Confirmation' },
  { vi: 'Thanh toán', en: 'Payment' },
  { vi: 'Quản trị & phân tích StyleLock', en: 'StyleLock Admin & Analytics' },
  { vi: 'Về Trang Chủ', en: 'Back to Home' },
  { vi: 'BÁO CÁO DỰ ÁN (PITCH DECK METRICS)', en: 'PROJECT REPORT (PITCH DECK METRICS)' },
  { vi: 'Chỉ số chứng minh hiệu quả conversion funnel O2O', en: 'Metrics proving the O2O conversion funnel' },
  { vi: 'Tổng lượt Thử Tóc (Virtual Try-on)', en: 'Total Virtual Try-ons' },
  { vi: 'Tổng Yêu Cầu Đặt Lịch (Bookings)', en: 'Total Booking Requests' },
  { vi: 'Tỷ lệ Chuyển đổi (Try ➔ Book)', en: 'Conversion Rate (Try ➔ Book)' },
  { vi: 'Đơn Thành Công (Completed)', en: 'Successful Orders (Completed)' },
  { vi: 'TỔNG DOANH THU GIAO DỊCH:', en: 'TOTAL TRANSACTION REVENUE:' },
  { vi: 'Mô hình doanh thu StyleLock:', en: 'StyleLock revenue model:' },
  { vi: '• Phí booking: 2,000 – 5,000 VNĐ / đơn thành công', en: '• Booking fee: 2,000 – 5,000 VND / successful order' },
  { vi: '• Gói Salon Pro: 150,000 VNĐ / tháng / salon', en: '• Salon Pro plan: 150,000 VND / month / salon' },
  { vi: 'Quản lý dữ liệu hệ thống', en: 'System data management' },
  { vi: 'Mẫu tóc PNG (20 kiểu)', en: 'PNG hairstyles (20 styles)' },
  { vi: 'Salon đối tác (5 địa điểm)', en: 'Partner salons (5 locations)' },
  { vi: 'Về App Khách', en: 'Back to Customer App' },
  { vi: 'Bảng điều khiển salon', en: 'Salon Merchant Dashboard' },
  { vi: 'Đang quản lý với tư cách Salon đối tác:', en: 'Managing as partner salon:' },
  { vi: 'Cơ chế Double-Booking Protection:', en: 'Double-Booking Protection:' },
  { vi: 'Vui lòng kiểm tra thợ & ghế trống tại Salon trước khi bấm', en: 'Please check stylist and chair availability at the salon before pressing' },
  { vi: '. Khách hàng đang chờ phản hồi xác nhận.', en: '. The customer is waiting for confirmation.' },
  { vi: 'Cập nhật thành công', en: 'Update successful' },
  { vi: 'Chờ duyệt (', en: 'Pending (' },
  { vi: 'Đã duyệt (', en: 'Confirmed (' },
  { vi: 'Hoàn tất (', en: 'Completed (' },
  { vi: 'Mã phiếu: #', en: 'Ticket ID: #' },
  { vi: 'Tạo lúc:', en: 'Created at:' },
  { vi: 'Khách hàng:', en: 'Customer:' },
  { vi: 'SĐT:', en: 'Phone:' },
  { vi: 'Khung giờ hẹn:', en: 'Appointment time:' },
  { vi: 'ngày', en: 'on' },
  { vi: 'Dịch vụ chọn:', en: 'Selected service:' },
  { vi: 'Tổng thu:', en: 'Revenue:' },
  { vi: 'Ảnh thử tóc', en: 'Try-on Photo' },
  { vi: 'Phong cách:', en: 'Style:' },
  { vi: 'HỦY LỊCH', en: 'CANCEL BOOKING' },
  { vi: 'DUYỆT GIỮ CHỖ', en: 'CONFIRM SLOT' },
  { vi: 'Khách No-show', en: 'Customer no-show' },
  { vi: 'XÁC NHẬN THANH TOÁN', en: 'CONFIRM PAYMENT' },
  { vi: 'Đã hoàn tất & Đã thu tiền', en: 'Completed & paid' },
  { vi: 'Đã hủy yêu cầu đặt lịch này', en: 'This booking request was cancelled' }
];

const translations = entries.reduce<Record<string, TranslationEntry>>((acc, entry) => {
  acc[entry.vi] = entry;
  acc[entry.en] = entry;
  return acc;
}, {});

const dynamicRules: Array<{
  match: RegExp;
  build: (language: AppLanguage, value: string) => string | undefined;
}> = [
  {
    match: /^Sharing (.+)\.\.\.$/,
    build: (language, value) => {
      const name = value.match(/^Sharing (.+)\.\.\.$/)?.[1];
      if (!name) return undefined;
      return language === 'vi' ? `Đang chia sẻ ${name}...` : `Sharing ${name}...`;
    }
  },
  {
    match: /^Sending direct message to (.+)\.\.\.$/,
    build: (language, value) => {
      const name = value.match(/^Sending direct message to (.+)\.\.\.$/)?.[1];
      if (!name) return undefined;
      return language === 'vi' ? `Đang gửi tin nhắn trực tiếp đến ${name}...` : `Sending direct message to ${name}...`;
    }
  },
  {
    match: /^Đang kết nối chat trực tiếp với (.+)\.\.\.$/,
    build: (language, value) => {
      const name = value.match(/^Đang kết nối chat trực tiếp với (.+)\.\.\.$/)?.[1];
      if (!name) return undefined;
      return language === 'en' ? `Connecting direct chat with ${name}...` : `Đang kết nối chat trực tiếp với ${name}...`;
    }
  },
  {
    match: /^(\d+)% Match$/,
    build: (language, value) => {
      const percent = value.match(/^(\d+)% Match$/)?.[1];
      if (!percent) return undefined;
      return language === 'vi' ? `${percent}% phù hợp` : `${percent}% Match`;
    }
  },
  {
    match: /^Premium hair styling & color \((.+)\)$/,
    build: (language, value) => {
      const range = value.match(/^Premium hair styling & color \((.+)\)$/)?.[1];
      if (!range) return undefined;
      return language === 'vi'
        ? `Dịch vụ tạo kiểu tóc & màu cao cấp (${range})`
        : `Premium hair styling & color (${range})`;
    }
  },
  {
    match: /^(\d+) reviews$/,
    build: (language, value) => {
      const count = value.match(/^(\d+) reviews$/)?.[1];
      if (!count) return undefined;
      return language === 'vi' ? `${count} đánh giá` : `${count} reviews`;
    }
  },
  {
    match: /^(\d+) min$/,
    build: (language, value) => {
      const minutes = value.match(/^(\d+) min$/)?.[1];
      if (!minutes) return undefined;
      return language === 'vi' ? `${minutes} phút` : `${minutes} min`;
    }
  },
  {
    match: /^Today \((.+)\)$/,
    build: (language, value) => {
      const date = value.match(/^Today \((.+)\)$/)?.[1];
      if (!date) return undefined;
      return language === 'vi' ? `Hôm nay (${date})` : `Today (${date})`;
    }
  },
  {
    match: /^Tomorrow \((.+)\)$/,
    build: (language, value) => {
      const date = value.match(/^Tomorrow \((.+)\)$/)?.[1];
      if (!date) return undefined;
      return language === 'vi' ? `Ngày mai (${date})` : `Tomorrow (${date})`;
    }
  },
  {
    match: /^Day (\d+) \((.+)\)$/,
    build: (language, value) => {
      const parts = value.match(/^Day (\d+) \((.+)\)$/);
      if (!parts) return undefined;
      return language === 'vi' ? `Ngày ${parts[1]} (${parts[2]})` : `Day ${parts[1]} (${parts[2]})`;
    }
  },
  {
    match: /^(\d+) thông báo chưa đọc$/,
    build: (language, value) => {
      const count = value.match(/^(\d+) thông báo chưa đọc$/)?.[1];
      if (!count) return undefined;
      return language === 'vi' ? `${count} thông báo chưa đọc` : `${count} unread notifications`;
    }
  },
  {
    match: /^(\d+) phút trước$/,
    build: (language, value) => {
      const count = value.match(/^(\d+) phút trước$/)?.[1];
      if (!count) return undefined;
      return language === 'vi' ? `${count} phút trước` : `${count} minutes ago`;
    }
  },
  {
    match: /^(\d+) giờ trước$/,
    build: (language, value) => {
      const count = value.match(/^(\d+) giờ trước$/)?.[1];
      if (!count) return undefined;
      return language === 'vi' ? `${count} giờ trước` : `${count} hours ago`;
    }
  },
  {
    match: /^(\d+) ngày trước$/,
    build: (language, value) => {
      const count = value.match(/^(\d+) ngày trước$/)?.[1];
      if (!count) return undefined;
      return language === 'vi' ? `${count} ngày trước` : `${count} days ago`;
    }
  },
  {
    match: /^Bạn muốn chọn lại thời gian cho lịch hẹn tại (.+)\?$/,
    build: (language, value) => {
      const salonName = value.match(/^Bạn muốn chọn lại thời gian cho lịch hẹn tại (.+)\?$/)?.[1];
      if (!salonName) return undefined;
      return language === 'vi'
        ? `Bạn muốn chọn lại thời gian cho lịch hẹn tại ${salonName}?`
        : `Do you want to choose a new time for your booking at ${salonName}?`;
    }
  },
  {
    match: /^Không có lịch hẹn nào ở mục \[(.+)\]$/,
    build: (language, value) => {
      const status = value.match(/^Không có lịch hẹn nào ở mục \[(.+)\]$/)?.[1];
      if (!status) return undefined;
      return language === 'vi'
        ? `Không có lịch hẹn nào ở mục [${status}]`
        : `No bookings in [${status}]`;
    }
  },
  {
    match: /^Lịch hẹn #(.+) đã chuyển sang trạng thái \[(.+)\]$/,
    build: (language, value) => {
      const parts = value.match(/^Lịch hẹn #(.+) đã chuyển sang trạng thái \[(.+)\]$/);
      if (!parts) return undefined;
      return language === 'vi'
        ? `Lịch hẹn #${parts[1]} đã chuyển sang trạng thái [${parts[2]}]`
        : `Booking #${parts[1]} was moved to [${parts[2]}]`;
    }
  },
  {
    match: /^Địa chỉ: (.+)\nSĐT: (.+)\nGiờ làm việc: (.+)$/,
    build: (language, value) => {
      const parts = value.match(/^Địa chỉ: (.+)\nSĐT: (.+)\nGiờ làm việc: (.+)$/);
      if (!parts) return undefined;
      return language === 'vi'
        ? `Địa chỉ: ${parts[1]}\nSĐT: ${parts[2]}\nGiờ làm việc: ${parts[3]}`
        : `Address: ${parts[1]}\nPhone: ${parts[2]}\nOpening hours: ${parts[3]}`;
    }
  }
];

export function translateText(language: AppLanguage, value: string) {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return value;

  const [, leading, core, trailing] = match;
  const normalizedCore = core.replace(/\s+/g, ' ').trim();
  if (!normalizedCore) return value;

  const exact = translations[normalizedCore];
  if (exact) {
    return `${leading}${exact[language]}${trailing}`;
  }

  for (const rule of dynamicRules) {
    if (rule.match.test(normalizedCore)) {
      const translated = rule.build(language, normalizedCore);
      if (translated) return `${leading}${translated}${trailing}`;
    }
  }

  return value;
}
