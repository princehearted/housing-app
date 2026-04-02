-- Set Prince Master Admin as master admin
UPDATE admin_users 
SET is_master_admin = true 
WHERE id = 'b01e0414-a293-420c-aef4-c5502d304a33';

-- Verify
SELECT id, full_name, is_master_admin FROM admin_users WHERE is_master_admin = true;
