-- Migration: Add Origin SDK fields to support IP assets and fractional NFTs
-- Run this in your Supabase SQL Editor

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_cents BIGINT NOT NULL,
  raised_cents BIGINT DEFAULT 0,
  event_type TEXT NOT NULL,
  image_url TEXT,
  organizer_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Origin IP fields to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS origin_ip_id TEXT,
  ADD COLUMN IF NOT EXISTS origin_nft_token_id BIGINT;

-- Create index on origin_ip_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_origin_ip_id ON events(origin_ip_id);

-- Create contributions table if it doesn't exist
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL,
  contributor_email TEXT NOT NULL,
  contributor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Origin share ID field to contributions
ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS origin_share_id TEXT;

-- Create index on origin_share_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_contributions_origin_share_id ON contributions(origin_share_id);

-- Create index on event_id for faster contribution lookups
CREATE INDEX IF NOT EXISTS idx_contributions_event_id ON contributions(event_id);

-- Add updated_at trigger for events table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN events.origin_ip_id IS 'Origin Protocol IP Asset ID - references the onchain intellectual property asset';
COMMENT ON COLUMN events.origin_nft_token_id IS 'Fractional NFT token ID for this event';
COMMENT ON COLUMN contributions.origin_share_id IS 'Per-contributor IP share ID from Origin Protocol';

-- Create a view for event statistics
CREATE OR REPLACE VIEW event_stats AS
SELECT
  e.id,
  e.title,
  e.target_cents,
  e.raised_cents,
  ROUND((e.raised_cents::NUMERIC / NULLIF(e.target_cents, 0)) * 100, 2) AS percentage_funded,
  COUNT(DISTINCT c.id) AS contribution_count,
  COUNT(DISTINCT c.origin_share_id) FILTER (WHERE c.origin_share_id IS NOT NULL) AS nft_minted_count,
  MAX(c.created_at) AS last_contribution_at
FROM events e
LEFT JOIN contributions c ON e.id = c.event_id
GROUP BY e.id, e.title, e.target_cents, e.raised_cents;

COMMENT ON VIEW event_stats IS 'Aggregated statistics for events including funding progress and NFT minting status';
