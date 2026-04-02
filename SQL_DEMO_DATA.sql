-- Insert demo data for Habitra

-- Demo Landlord
INSERT INTO landlords (id, full_name, email, phone, city, verified) 
SELECT 'de073936-f866-4a79-9f6f-102d84e9cf30', 'Demo Landlord', 'landlord@habitra.ke', '+254700000001', 'Mombasa', true
WHERE NOT EXISTS (SELECT 1 FROM landlords WHERE id = 'de073936-f866-4a79-9f6f-102d84e9cf30');

-- Demo Tenant
INSERT INTO tenants (id, full_name, email, phone, city, verified) 
SELECT 'f52742bc-08ac-4ea2-8e16-ff07b49091d7', 'Demo Tenant', 'tenant@habitra.ke', '+254711000001', 'Mombasa', true
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE id = 'f52742bc-08ac-4ea2-8e16-ff07b49091d7');

-- Demo Property
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
SELECT '094b0262-a7ec-47ff-8f73-842c381b9401', 'de073936-f866-4a79-9f6f-102d84e9cf30', 'Nyali Breeze Apartments', 'Modern apartment block near beaches and malls', 'Mombasa', 'Nyali', 'Links Road', '123 Links Road', 'apartment', 'high_end_apartment', 6, 'verified', 'green', 'active'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE id = '094b0262-a7ec-47ff-8f73-842c381b9401');

-- Demo Unit Type
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '094b0262-a7ec-47ff-8f73-842c381b9401', '1 Bedroom', 25000, 45, 2, 0, 2, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM unit_types WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Demo Units
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT '11111111-1111-1111-1111-111111111111', '094b0262-a7ec-47ff-8f73-842c381b9401', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '101', 1, true
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '11111111-1111-1111-1111-111111111111');

INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT '22222222-2222-2222-2222-222222222222', '094b0262-a7ec-47ff-8f73-842c381b9401', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '102', 1, true
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '22222222-2222-2222-2222-222222222222');

-- Demo Admin
INSERT INTO admin_users (id, full_name, email, role, is_active) 
SELECT 'b01e0414-a293-420c-aef4-c5502d304a33', 'Super Admin', 'admin@habitra.ke', 'master_admin', true
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE id = 'b01e0414-a293-420c-aef4-c5502d304a33');

-- Create property_map_status view/table entry for demo
INSERT INTO property_map_status (property_id, title, city, address, verification_status, map_color)
SELECT '094b0262-a7ec-47ff-8f73-842c381b9401', 'Nyali Breeze Apartments', 'Mombasa', '123 Links Road', 'verified', 'green'
WHERE NOT EXISTS (SELECT 1 FROM property_map_status WHERE property_id = '094b0262-a7ec-47ff-8f73-842c381b9401');

-- Create property_listing_summary entry
INSERT INTO property_listing_summary (property_id, title, country, state, city, area, neighborhood, address, property_type, property_class, verification_status, listing_plan_status, available_units, total_known_units, has_vacating_soon, map_color)
SELECT '094b0262-a7ec-47ff-8f73-842c381b9401', 'Nyali Breeze Apartments', 'Kenya', 'Mombasa County', 'Mombasa', 'Nyali', 'Links Road', '123 Links Road', 'apartment', 'high_end_apartment', 'verified', 'active', 2, 6, false, 'green'
WHERE NOT EXISTS (SELECT 1 FROM property_listing_summary WHERE property_id = '094b0262-a7ec-47ff-8f73-842c381b9401');

-- Verify
SELECT 'landlords' as tbl, count(*) FROM landlords
UNION ALL SELECT 'tenants', count(*) FROM tenants
UNION ALL SELECT 'properties', count(*) FROM properties
UNION ALL SELECT 'unit_types', count(*) FROM unit_types
UNION ALL SELECT 'units', count(*) FROM units
UNION ALL SELECT 'admin_users', count(*) FROM admin_users;
