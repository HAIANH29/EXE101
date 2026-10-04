# StyleLock Salon Dashboard

Web-app riêng cho chủ salon, chạy độc lập với mobile customer app trong `StyleLock/`.

## Chạy local

```bash
cd salon-dashboard
npm install
npm run dev
```

Mặc định FE gọi backend tại `http://localhost:8080`. Nếu backend chạy port khác, tạo `.env` từ `.env.example` và đổi `VITE_API_URL`.

## API đã tích hợp

- Auth: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- Salon profile: `GET /api/salons/my-salons`, `GET /api/salons/{salonId}`, `POST /api/salons`, `PUT /api/salons/{salonId}`, `PUT /api/salons/{salonId}/business-hours`
- Bookings: `GET /api/bookings/salon/{salonId}`, confirm, cancel, complete
- Services: list, create, update
- Staff: list stylist, create stylist

## Backend còn thiếu để dashboard salon hoàn chỉnh hơn

- Booking salon nên trả thêm tên, số điện thoại, email khách hàng thay vì chỉ có `customerId`.
- Cần API tìm/chọn user hợp lệ để thêm stylist, hiện form phải nhập `userId` thủ công.
- Cần API upload ảnh cho salon, service, stylist; hiện backend nhận `imageUrl`.
- Cần dashboard/reporting theo `salonId`; hiện tab Analytics đang tổng hợp từ booking FE tải về.
- Cần API customer CRM theo salon nếu muốn tab Customers có hồ sơ khách thật.
