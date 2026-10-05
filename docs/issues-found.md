# Issues Found / Audit Findings

> Historical audit snapshot. Current try-on and HTTP status behavior is documented in `docs/requirements.md`.

## Confirmed from code

| ID | Severity | Finding | Evidence / impact |
|---|---|---|---|
| API-001 | Resolved in current source | Hair-AI upload/try-on API was absent in the audited snapshot | Current source exposes `POST /api/tryon` and `PUT /api/tryon/{requestId}/finalize`; see `requirements.md`. |
| API-002 | Resolved in current source | No availability or reschedule API in the audited snapshot | Current source exposes API-63 availability and API-64 reschedule; see `requirements.md`. |
| API-003 | Medium | HTTP endpoint test coverage is absent | Existing Maven test is only `contextLoads`; no MockMvc/integration tests for auth, ownership, race condition, timezone, webhook, or validation. |
| API-004 | Resolved in current source | Several routes returned HTTP 200 for create | Current resource creation endpoints return HTTP 201; update/action endpoints remain HTTP 200. |
| API-005 | Resolved | Public path `/api/auth/**` included authenticated endpoints | `SecurityConfig` now permits only register/login/google/refresh/logout. `/me`, `/logout-all`, and `/change-password` require JWT as their principal-dependent implementations require. |
| API-006 | Medium | Webhook route is `permitAll` at Spring Security layer | Security relies on a manually checked Authorization API key in `SepayWebhookController`; verify secret configuration and negative tests in deployed environments. |
| API-007 | Medium | Ownership protection is not visible uniformly at controller layer | Detail/list routes require only JWT globally; safety depends on service methods. Must be covered by User A/User B tests before release. |
| API-008 | Low | Postman environment IDs are placeholders | Replace IDs with real seeded data before running business flows; collection cannot infer database IDs. |

## Not proven as defects

- Migration `V4` appears designed to prevent overlapping stylist bookings, but the audit did not run two concurrent HTTP requests against PostgreSQL. The race case remains an unverified requirement, not a confirmed bug.
- Timezone behavior uses Java `Instant` and PostgreSQL timestamp-with-time-zone in booking migration; boundary behavior still needs integration tests.
- AI requirements such as no-face, multi-face, file type/size and provider timeout cannot be assessed because no endpoint contract exists.

## Runtime evidence

`mvn -f pom.xml -pl exe -am test` passed: 1 test, 0 failures, 0 errors, using H2 test configuration.

The dev application connected to the PostgreSQL test database on port 8080. Flyway successfully validated 8 migrations; schema version is 8 and no migration was needed. No checksum/version mismatch occurred. Flyway emitted a compatibility warning because the database is PostgreSQL 18.6 while this Flyway version officially supports up to PostgreSQL 16.

The runtime-safe Newman collection executed 13 requests with 23 assertions and 0 failures after the JWT fix. Verified statuses: register 200, login 200, current user 200, missing token 401, invalid register body 400, my bookings 200, notifications 200, unread count 200, salon list 200, nonexistent salon 404. Average response time was 266 ms and maximum was 997 ms.

The first runtime pass exposed a real defect: register followed immediately by login could return 500 because refresh JWTs generated in the same second were identical, violating the unique `refresh_tokens.token_hash` constraint. `JwtService` now adds a UUID `jti` to every access and refresh token; the second runtime pass confirmed login 200.

The runtime collection created one new user with an `autotest_` email. The current API exposes no user-delete endpoint, so the collection could not safely delete it through HTTP. No existing user, salon, booking, or payment data was modified. Google OAuth, SePay, admin/owner flows, Redis, AI, and try-on remain skipped by policy or unavailable dependencies.
