-- Chống race condition & spam: mỗi owner chỉ được có tối đa 1 salon ở trạng thái PENDING_APPROVAL
CREATE UNIQUE INDEX IF NOT EXISTS uq_salons_owner_pending
    ON salons (owner_id)
    WHERE (status = 'PENDING_APPROVAL');
