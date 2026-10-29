ALTER TABLE salons
    ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_salons_is_demo ON salons (is_demo);
