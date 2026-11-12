-- V111: Ghi nhan nguon truy cap (UTM - Urchin Tracking Module) cho trang admin
CREATE TABLE IF NOT EXISTS traffic_visits (
    id            BIGSERIAL PRIMARY KEY,
    session_id    VARCHAR(64)  NOT NULL,
    utm_source    VARCHAR(100) NOT NULL DEFAULT 'direct',
    utm_medium    VARCHAR(100) NOT NULL DEFAULT 'none',
    utm_campaign  VARCHAR(150),
    utm_term      VARCHAR(150),
    utm_content   VARCHAR(150),
    landing_path  VARCHAR(255),
    referrer      VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_traffic_visits_created_at ON traffic_visits (created_at);
CREATE INDEX IF NOT EXISTS idx_traffic_visits_source ON traffic_visits (utm_source, utm_medium);
