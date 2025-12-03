-- Migration: Add table to track event creation payments
-- Tracks Basecamp token payments for event creation

CREATE TABLE IF NOT EXISTS event_creation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_tokens NUMERIC(18, 8) NOT NULL,
  transaction_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_creation_payments_event_id ON event_creation_payments(event_id);

-- Create index on wallet_address for user payment history
CREATE INDEX IF NOT EXISTS idx_event_creation_payments_wallet ON event_creation_payments(wallet_address);

-- Create index on transaction_hash for verification
CREATE INDEX IF NOT EXISTS idx_event_creation_payments_tx_hash ON event_creation_payments(transaction_hash);

-- Add comment for documentation
COMMENT ON TABLE event_creation_payments IS 'Tracks Basecamp token payments made by event creators';
COMMENT ON COLUMN event_creation_payments.amount_tokens IS 'Amount of Basecamp tokens charged (typically 2 tokens)';
COMMENT ON COLUMN event_creation_payments.transaction_hash IS 'Blockchain transaction hash for the token transfer';

