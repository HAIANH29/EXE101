# STYLELOCK — PROJECT CONTEXT & MASTER REQUIREMENTS

Bạn là AI Developer chịu trách nhiệm xây dựng ứng dụng **StyleLock**.

**QUAN TRỌNG:** Trước khi viết bất kỳ code nào, hãy đọc và hiểu toàn bộ project context dưới đây. Không tự ý thay đổi business logic, user flow hoặc thêm các tính năng lớn ngoài phạm vi MVP.

---

## 1. PROJECT OVERVIEW

**Tên:** StyleLock
**Slogan:** “Thử là hợp – Chốt là xinh”
**Mô hình:** O2O (Online-to-Offline)

StyleLock là ứng dụng kết nối **khách hàng với các salon tóc**.

Mục tiêu chính:

> Giúp khách hàng nhìn thấy kiểu tóc trước khi cắt, sau đó tìm salon phù hợp và đặt lịch nhanh.

Ứng dụng giải quyết 3 vấn đề chính:

1. Khách sợ kiểu tóc mới không hợp với khuôn mặt.
2. Khách khó mô tả kiểu tóc mong muốn cho thợ.
3. Khách phải chờ lâu tại salon và salon có thể bị trống lịch.

Giải pháp:

* Virtual Try-on
* Booking Profile
* Smart Booking

---

# 2. CORE MVP FLOW

Đây là **luồng quan trọng nhất của toàn bộ ứng dụng**.

AI PHẢI ưu tiên xây dựng và hoàn thiện flow này trước các tính năng phụ.

```text
HOME
  ↓
THỬ TÓC NGAY
  ↓
CHỤP ẢNH / TẢI ẢNH
  ↓
CHỌN MẪU TÓC
  ↓
KHỚP MẪU TÓC
  ↓
TÌM TIỆM LÀM KIỂU NÀY
  ↓
DANH SÁCH SALON
  ↓
CHỌN SALON
  ↓
CHỌN NGÀY
  ↓
CHỌN GIỜ
  ↓
NHẬP SỐ ĐIỆN THOẠI
  ↓
XÁC NHẬN BOOKING
  ↓
PENDING
  ↓
SALON CONFIRM
  ↓
BOOKING CONFIRMED
```

Đây là **conversion funnel chính**:

```text
Try Hair
    ↓
Like Hair
    ↓
Find Salon
    ↓
Book Salon
    ↓
Complete Service
```

Không làm UI theo kiểu một ứng dụng đặt lịch thông thường. **Virtual Try-on là điểm bắt đầu và là feature nổi bật nhất.**

---

# 3. CUSTOMER APP

## 3.1 Home

Home phải giúp người dùng hiểu ngay StyleLock dùng để làm gì.

Các thành phần chính:

* Logo StyleLock
* Slogan
* CTA lớn: **“Thử tóc ngay”**
* Một số mẫu tóc nổi bật
* Salon nổi bật / gần đây
* Giải thích ngắn về cách hoạt động

CTA chính:

```text
Thử tóc ngay
```

Khi click → mở Virtual Try-on flow.

---

# 4. VIRTUAL TRY-ON

Đây là **CORE FEATURE #1**.

Flow:

```text
Try Hair
 ↓
Camera / Upload Image
 ↓
Select Hair Style
 ↓
Hair Overlay Editor
 ↓
Preview Result
```

## 4.1 Upload / Camera

Cho phép:

* Chụp ảnh bằng camera
* Upload ảnh có sẵn

Camera UI cần đơn giản.

Có thể sử dụng:

* Face guide
* Overlay guide
* Khung căn mặt

Mục tiêu là giúp người dùng chụp ảnh chính diện dễ dàng.

---

## 4.2 Hair Style Selection

MVP sử dụng khoảng **20 mẫu tóc**.

Các mẫu tóc là:

```text
PNG transparent
```

Sau này có thể mở rộng lên 100+ mẫu.

Mỗi hair style nên có:

* Image
* Name
* Category
* Gender / suitable target nếu cần
* Preview

Ví dụ:

