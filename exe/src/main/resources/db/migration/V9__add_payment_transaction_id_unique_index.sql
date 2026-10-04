CREATE UNIQUE INDEX uq_payments_transaction_id
    ON payments (transaction_id)
    WHERE transaction_id IS NOT NULL;
