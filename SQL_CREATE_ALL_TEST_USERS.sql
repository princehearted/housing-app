-- Habitra Setup: All User Roles & Test Credentials
-- Run this in Supabase SQL Editor

-- 1. CLEANUP (Optional - only if you want a fresh start)
-- DELETE FROM app_users;
-- DELETE FROM admin_users;
-- DELETE FROM landlords;
-- DELETE FROM tenants;

-- 2. CREATE ADMIN USERS
-- Password for all test accounts: demo123 (bcrypt: $2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS)

-- MASTER ADMIN
INSERT INTO admin_users (id, full_name, email, admin_role, is_active)
VALUES ('b01e0414-a293-420c-aef4-c5502d304a33', 'Super Admin', 'master@habitra.ke', 'master_admin', true)
ON CONFLICT (email) DO UPDATE SET admin_role = 'master_admin';

INSERT INTO app_users (id, full_name, email, password_hash, admin_user_id, is_active)
VALUES ('b01e0414-a293-420c-aef4-c5502d304a34', 'Super Admin', 'master@habitra.ke', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', 'b01e0414-a293-420c-aef4-c5502d304a33', true)
ON CONFLICT (email) DO UPDATE SET admin_user_id = 'b01e0414-a293-420c-aef4-c5502d304a33';

-- REGULAR ADMIN
INSERT INTO admin_users (id, full_name, email, admin_role, is_active)
VALUES ('c01e0414-a293-420c-aef4-c5502d304a33', 'Staff Admin', 'admin@habitra.ke', 'admin', true)
ON CONFLICT (email) DO UPDATE SET admin_role = 'admin';

INSERT INTO app_users (id, full_name, email, password_hash, admin_user_id, is_active)
VALUES ('c01e0414-a293-420c-aef4-c5502d304a34', 'Staff Admin', 'admin@habitra.ke', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', 'c01e0414-a293-420c-aef4-c5502d304a33', true)
ON CONFLICT (email) DO UPDATE SET admin_user_id = 'c01e0414-a293-420c-aef4-c5502d304a33';

-- 3. CREATE LANDLORD
INSERT INTO landlords (id, full_name, email, phone, city, verified)
VALUES ('de073936-f866-4a79-9f6f-102d84e9cf30', 'Demo Landlord', 'landlord@habitra.ke', '+254700000001', 'Mombasa', true)
ON CONFLICT (email) DO UPDATE SET verified = true;

INSERT INTO app_users (id, full_name, email, phone, city, password_hash, landlord_id, is_active)
VALUES ('de073936-f866-4a79-9f6f-102d84e9cf31', 'Demo Landlord', 'landlord@habitra.ke', '+254700000001', 'Mombasa', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', 'de073936-f866-4a79-9f6f-102d84e9cf30', true)
ON CONFLICT (email) DO UPDATE SET landlord_id = 'de073936-f866-4a79-9f6f-102d84e9cf30';

-- 4. CREATE TENANT
INSERT INTO tenants (id, full_name, email, phone, city, verified)
VALUES ('f52742bc-08ac-4ea2-8e16-ff07b49091d7', 'Demo Tenant', 'tenant@habitra.ke', '+254711000001', 'Mombasa', true)
ON CONFLICT (email) DO UPDATE SET verified = true;

INSERT INTO app_users (id, full_name, email, phone, city, password_hash, tenant_id, is_active)
VALUES ('f52742bc-08ac-4ea2-8e16-ff07b49091d8', 'Demo Tenant', 'tenant@habitra.ke', '+254711000001', 'Mombasa', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', 'f52742bc-08ac-4ea2-8e16-ff07b49091d7', true)
ON CONFLICT (email) DO UPDATE SET tenant_id = 'f52742bc-08ac-4ea2-8e16-ff07b49091d7';

-- VERIFY
SELECT email, tenant_id, landlord_id, admin_user_id FROM app_users;
