-- Migration: Add privacy field to events table
-- Allows events to be marked as private (only accessible via direct link)

-- Add is_private column to events table (defaults to false for public)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Create index on is_private for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_is_private ON events(is_private);

-- Add comment for documentation
COMMENT ON COLUMN events.is_private IS 'If true, event is private and only accessible via direct link. Not shown in public listings.';

