-- Habitra: FIX SCHEMA INCONSISTENCY
-- Renaming 'role' to 'admin_role' if it exists in admin_users

DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='role') THEN
    ALTER TABLE admin_users RENAME COLUMN role TO admin_role;
  END IF;
END $$;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_users' AND column_name IN ('role', 'admin_role');
