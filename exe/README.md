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