```text
Classic
Layer
Two Block
Short
Long
Curly
...
```

Không cần xây hệ thống AI tạo kiểu tóc thật ở MVP.

MVP sử dụng **hair PNG overlay**.

---

# 5. HAIR EDITOR

Sau khi chọn mẫu tóc:

```text
User Photo
     +
Hair PNG
     ↓
Interactive Preview
```

Người dùng có thể:

* Drag
* Zoom in
* Zoom out
* Rotate

Mục tiêu:

> Căn mẫu tóc vào khuôn mặt sao cho người dùng có thể hình dung kiểu tóc.

UI phải trực quan, ưu tiên mobile interaction.

Sau khi người dùng hài lòng:

```text
Tìm tiệm làm kiểu này
```

→ chuyển sang Salon Search.

---

# 6. TRY-ON DISCLAIMER

Vì kết quả thử tóc chỉ mang tính tham khảo trực quan, màn hình Try-on phải có disclaimer:

> “Kết quả thử mang tính tham khảo trực quan. Vui lòng tham vấn thợ dựa trên chất tóc thực tế trước khi thực hiện.”

Không được bỏ disclaimer này khỏi flow.

---

# 7. SALON SEARCH

Sau khi user chọn kiểu tóc:

```text
Tìm tiệm làm kiểu này
```

App hiển thị các salon đối tác.

Thông tin chính:

* Salon name
* Address
* Distance nếu có
* Price range
* Rating nếu có dữ liệu
* Hair styles / services
* Available time

MVP có khoảng:

```text
5–10 salons
```

để phục vụ demo và testing.

---

# 8. QUICK BOOKING

Đây là **CORE FEATURE #2**.

Flow:

```text
Select Salon
 ↓
Select Date
 ↓
Select Time
 ↓
Enter Phone
 ↓
Confirm Booking
```

Booking phải lưu lại:

* Customer
* Phone
* Salon
* Date
* Time
* Selected hairstyle
* Try-on image/result
* Booking ID
* Booking status

---

# 9. BOOKING STATUS

Booking không được xác nhận ngay lập tức.

Trạng thái mặc định:

```text
PENDING
```

Salon phải xác nhận.

Flow:

```text
Customer Booking
       ↓
     PENDING
       ↓
Salon receives request
       ↓
 ┌───────────────┐
 ↓               ↓
CONFIRMED      CANCELLED
```

Mục đích của cơ chế này là tránh **double booking**.

---

# 10. MERCHANT / SALON DASHBOARD

Salon có Dashboard riêng.

Dashboard phải đơn giản, vì chủ salon không nhất thiết có kỹ năng công nghệ cao.

## Booking list

Hiển thị:

* Customer name
* Phone
* Date
* Time
* Selected hairstyle
* Try-on image
* Booking status

Salon có 3 hành động chính:

```text
[CONFIRM]
[CANCEL]
[CONFIRM PAYMENT]
```

---

# 11. SALON BOOKING FLOW

```text
NEW BOOKING
     ↓
PENDING
     ↓
Salon checks availability
     ↓
 ┌───────────────┐
 ↓               ↓
CONFIRM        CANCEL
 ↓
CUSTOMER ARRIVES
 ↓
SERVICE
 ↓
PAYMENT
 ↓
CONFIRM PAYMENT
 ↓
COMPLETED
```

Không cần xây chat phức tạp giữa khách và salon trong MVP.

Nếu salon không thể nhận khách, hệ thống có thể gợi ý khách liên hệ salon để điều phối lại thời gian.

---

# 12. DOUBLE BOOKING PROTECTION

Đây là business rule quan trọng.

Không được cho phép:

```text
Salon
  ↓
Same staff
  ↓
Same time
  ↓
Multiple confirmed bookings
```

Booking nên có cơ chế kiểm tra availability.

MVP sử dụng logic:

```text
PENDING
 ↓
Salon notification
 ↓
Salon confirms within 5 minutes
 ↓
CONFIRMED
```

Nếu không còn chỗ:

```text
CANCELLED
```

hoặc đề xuất thời gian khác.

