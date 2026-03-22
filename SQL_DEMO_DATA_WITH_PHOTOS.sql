-- Demo data with unique unit types and photos for testing

-- Clear existing demo data first (optional - comment out if you want to keep existing)
-- DELETE FROM property_photos WHERE property_id IN (SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30');
-- DELETE FROM units WHERE property_id IN (SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30');
-- DELETE FROM unit_types WHERE property_id IN (SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30');
-- DELETE FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30';

-- Demo Property: 2 Bedroom Apartment (First Property with Photos)
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
SELECT '094b0262-a7ec-47ff-8f73-842c381b9401', 'de073936-f866-4a79-9f6f-102d84e9cf30', 'Nyali Luxury 2BR Apartment', 'Spacious modern 2 bedroom apartment with ocean view, modern kitchen, backup generator, and 24/7 security. Walking distance to malls and beaches.', 'Mombasa', 'Nyali', 'Links Road', '123 Links Road, Nyali', 'apartment', 'high_end_apartment', 4, 'verified', 'green', 'active'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE id = '094b0262-a7ec-47ff-8f73-842c381b9401');

-- Unique Unit Types for 2BR Property (no duplicates)
-- Unit Type 1: 2 Bedroom Deluxe
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '094b0262-a7ec-47ff-8f73-842c381b9401', '2 Bedroom Deluxe', 45000, 85, 2, 0, 2, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM unit_types WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Unit Type 2: 2 Bedroom Standard
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status)
SELECT 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '094b0262-a7ec-47ff-8f73-842c381b9401', '2 Bedroom Standard', 35000, 70, 2, 0, 2, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM unit_types WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901');

-- Units for 2BR Deluxe
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT '11111111-1111-1111-1111-111111111111', '094b0262-a7ec-47ff-8f73-842c381b9401', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '101', 1, true
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '11111111-1111-1111-1111-111111111111');

INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT '11111111-1111-1111-1111-111111111112', '094b0262-a7ec-47ff-8f73-842c381b9401', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '102', 1, true
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '11111111-1111-1111-1111-111111111112');

-- Units for 2BR Standard
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT '11111111-1111-1111-1111-111111111113', '094b0262-a7ec-47ff-8f73-842c381b9401', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '201', 2, true
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '11111111-1111-1111-1111-111111111113');

INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT '11111111-1111-1111-1111-111111111114', '094b0262-a7ec-47ff-8f73-842c381b9401', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '202', 2, true
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '11111111-1111-1111-1111-111111111114');

-- Property Photos for 2BR (Main property for testing)
-- Photo 1: Living Room
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption)
SELECT 'p1a2b3c4d-e5f6-7890-abcd-ef1234567890', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', true, 'Spacious Living Room'
WHERE NOT EXISTS (SELECT 1 FROM property_photos WHERE id = 'p1a2b3c4d-e5f6-7890-abcd-ef1234567890');

-- Photo 2: Bedroom
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption)
SELECT 'p2b3c4d5-e6f7-8901-bcde-f12345678901', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', false, 'Master Bedroom'
WHERE NOT EXISTS (SELECT 1 FROM property_photos WHERE id = 'p2b3c4d5-e6f7-8901-bcde-f12345678901');

-- Photo 3: Kitchen
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption)
SELECT 'p3c4d5e6-f7a8-9012-cdef-123456789012', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', false, 'Modern Kitchen'
WHERE NOT EXISTS (SELECT 1 FROM property_photos WHERE id = 'p3c4d5e6-f7a8-9012-cdef-123456789012');

-- Photo 4: Bathroom
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption)
SELECT 'p4d5e6f7-a8b9-0123-defg-234567890123', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop', false, 'Modern Bathroom'
WHERE NOT EXISTS (SELECT 1 FROM property_photos WHERE id = 'p4d5e6f7-a8b9-0123-defg-234567890123');

-- Photo 5: Balcony View
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption)
SELECT 'p5e6f7a8-b9c0-1234-efgh-345678901234', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', false, 'Balcony with Ocean View'
WHERE NOT EXISTS (SELECT 1 FROM property_photos WHERE id = 'p5e6f7a8-b9c0-1234-efgh-345678901234');

