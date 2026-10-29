ALTER TABLE salons
    ADD COLUMN listing_source VARCHAR(30) NOT NULL DEFAULT 'OWNER_SUBMITTED',
    ADD COLUMN source_provider VARCHAR(30) NOT NULL DEFAULT 'OWNER',
    ADD COLUMN source_url TEXT,
    ADD COLUMN source_place_id VARCHAR(255),
    ADD COLUMN location_verified_at TIMESTAMPTZ,
    ADD COLUMN booking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN platform_managed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN business_hours_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE salons
SET listing_source = CASE
    WHEN is_demo THEN 'GEOAPIFY_DEMO'
    ELSE 'OWNER_SUBMITTED'
END,
source_provider = CASE
    WHEN geoapify_place_id IS NOT NULL THEN 'GEOAPIFY'
    ELSE 'OWNER'
END,
source_place_id = COALESCE(source_place_id, geoapify_place_id),
booking_enabled = (
    status = 'ACTIVE'
    AND (is_demo OR (geoapify_place_id IS NOT NULL AND location_verified_at IS NOT NULL))
    AND EXISTS (
        SELECT 1 FROM services service
        WHERE service.salon_id = salons.id AND service.status = 'ACTIVE'
    )
    AND EXISTS (
        SELECT 1 FROM stylists stylist
        WHERE stylist.salon_id = salons.id AND stylist.status = 'ACTIVE'
    )
    AND 7 = (
        SELECT COUNT(*) FROM salon_business_hours hour
        WHERE hour.salon_id = salons.id
    )
    AND EXISTS (
        SELECT 1 FROM salon_business_hours hour
        WHERE hour.salon_id = salons.id
          AND hour.is_closed = FALSE
          AND hour.open_time IS NOT NULL
          AND hour.close_time IS NOT NULL
    )
),
business_hours_verified = (
    7 = (
        SELECT COUNT(*) FROM salon_business_hours hour
        WHERE hour.salon_id = salons.id
    )
    AND EXISTS (
        SELECT 1 FROM salon_business_hours hour
        WHERE hour.salon_id = salons.id
          AND hour.is_closed = FALSE
          AND hour.open_time IS NOT NULL
          AND hour.close_time IS NOT NULL
    )
);

ALTER TABLE salons
    ADD CONSTRAINT chk_salons_listing_source
        CHECK (listing_source IN ('OWNER_SUBMITTED', 'GEOAPIFY_DEMO', 'PLATFORM_CURATED'));

ALTER TABLE salons
    ADD CONSTRAINT chk_salons_source_provider
        CHECK (source_provider IN ('OWNER', 'GEOAPIFY', 'GOOGLE_MAPS'));

CREATE UNIQUE INDEX ux_salons_source_provider_place_id
    ON salons (source_provider, source_place_id)
    WHERE source_place_id IS NOT NULL;

CREATE INDEX idx_salons_booking_enabled
    ON salons (booking_enabled);
