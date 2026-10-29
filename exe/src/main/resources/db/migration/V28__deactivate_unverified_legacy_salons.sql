-- Legacy rows created before server-side Geoapify verification can contain
-- mock, seed or geocoding-only data. Keep them for booking/payment history,
-- but do not expose them as active salons until an owner links a verified
-- Vietnamese hairdresser place and sends the salon through approval again.
UPDATE salons
SET status = 'INACTIVE',
    booking_enabled = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE listing_source = 'OWNER_SUBMITTED'
  AND (
      geoapify_place_id IS NULL
      OR location_verified_at IS NULL
      OR latitude IS NULL
      OR longitude IS NULL
  );
