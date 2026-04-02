-- =============================================================================
-- RESET MASTER ADMIN & TEST USERS & TEST PROPERTIES
-- Run this in Supabase SQL Editor to ensure clean testing environment
-- =============================================================================

-- 1. Clean up existing test accounts and properties
DELETE FROM interests WHERE tenant_id IN (SELECT id FROM tenants WHERE email = 'test@habitra.ke');
DELETE FROM units WHERE property_id IN (SELECT id FROM properties WHERE owner_id IN (SELECT id FROM landlords WHERE email = 'landlord@test.com'));
DELETE FROM unit_types WHERE property_id IN (SELECT id FROM properties WHERE owner_id IN (SELECT id FROM landlords WHERE email = 'landlord@test.com'));
DELETE FROM property_photos WHERE property_id IN (SELECT id FROM properties WHERE owner_id IN (SELECT id FROM landlords WHERE email = 'landlord@test.com'));
DELETE FROM property_amenities WHERE property_id IN (SELECT id FROM properties WHERE owner_id IN (SELECT id FROM landlords WHERE email = 'landlord@test.com'));
DELETE FROM properties WHERE owner_id IN (SELECT id FROM landlords WHERE email = 'landlord@test.com');

-- Delete any existing Master Admin variations to ensure clean state
-- We clean logs and linked docs first to avoid Foreign Key (FK) violations
DELETE FROM admin_action_logs WHERE admin_user_id IN (SELECT id FROM admin_users WHERE email IN ('master@habitra.ke', 'admin@habitra.ke', 'prince.master@housingapp.ke'));
DELETE FROM landlord_verification_documents WHERE reviewed_by_admin_id IN (SELECT id FROM admin_users WHERE email IN ('master@habitra.ke', 'admin@habitra.ke', 'prince.master@housingapp.ke'));
DELETE FROM property_documents_db WHERE reviewed_by_admin_id IN (SELECT id FROM admin_users WHERE email IN ('master@habitra.ke', 'admin@habitra.ke', 'prince.master@housingapp.ke'));

DELETE FROM app_users WHERE email IN ('master@habitra.ke', 'admin@habitra.ke', 'landlord@test.com', 'test@habitra.ke', 'prince.master@housingapp.ke');
DELETE FROM admin_users WHERE email IN ('master@habitra.ke', 'admin@habitra.ke', 'prince.master@housingapp.ke');
DELETE FROM landlords WHERE email = 'landlord@test.com';
DELETE FROM tenants WHERE email = 'test@habitra.ke';

-- 2. Create MASTER ADMIN (master@habitra.ke / demo123)
-- ID: 00000000-0000-0000-0000-000000000001
INSERT INTO admin_users (id, full_name, email, role, is_master_admin, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Master Admin', 
  'master@habitra.ke',
  'master_admin', 
  TRUE, 
  TRUE
);

INSERT INTO app_users (id, full_name, email, password_hash, admin_user_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002', 
  'Master Admin', 
  'master@habitra.ke', 
  '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', -- "demo123"
  '00000000-0000-0000-0000-000000000001', 
  TRUE
);

-- 3. Create STANDARD ADMIN (admin@habitra.ke / demo123)
-- ID: 00000000-0000-0000-0000-000000000010
INSERT INTO admin_users (id, full_name, email, role, is_master_admin, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000010', 
  'Standard Admin', 
  'admin@habitra.ke',
  'admin', 
  FALSE, 
  TRUE
);

INSERT INTO app_users (id, full_name, email, password_hash, admin_user_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000011', 
  'Standard Admin', 
  'admin@habitra.ke', 
  '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', -- "demo123"
  '00000000-0000-0000-0000-000000000010', 
  TRUE
);

-- 3. Create TEST LANDLORD
-- ID: 00000000-0000-0000-0000-000000000003
INSERT INTO landlords (id, full_name, email, phone, city, verified)
VALUES (
  '00000000-0000-0000-0000-000000000003', 
  'Test Landlord', 
  'landlord@test.com', 
  '+254722222222', 
  'Mombasa', 
  TRUE
);

INSERT INTO app_users (id, full_name, email, password_hash, landlord_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000004', 
  'Test Landlord', 
  'landlord@test.com', 
  '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', -- "demo123"
  '00000000-0000-0000-0000-000000000003', 
  TRUE
);

-- 4. Create TEST TENANT
-- ID: 00000000-0000-0000-0000-000000000005
INSERT INTO tenants (id, full_name, email, phone, city, verified)
VALUES (
  '00000000-0000-0000-0000-000000000005', 
  'Test Tenant', 
  'test@habitra.ke', 
  '+254711111111', 
  'Mombasa', 
  TRUE
);

INSERT INTO app_users (id, full_name, email, password_hash, tenant_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000006', 
  'Test Tenant', 
  'test@habitra.ke', 
  '$2b$10$Kloi4iDNq67cc/oUmmfiteM1eoLrG02N1zTUzXHPbWx/1hZNThVdS', -- "demo123"
  '00000000-0000-0000-0000-000000000005', 
  TRUE
);

-- 5. Add TEST PROPERTIES
INSERT INTO properties (id, owner_id, title, description, property_type, property_class, city, area, verification_status, listing_plan_status, total_units, country, state, primary_photo_url)
VALUES ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'Ocean View Mansion - Pending', 'Beautiful 5-bedroom mansion with direct beach access. Currently pending admin verification.', 'mansion', 'high_end_apartment', 'Mombasa', 'Nyali', 'pending', 'active', 1, 'Kenya', 'Kenya', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80');

INSERT INTO properties (id, owner_id, title, description, property_type, property_class, city, area, verification_status, listing_plan_status, total_units, country, state, primary_photo_url)
VALUES ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Industrial Warehouse A1 - Verified', 'Modern industrial warehouse with high ceilings and heavy-duty floor. Verified and ready for logistics use.', 'warehouse', 'medium_price_apartment', 'Mombasa', 'Changamwe', 'verified', 'active', 5, 'Kenya', 'Kenya', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80');

-- Add multiple images for testing setup
INSERT INTO property_photos (property_id, photo_url, is_primary)
VALUES 
('00000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', false),
('00000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', false),
('00000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80', false),
('00000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80', false),
('00000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80', false);

-- Add Floor Plans (mocking via property_documents_db if it exists, otherwise photos with a type)
-- We'll assume property_documents_db is used for verification docs, but let's check if there's a specific table for floor plans.
-- For now, let's use a "floor_plan" tag or a separate mock entry if possible.
-- If no separate table, we'll use property_photos with a flag if the schema allows, 
-- but looking at common setups, let's try to add entries to property_documents_db if it exists.
-- From the cleanup section, we see 'property_documents_db' exists.
INSERT INTO property_documents_db (property_id, document_type, document_url, verification_status)
VALUES 
('00000000-0000-0000-0000-000000000007', 'floor_plan', 'https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&w=1200&q=80', 'pending'),
('00000000-0000-0000-0000-000000000008', 'floor_plan', 'https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&w=1200&q=80', 'verified');

-- Add Unit Types for Verified Property
INSERT INTO unit_types (id, property_id, name, size_sqm, price, total_units)
VALUES (
  '00000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000008',
  'Large Bay',
  5000,
  150000,
  5
);

-- Add Units for Verified Property
INSERT INTO units (property_id, unit_type_id, unit_number, is_available)
VALUES (
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009',
  'A1-01',
  TRUE
);

SELECT email, admin_user_id, landlord_id, tenant_id, is_active FROM app_users;
SELECT title, verification_status FROM properties WHERE owner_id = '00000000-0000-0000-0000-000000000003';
