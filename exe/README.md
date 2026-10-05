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
To send real Gmail SMTP email, set these values in `.env`:

```properties
PASSWORD_RESET_MAIL_ENABLED=true
APP_FRONTEND_RESET_URL=http://localhost:8082/reset-password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_FROM=your-gmail@gmail.com
```

Use a Gmail App Password, not the normal Gmail account password.
