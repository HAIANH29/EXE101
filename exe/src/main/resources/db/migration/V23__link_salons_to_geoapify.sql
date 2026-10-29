ALTER TABLE salons
    ADD COLUMN geoapify_place_id VARCHAR(255),
    ADD COLUMN latitude DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION;

CREATE UNIQUE INDEX ux_salons_geoapify_place_id
    ON salons (geoapify_place_id)
    WHERE geoapify_place_id IS NOT NULL;
