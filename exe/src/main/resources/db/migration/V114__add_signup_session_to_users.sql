-- V114: Gan phien truy cap (traffic_visits.session_id) luc dang ky vao user,
-- de bao cao kenh UTM (Outcome 3) suy ra duoc user/giao dich den tu kenh nao.
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_session_id VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_users_signup_session ON users (signup_session_id);
CREATE INDEX IF NOT EXISTS idx_traffic_visits_session ON traffic_visits (session_id);
