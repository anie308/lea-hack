-- Migration: Add wallet_address field to events table
-- This links event creators to their wallet addresses for blockchain operations

-- Add wallet_address column to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_wallet_address ON events(wallet_address);

-- Add comment for documentation
COMMENT ON COLUMN events.wallet_address IS 'Wallet address of the event creator/organizer for blockchain operations';

