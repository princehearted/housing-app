-- Habitra: FINAL FIX FOR TEST LOGINS
-- This script ensures the 4 standard test accounts exist and work

-- 1. CLEAN UP existing test accounts to avoid conflicts
DELETE FROM app_users WHERE email IN ('master@habitra.ke', 'admin@habitra.ke', 'landlord@habitra.ke', 'tenant@habitra.ke');

-- 2. ENSURE ROLES EXIST
-- Master Admin
INSERT INTO admin_users (id, full_name, email, role, is_active, is_master_admin)
VALUES ('b01e0414-a293-420c-aef4-c5502d304a33', 'Super Admin', 'master@habitra.ke', 'admin', true, true)
ON CONFLICT (email) DO UPDATE SET role = 'admin', is_active = true, is_master_admin = true;

-- Staff Admin
INSERT INTO admin_users (id, full_name, email, role, is_active, is_master_admin)
VALUES ('c01e0414-a293-420c-aef4-c5502d304a33', 'Staff Admin', 'admin@habitra.ke', 'admin', true, false)
ON CONFLICT (email) DO UPDATE SET role = 'admin', is_active = true, is_master_admin = false;

-- Landlord
INSERT INTO landlords (id, full_name, email, phone, city, verified)
VALUES ('de073936-f866-4a79-9f6f-102d84e9cf30', 'Demo Landlord', 'landlord@habitra.ke', '+254700000001', 'Mombasa', true)
ON CONFLICT (email) DO UPDATE SET verified = true;

-- Tenant
INSERT INTO tenants (id, full_name, email, phone, city, verified)
VALUES ('f52742bc-08ac-4ea2-8e16-ff07b49091d7', 'Demo Tenant', 'tenant@habitra.ke', '+254711000001', 'Mombasa', true)
ON CONFLICT (email) DO UPDATE SET verified = true;

-- 3. CREATE APP_USERS CREDENTIALS (Password: demo123)
-- Master Admin
INSERT INTO app_users (full_name, email, password_hash, admin_user_id, is_active)
VALUES ('Super Admin', 'master@habitra.ke', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', 'b01e0414-a293-420c-aef4-c5502d304a33', true);

-- Staff Admin
INSERT INTO app_users (full_name, email, password_hash, admin_user_id, is_active)
VALUES ('Staff Admin', 'admin@habitra.ke', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', 'c01e0414-a293-420c-aef4-c5502d304a33', true);

-- Landlord
INSERT INTO app_users (full_name, email, phone, city, password_hash, landlord_id, is_active)
VALUES ('Demo Landlord', 'landlord@habitra.ke', '+254700000001', 'Mombasa', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', 'de073936-f866-4a79-9f6f-102d84e9cf30', true);

-- Tenant
INSERT INTO app_users (full_name, email, phone, city, password_hash, tenant_id, is_active)
VALUES ('Demo Tenant', 'tenant@habitra.ke', '+254711000001', 'Mombasa', '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', 'f52742bc-08ac-4ea2-8e16-ff07b49091d7', true);

-- VERIFY
SELECT email, admin_user_id, landlord_id, tenant_id FROM app_users WHERE email LIKE '%@habitra.ke';
