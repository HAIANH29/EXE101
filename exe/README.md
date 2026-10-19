# StyleLock Backend

## Local development

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Start PostgreSQL:

```powershell
docker compose up -d postgres
```

If you use an existing PostgreSQL server instead of Docker, set these variables in `.env`:

```properties
DB_URL=jdbc:postgresql://localhost:5432/stylelock
DB_USERNAME=stylelock
DB_PASSWORD=stylelock
```

The Docker PostgreSQL container is exposed on host port `5433` by default to avoid
conflicts with a PostgreSQL service already installed on Windows:

```properties
DB_URL=jdbc:postgresql://localhost:5433/stylelock
DB_USERNAME=stylelock
DB_PASSWORD=stylelock
```

3. Run the backend:

```powershell
mvn spring-boot:run
```

4. Open Swagger:

```text
http://localhost:8080/swagger-ui.html
```

The `dev` profile loads schema migrations from `db/migration` and demo seed data from
`db/dev-migration`. The `prod` profile does not load demo seed data.

## Demo accounts

All demo accounts use password `Password@123`.

```text
customer@stylelock.test
owner@stylelock.test
admin@stylelock.test
```

## Password reset email

The backend supports the forgot-password flow used by the frontend:

```text
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

For local development, reset email delivery is disabled by default and the backend logs the reset link.
To send real Brevo SMTP email, create an SMTP key in Brevo Dashboard > SMTP & API, verify
the sender address, then set these values in `.env`:

```properties
MAIL_ENABLED=true
APP_FRONTEND_RESET_URL=http://localhost:8081/reset-password
MAIL_FROM=your-email@example.com

# Brevo SMTP (cổng 587)
MAIL_PROVIDER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your-brevo-smtp-login
MAIL_PASSWORD=your-brevo-smtp-key
```

`MAIL_USERNAME` là SMTP login do Brevo cấp, còn `MAIL_PASSWORD` là SMTP key,
không phải API key. Nếu hosting chặn cổng SMTP, có thể dùng `MAIL_PROVIDER=brevo`
và `BREVO_API_KEY` để chuyển sang Brevo HTTP API.