-- Photo 6: Building Exterior
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption)
SELECT 'p6f7a8b9-c0d1-2345-fghi-456789012345', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop', false, 'Building Exterior'
WHERE NOT EXISTS (SELECT 1 FROM property_photos WHERE id = 'p6f7a8b9-c0d1-2345-fghi-456789012345');

-- Floorplan: 2BR Deluxe
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption)
SELECT 'fp1a2b3c4-d5e6-7890-abcd-ef1234567890', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop', false, '2BR Deluxe Floorplan'
WHERE NOT EXISTS (SELECT 1 FROM property_photos WHERE id = 'fp1a2b3c4-d5e6-7890-abcd-ef1234567890');

-- Floorplan: 2BR Standard
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption)
SELECT 'fp2b3c4d5-e6f7-8901-bcde-f12345678901', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', false, '2BR Standard Floorplan'
WHERE NOT EXISTS (SELECT 1 FROM property_photos WHERE id = 'fp2b3c4d5-e6f7-8901-bcde-f12345678901');

-- Second Property: Bedsitter
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
SELECT '204b0262-a7ec-47ff-8f73-842c381b9402', 'de073936-f866-4a79-9f6f-102d84e9cf30', 'Mombasa Budget Bedsitters', 'Affordable bedsitters with basic amenities, perfect for students and young professionals.', 'Mombasa', 'Kizingo', 'Nyerere Avenue', '45 Nyerere Avenue, Kizingo', 'apartment', 'bedsitter', 6, 'verified', 'green', 'active'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE id = '204b0262-a7ec-47ff-8f73-842c381b9402');

-- Unique Unit Type for Bedsitter
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status)
SELECT 'c3d4e5f6-a7b8-9012-cdef-234567890123', '204b0262-a7ec-47ff-8f73-842c381b9402', 'Standard Bedsitter', 12000, 25, 6, 0, 6, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM unit_types WHERE id = 'c3d4e5f6-a7b8-9012-cdef-234567890123');

-- Units for Bedsitter
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT '22222222-2222-2222-2222-222222222201', '204b0262-a7ec-47ff-8f73-842c381b9402', 'c3d4e5f6-a7b8-9012-cdef-234567890123', '001', 0, true
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '22222222-2222-2222-2222-222222222201');

INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT '22222222-2222-2222-2222-222222222202', '204b0262-a7ec-47ff-8f73-842c381b9402', 'c3d4e5f6-a7b8-9012-cdef-234567890123', '002', 0, true
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '22222222-2222-2222-2222-222222222202');

-- Third Property: 1 Bedroom
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
SELECT '304b0262-a7ec-47ff-8f73-842c381b9403', 'de073936-f866-4a79-9f6f-102d84e9cf30', 'Garden View 1BR', 'Cozy 1 bedroom apartment with garden view, perfect for couples.', 'Mombasa', 'Bamburi', 'Mtopanga', '78 Mtodom, Bamburi', 'apartment', 'medium_price_apartment', 4, 'verified', 'green', 'active'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE id = '304b0262-a7ec-47ff-8f73-842c381b9403');

-- Unique Unit Type for 1BR
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status)
SELECT 'd4e5f6a7-b8c9-0123-defg-345678901234', '304b0262-a7ec-47ff-8f73-842c381b9403', '1 Bedroom Apartment', 25000, 45, 4, 0, 4, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM unit_types WHERE id = 'd4e5f6a7-b8c9-0123-defg-345678901234');

-- Units for 1BR
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT '33333333-3333-3333-3333-333333333301', '304b0262-a7ec-47ff-8f73-842c381b9403', 'd4e5f6a7-b8c9-0123-defg-345678901234', '1', 1, true
WHERE NOT EXISTS (SELECT 1 FROM units WHERE id = '33333333-3333-3333-3333-333333333301');

-- Fourth Property: Hostel
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
SELECT '404b0262-a7ec-47ff-8f73-842c381b9404', 'de073936-f866-4a79-9f6f-102d84e9cf30', 'Mombasa Student Hostel', 'Clean and secure hostel for students with shared facilities.', 'Mombasa', 'Mombasa CBD', 'Kenyatta Avenue', '100 Kenyatta Avenue', 'hostel', 'hostel', 20, 'verified', 'green', 'active'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE id = '404b0262-a7ec-47ff-8f73-842c381b9404');