---

# 13. QR BOOKING VERIFICATION

Mỗi booking có:

```text
Booking ID
+
QR Code
```

Khi khách tới salon:

```text
Salon scans QR
       ↓
IN SERVICE
       ↓
Service completed
       ↓
CONFIRM PAYMENT
       ↓
COMPLETED
```

Mục đích:

* Xác nhận giao dịch thực tế.
* Hỗ trợ đối soát commission.
* Giảm gian lận doanh thu.

Nếu QR chưa cần triển khai ở phiên bản đầu tiên, hãy thiết kế architecture để có thể bổ sung sau.

---

# 14. CUSTOMER PROFILE

Customer có thể xem:

```text
Profile
 ├── Personal information
 ├── Booking history
 ├── Try-on history
 └── Loyalty points
```

Đặc biệt:

### Booking History

Mỗi booking nên giữ:

```text
Salon
Date
Time
Hairstyle
Try-on image
Status
```

Điều này chính là **Booking Profile**.

---

# 15. LOYALTY PROGRAM

Mục tiêu:

Giữ khách hàng trong hệ sinh thái StyleLock.

Ví dụ:

```text
5 completed bookings
        ↓
Free / reward booking
```

Điểm chỉ được cộng khi booking được hoàn thành thông qua StyleLock.

MVP có thể chỉ cần:

```text
Current points
Booking count
Reward progress
```

Không cần xây loyalty system quá phức tạp nếu chưa cần cho demo.

---

# 16. NOTIFICATION

Các notification quan trọng:

### Customer

* Booking created
* Booking confirmed
* Booking cancelled
* Reminder before appointment
* Booking completed

### Salon

* New booking
* Booking cancelled
* Upcoming appointment

MVP có thể mock notification nếu backend push notification chưa sẵn sàng.

---

# 17. ADMIN

Admin là tài khoản quản trị của nhóm StyleLock.

Admin quản lý:

```text
Salon
Hairstyle
Booking
User
Analytics
```

## Salon Management

Admin có thể:

* Add salon
* Edit salon
* Remove salon
* Update address
* Update price
* Update salon images

MVP seed khoảng:

```text
5–10 salons
```

---

# 18. HAIRSTYLE MANAGEMENT

Admin có thể:

* Upload hairstyle PNG
* Add hairstyle
* Edit hairstyle
* Delete hairstyle
* Categorize hairstyle

MVP:

```text
20 hairstyles
```

Image có thể lưu trên Cloudinary.

---

# 19. ANALYTICS

Admin Dashboard cần các KPI chính:

```text
Total Try-ons
Total Booking Requests
Total Confirmed Bookings
Total Completed Services
```

Có thể hiển thị:

* Cards
* Simple charts
* Booking conversion

Mục tiêu chính của Analytics là phục vụ:

```text
Final Pitch
```

và chứng minh tính khả thi của StyleLock.

---

# 20. BUSINESS MODEL

Không thu tiền từ Virtual Try-on.

```text
Virtual Try-on
      ↓
FREE
```

Nguồn doanh thu chính:

### Booking Fee

MVP:

```text
2,000–5,000 VND / successful booking
```

Sau này có thể mở rộng sang percentage-based commission.

### Salon Pro

```text
150,000 VND / month
```

Có thể bao gồm:

* Priority listing
* CRM
* Staff schedule
* Revenue statistics
* Growth reports

### Affiliate

Gợi ý sản phẩm chăm sóc tóc:

```text
Hair wax
Shampoo
Hair dye
Hair recovery products
```

MVP không cần ưu tiên xây affiliate trước core booking flow.

---

# 21. IMPORTANT RISKS THE SYSTEM MUST CONSIDER

## R-01 — Booking Conflict

Không cho phép double booking.

## R-02 — Revenue Fraud

Sử dụng Booking ID / QR để xác nhận service.

## R-03 — Disintermediation

Loyalty points chỉ được tính cho booking qua StyleLock.

## R-04 — No-show

Có reminder trước appointment.

Sau nhiều lần no-show có thể tạm khóa quyền booking.

