# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

StyleLock ("Thử là hợp – Chốt là xinh") is an O2O hair-salon app: customers virtually try on hairstyles, find salons offering that style, and book. Core MVP flow: Home → try-on (camera/upload) → pick hairstyle → salon list → pick salon/date/time → booking. `StyleLock/src/sumaryproject.md` is the master requirements doc (Vietnamese) — read it before changing business logic or user flows; don't add large features outside the MVP scope.

The repo is a multi-project monorepo (no root build). Code comments, docs and UI strings are largely Vietnamese.

| Dir | What | Stack |
|---|---|---|
| `exe/` | Backend API (the Maven parent `pom.xml` at root lists only this module) | Spring Boot 3.3.5, Java, PostgreSQL, Flyway |
| `StyleLock/` | Customer mobile/web app | Expo 57 / React Native 0.86 / React 19, TypeScript |
| `salon-dashboard/` | Separate web app for salon owners | Vite + React 19, TypeScript |
| `ai-tryon-service/` | Python FastAPI try-on service (`POST /tryon`, `GET /health`) | FastAPI, Replicate, Cloudinary |
| `docs/` | `openapi.yaml`, api-inventory, test-cases, issues-found, Postman assets | — |

`EXE101_Automation_Test.postman_collection.json` at the root is the API test collection.

## Commands

**Backend (`exe/`)**
```powershell
cd exe
docker compose up -d postgres      # Postgres on host port 5433 (not 5432)
mvn spring-boot:run                # needs .env (see exe/README.md); Swagger at http://localhost:8080/swagger-ui.html
mvn test                           # all tests
mvn test -Dtest=AuthServiceImplTest            # single test class
mvn test -Dtest=AuthServiceImplTest#methodName # single test method
```
Backend tests are few (`AuthServiceImplTest`, `SalonApprovalFlowTest`); the frontends have no tests, so the Postman collection is the main end-to-end check.
`./mvnw` wrappers also exist in `exe/`. The `dev` profile runs Flyway migrations from `db/migration` plus demo seed data from `db/dev-migration`; `prod` skips seed data. Demo accounts (password `Password@123`): `customer@`, `owner@`, `admin@stylelock.test`.

**Customer app (`StyleLock/`)**: `npm install`, then `npm start` (also `npm run android|ios|web`). No lint/test scripts. API base URL comes from `EXPO_PUBLIC_API_URL` (default `http://localhost:8080`, see `src/services/apiClient.ts`); on a physical device use the LAN IP/ngrok.

**Salon dashboard (`salon-dashboard/`)**: `npm run dev` (port 5173), `npm run build` (runs `tsc --noEmit` then Vite build — this is the typecheck). API URL via `VITE_API_URL`.

**AI service (`ai-tryon-service/`)**: `pip install -r requirements.txt`, then `uvicorn main:app`. Needs `REPLICATE_API_TOKEN` and `CLOUDINARY_*`; `config.py` loads env from system → `ai-tryon-service/.env` → `exe/.env`.

## Architecture

**Backend** is package-by-feature under `be.exe`: `auth`, `booking`, `catalog`, `salon`, `tryon`, `payment`, `review`, `notification`, `reporting`, `admin`, plus `common` (audit, config, exception, response, security, storage, util). Features generally follow `controller / domain / dto / mapper / repository / service` layering. Auth is JWT-based with Google sign-in (`GoogleTokenVerifier`) and a forgot/reset-password flow (email delivery off by default; the reset link is logged in dev). Roles are customer / salon owner / admin, matching the three demo accounts.

**Try-on**: the active path is in the backend — `tryon/client/AiTryOnClient.java` calls Replicate directly (default model `google/nano-banana-2`, configurable via `REPLICATE_HAIR_MODEL`; also supports the HairFastGAN model), polls until done, and stores results via `StorageService`. The config comment in `application.yml` states there is no longer an intermediate Python service, and nothing under `exe/src/main` references `ai-tryon-service/`, so treat it as legacy — verify with the user before investing in it.

**Payment**: bookings are paid via SePay (VietQR bank transfer). `payment/sepay/SePayQrGenerator` builds the QR; SePay calls back `SepayWebhookController`, authenticated by `SePayWebhookAuthenticator` (the webhook path is whitelisted in `SecurityConfig`). Settings live in `SePayProperties` / `application.yml`; payment state changes publish `PaymentCompletedEvent` / `PaymentRefundRequestedEvent`. The customer app shows the transfer content parsed from the QR URL on its payment screen.

**Customer app** (`StyleLock/src`): React Navigation (`navigation/AppNavigator.tsx`), screens in `screens/`, API access via `services/apiClient.ts` + `services/backendApi.ts` (with `mockData.ts` fallbacks), custom i18n in `i18n/` (add strings to `translations.ts`), and the try-on UI in `TryOnEditorScreen` + `components/HairCanvasOverlay.tsx` with `hairAssetMap.ts` mapping hairstyles to overlay assets.

**Salon dashboard** consumes the same backend (auth, salons, bookings, services, staff). Its README lists backend gaps (booking responses lack customer name/phone, no image upload API, no per-salon reporting) — check it before assuming an endpoint exists.

When changing an API, keep `docs/openapi.yaml` and the Postman collection in sync, since both frontends depend on the backend contract.
