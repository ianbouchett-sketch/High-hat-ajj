-- Add walk_in as a valid member status for gym visitors who sign the waiver
-- but haven't yet created an account or paid

-- First check what the current constraint looks like
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'members_status_check';

-- Drop and recreate with walk_in included
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;

ALTER TABLE members ADD CONSTRAINT members_status_check
  CHECK (status IN ('pending', 'active', 'overdue', 'inactive', 'walk_in'));
