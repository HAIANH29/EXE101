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

- Migration `V4` appears designed to prevent overlapping stylist bookings, but the race case remains an unverified requirement in concurrent integration tests.
- Timezone behavior uses Java `Instant` and PostgreSQL timestamp-with-time-zone in booking migration.
- AI requirements and endpoints are now fully implemented (`/api/tryon`, `/api/tryon/{requestId}/finalize`, `/api/tryon/{requestId}/result`, `/api/tryon/results`) with MediaPipe & Pillow merge.
- User delete endpoints are now fully implemented: `DELETE /api/auth/me` (self soft delete) and `DELETE /api/admin/users/{userId}` (admin soft delete).
