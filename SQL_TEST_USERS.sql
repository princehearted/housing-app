-- Create test tenant user with correct password hash
-- Password: demo123

-- First create tenant
INSERT INTO tenants (id, full_name, email, phone, city, verified) 
SELECT '11111111-1111-1111-1111-111111111110', 'Test Tenant', 'test@habitra.ke', '+254711111111', 'Mombasa', true
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE email = 'test@habitra.ke');

-- Create app_user with proper bcrypt hash of "demo123"
INSERT INTO app_users (id, full_name, email, phone, city, password_hash, tenant_id, is_active) 
SELECT '11111111-1111-1111-1111-111111111111', 'Test Tenant', 'test@habitra.ke', '+254711111111', 'Mombasa', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', '11111111-1111-1111-1111-111111111110', true
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'test@habitra.ke');

-- Create test landlord user
INSERT INTO landlords (id, full_name, email, phone, city, verified) 
SELECT '22222222-2222-2222-2222-222222222220', 'Test Landlord', 'landlord@test.com', '+254722222222', 'Mombasa', true
WHERE NOT EXISTS (SELECT 1 FROM landlords WHERE email = 'landlord@test.com');

INSERT INTO app_users (id, full_name, email, phone, city, password_hash, landlord_id, is_active) 
SELECT '22222222-2222-2222-2222-222222222221', 'Test Landlord', 'landlord@test.com', '+254722222222', 'Mombasa', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', '22222222-2222-2222-2222-222222222220', true
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email = 'landlord@test.com');

SELECT email, is_active FROM app_users;
