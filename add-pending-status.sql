-- Add pending as a valid member status
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE members ADD CONSTRAINT members_status_check 
  CHECK (status IN ('pending','active','overdue','inactive'));
