# StyleLock Geoapify Demo Flow

## Safety boundary

- Demo APIs only exist when `app.demo.enabled=true`.
- The `dev` and `test` profiles enable demo mode for testing. The `prod` profile defaults to `STYLELOCK_DEMO_ENABLED=false` and has no default demo password; production demo APIs exist only when explicitly enabled with environment-managed credentials.
- Real Geoapify salon names and addresses are used only as location data.
- Every generated salon is marked `is_demo=true` and owned by the team account `StyleLock Demo Owner`.
- A Geoapify `place_id` is unique, so selecting the same place again reuses the same salon.
- A place already linked by a real Salon Owner is never converted into a demo salon.

## Local credentials

Default development credentials (override them in `.env` before a shared demo):

- Owner email: `demo.owner@stylelock.local`
- Owner password: `DemoOwner123!`

Environment variables:

```properties
SPRING_PROFILES_ACTIVE=dev
STYLELOCK_DEMO_ENABLED=true
STYLELOCK_DEMO_OWNER_EMAIL=demo.owner@stylelock.local
STYLELOCK_DEMO_OWNER_PASSWORD=DemoOwner123!
GEOAPIFY_API_KEY=<your-key>
```

## End-to-end demo script

1. Start backend with the `dev` profile and the local/test PostgreSQL database.
2. Start the Customer mobile app and sign in with any Customer test account.
3. Search an area such as `Nguyễn Trãi, Quận 5` or `Thủ Đức`.
4. Pick any Geoapify result and press **Đặt lịch demo**.
5. Backend creates or reuses the demo salon, then guarantees three services, one demo stylist and opening hours 09:00-20:00 every day.
6. Select service, stylist, date and time, then create the booking.
7. Open Booking History to verify the persisted booking.
8. Sign into Salon Dashboard with the Demo Owner credentials, select the generated salon, open Appointments and confirm the same booking.
9. Return to the Customer Payment screen and press **Xác nhận thanh toán demo**. Payment changes from `PENDING` to `PAID`; no QR or real bank transfer is used.
10. Open Payment History to verify the persisted `DEMO/PAID` transaction.
11. Return to the Owner dashboard and complete the booking.

## Automated evidence

`DemoBookingFlowE2ETest` sends authenticated HTTP requests through the real controllers and writes to the H2 database configured for the `test` profile. It verifies idempotent salon creation, generated catalog data, customer history, owner visibility/confirmation, payment creation, simulated payment confirmation and payment history.

Run it with:

```powershell
mvn.cmd '-Dtest=DemoBookingFlowE2ETest' test
```