## R-05 — Expectation Risk

Luôn hiển thị disclaimer tại Virtual Try-on.

---

# 22. UI/UX PRINCIPLES

UI cần hướng tới:

```text
Simple
Modern
Clean
Easy to use
Mobile-first
Fast interaction
```

Không làm UI quá phức tạp.

Người dùng phải hiểu app trong vài giây đầu.

Primary CTA:

```text
THỬ TÓC NGAY
```

Secondary CTA:

```text
TÌM SALON
```

Booking flow phải ít bước nhất có thể.

---

# 23. DEVELOPMENT PRIORITY

AI phải phát triển theo thứ tự:

### PRIORITY 1 — CORE MVP

```text
Home
 ↓
Upload / Camera
 ↓
Hair Selection
 ↓
Hair Try-on
 ↓
Salon Search
 ↓
Salon Detail
 ↓
Quick Booking
 ↓
Booking Confirmation
```

### PRIORITY 2

```text
Login/Register
Profile
Booking History
Salon Dashboard
Booking Status
```

### PRIORITY 3

```text
QR Verification
Notifications
Loyalty
Analytics
Admin
```

### PRIORITY 4

```text
Affiliate
Salon Pro
Advanced CRM
Advanced recommendation
```

Không được xây Priority 3–4 trước khi Priority 1 hoạt động ổn định.

---

# 24. TECHNICAL DIRECTION

Nếu xây mobile app:

```text
React Native
Expo
TypeScript
```

Có thể sử dụng:

```text
React Navigation
TanStack Query
Axios
NativeWind / StyleSheet
```

Nếu backend đã có REST API thì frontend phải giao tiếp thông qua API, không hard-code business data trong UI.

Architecture nên tách:

```text
UI
 ↓
Components
 ↓
Screens
 ↓
Hooks
 ↓
Services / API
 ↓
Backend
```

Không viết toàn bộ logic vào một component.

---

# 25. IMPORTANT DEVELOPMENT RULES

Trước khi code:

1. Đọc toàn bộ project.
2. Xác định các screen cần thiết.
3. Xác định navigation flow.
4. Xác định data model.
5. Xác định API cần sử dụng.
6. Xác định trạng thái booking.
7. Sau đó mới bắt đầu implement.

Không:

* Tự ý thay đổi business logic.
* Tự ý bỏ core feature.
* Tạo thêm feature lớn không có trong requirements.
* Làm UI quá phức tạp.
* Hard-code dữ liệu nếu API đã tồn tại.
* Viết tất cả code trong một file.
* Bỏ qua loading/error/empty state.

---

# 26. SUCCESS CRITERIA

Phiên bản MVP được xem là đạt khi user có thể hoàn thành toàn bộ flow:

```text
Open App
 ↓
Try Hair
 ↓
Upload Photo
 ↓
Select Hairstyle
 ↓
Adjust Hairstyle
 ↓
Find Salon
 ↓
Select Salon
 ↓
Select Date & Time
 ↓
Enter Phone
 ↓
Create Booking
 ↓
Salon receives Booking
 ↓
Salon confirms
 ↓
Customer sees confirmation
```

**Đây là luồng quan trọng nhất.**

Hãy luôn ưu tiên:

> **TRY → MATCH → FIND SALON → BOOK → CONFIRM**

trước mọi tính năng khác.

---

# FINAL INSTRUCTION FOR AI

Hãy coi toàn bộ nội dung trên là **Product Requirements / Business Context** của StyleLock.

Trước khi bắt đầu coding, hãy trả lời tôi bằng:

1. Bạn hiểu StyleLock là gì?
2. Core user flow là gì?
3. Các loại user/role là gì?
4. Các màn hình chính cần xây dựng?
5. Booking lifecycle hoạt động thế nào?
6. Những feature nào thuộc MVP?
7. Những feature nào nên để Phase 2?
8. Kiến trúc frontend bạn đề xuất?
9. Data/API nào frontend cần?

**CHỈ SAU KHI tôi xác nhận kế hoạch, mới bắt đầu viết code.**
