-- Check existing admin_users columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_users';
