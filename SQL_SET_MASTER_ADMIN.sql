-- =============================================================================
-- FIND YOUR ADMIN USER ID
-- Run this first to find your admin user ID
-- =============================================================================
SELECT id, full_name, email, is_master_admin 
FROM admin_users;

-- =============================================================================
-- SET MASTER ADMIN (after finding your ID)
-- Replace 'YOUR_ADMIN_USER_ID_HERE' with your actual ID from the query above
-- =============================================================================
UPDATE admin_users 
SET is_master_admin = true 
WHERE id = 'YOUR_ADMIN_USER_ID_HERE';

-- Verify it worked
SELECT id, full_name, email, is_master_admin 
FROM admin_users 
WHERE is_master_admin = true;