-- Unique Unit Type for Hostel (Bed slot)
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status)
SELECT 'e5f6a7b8-c9d0-1234-efgh-456789012345', '404b0262-a7ec-47ff-8f73-842c381b9404', 'Hostel Bed Slot', 5500, 20, 20, 0, 20, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM unit_types WHERE id = 'e5f6a7b8-c9d0-1234-efgh-456789012345');

-- Fifth Property: Shop Unit
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
SELECT '504b0262-a7ec-47ff-8f73-842c381b9405', 'de073936-f866-4a79-9f6f-102d84e9cf30', 'CBD Retail Shop', 'Prime retail space in Mombasa CBD, high foot traffic area.', 'Mombasa', 'Mombasa CBD', 'Moi Avenue', '25 Moi Avenue', 'shop', 'retail', 2, 'verified', 'green', 'active'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE id = '504b0262-a7ec-47ff-8f73-842c381b9405');

-- Unique Unit Type for Shop
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status)
SELECT 'f6a7b8c9-d0e1-2345-fghi-567890123456', '504b0262-a7ec-47ff-8f73-842c381b9405', 'Retail Shop Space', 45000, 50, 2, 0, 2, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM unit_types WHERE id = 'f6a7b8c9-d0e1-2345-fghi-567890123456');

-- Update property listing summaries
INSERT INTO property_listing_summary (property_id, title, country, state, city, area, neighborhood, address, property_type, property_class, verification_status, listing_plan_status, available_units, total_known_units, has_vacating_soon, map_color)
SELECT '094b0262-a7ec-47ff-8f73-842c381b9401', 'Nyali Luxury 2BR Apartment', 'Kenya', 'Mombasa County', 'Mombasa', 'Nyali', 'Links Road', '123 Links Road, Nyali', 'apartment', 'high_end_apartment', 'verified', 'active', 4, 4, false, 'green'
WHERE NOT EXISTS (SELECT 1 FROM property_listing_summary WHERE property_id = '094b0262-a7ec-47ff-8f73-842c381b9401');

INSERT INTO property_listing_summary (property_id, title, country, state, city, area, neighborhood, address, property_type, property_class, verification_status, listing_plan_status, available_units, total_known_units, has_vacating_soon, map_color)
SELECT '204b0262-a7ec-47ff-8f73-842c381b9402', 'Mombasa Budget Bedsitters', 'Kenya', 'Mombasa County', 'Mombasa', 'Kizingo', 'Nyerere Avenue', '45 Nyerere Avenue, Kizingo', 'apartment', 'bedsitter', 'verified', 'active', 6, 6, false, 'green'
WHERE NOT EXISTS (SELECT 1 FROM property_listing_summary WHERE property_id = '204b0262-a7ec-47ff-8f73-842c381b9402');

INSERT INTO property_listing_summary (property_id, title, country, state, city, area, neighborhood, address, property_type, property_class, verification_status, listing_plan_status, available_units, total_known_units, has_vacating_soon, map_color)
SELECT '304b0262-a7ec-47ff-8f73-842c381b9403', 'Garden View 1BR', 'Kenya', 'Mombasa County', 'Mombasa', 'Bamburi', 'Mtodom', '78 Mtodom, Bamburi', 'apartment', 'medium_price_apartment', 'verified', 'active', 4, 4, false, 'green'
WHERE NOT EXISTS (SELECT 1 FROM property_listing_summary WHERE property_id = '304b0262-a7ec-47ff-8f73-842c381b9403');

-- Verify the data
SELECT 'properties' as tbl, count(*) as cnt FROM properties WHERE verification_status = 'verified'
UNION ALL SELECT 'unit_types', count(*) FROM unit_types WHERE verification_status = 'verified'
UNION ALL SELECT 'units', count(*) FROM units WHERE is_available = true
UNION ALL SELECT 'property_photos', count(*) FROM property_photos;
