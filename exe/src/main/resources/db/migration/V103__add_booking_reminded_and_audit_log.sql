ALTER TABLE bookings ADD COLUMN reminded BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(512) NOT NULL,
    status_code INT NOT NULL,
    duration_ms BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
