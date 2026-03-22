-- Complete reset and demo data with UNIQUE unit types

-- First, delete all existing demo property data (keeping users)
DELETE FROM property_photos WHERE property_id IN (
  SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
);
DELETE FROM units WHERE property_id IN (
  SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
);
DELETE FROM unit_types WHERE property_id IN (
  SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
);
DELETE FROM property_listing_summary WHERE property_id IN (
  SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
);
DELETE FROM property_map_status WHERE property_id IN (
  SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
);
DELETE FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30';

-- ============================================
-- PROPERTY 1: Nyali Luxury 2BR Apartment
-- ============================================
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
VALUES (
  '094b0262-a7ec-47ff-8f73-842c381b9401', 
  'de073936-f866-4a79-9f6f-102d84e9cf30', 
  'Nyali Luxury 2BR Apartment', 
  'Spacious modern 2 bedroom apartment with ocean view, modern kitchen, backup generator, and 24/7 security. Walking distance to malls and beaches. Includes CCTV, access control, and clean drinking water.',
  'Mombasa', 
  'Nyali', 
  'Links Road', 
  '123 Links Road, Nyali', 
  'apartment', 
  'high_end_apartment', 
  4, 
  'verified', 
  'green', 
  'active'
);

-- UNIQUE Unit Type 1: 2 Bedroom Deluxe (85 sqm)
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status, unit_category)
VALUES (
  'ut-2br-deluxe-001',
  '094b0262-a7ec-47ff-8f73-842c381b9401',
  '2 Bedroom Deluxe',
  45000,
  85,
  2,
  0,
  2,
  'verified',
  'two_bedroom'
);

-- UNIQUE Unit Type 2: 2 Bedroom Standard (70 sqm)
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status, unit_category)
VALUES (
  'ut-2br-std-002',
  '094b0262-a7ec-47ff-8f73-842c381b9401',
  '2 Bedroom Standard',
  35000,
  70,
  2,
  0,
  2,
  'verified',
  'two_bedroom'
);

-- Units for 2BR Deluxe
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) VALUES
('u-2brd-101', '094b0262-a7ec-47ff-8f73-842c381b9401', 'ut-2br-deluxe-001', '101', 1, true),
('u-2brd-102', '094b0262-a7ec-47ff-8f73-842c381b9401', 'ut-2br-deluxe-001', '102', 1, true);

-- Units for 2BR Standard
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) VALUES
('u-2brs-201', '094b0262-a7ec-47ff-8f73-842c381b9401', 'ut-2br-std-002', '201', 2, true),
('u-2brs-202', '094b0262-a7ec-47ff-8f73-842c381b9401', 'ut-2br-std-002', '202', 2, true);

-- Property Photos
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption) VALUES
('ph-001-1', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', true, 'Spacious Living Room with Modern Furnishings'),
('ph-001-2', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', false, 'Master Bedroom with En-suite'),
('ph-001-3', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', false, 'Second Bedroom'),
('ph-001-4', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', false, 'Modern Open Kitchen'),
('ph-001-5', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop', false, 'Luxury Bathroom'),
('ph-001-6', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', false, 'Balcony with Ocean View'),
('ph-001-7', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop', false, 'Building Exterior & Parking');

-- Unit Photos (for each unit type)
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption, unit_type_id) VALUES
('uph-001-1', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop', true, '2BR Deluxe - Living Room', 'ut-2br-deluxe-001'),
('uph-001-2', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop', false, '2BR Deluxe - Bedroom', 'ut-2br-deluxe-001'),
('uph-001-3', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop', true, '2BR Standard - Living Room', 'ut-2br-std-002'),
('uph-001-4', '094b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop', false, '2BR Standard - Kitchen', 'ut-2br-std-002');

-- ============================================
-- PROPERTY 2: Mombasa Budget Bedsitters
-- ============================================
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
VALUES (
  '204b0262-a7ec-47ff-8f73-842c381b9402', 
  'de073936-f866-4a79-9f6f-102d84e9cf30', 
  'Mombasa Budget Bedsitters', 
  'Affordable bedsitters with basic amenities. Perfect for students and young professionals. Includes water storage and secure parking.',
  'Mombasa', 
  'Kizingo', 
  'Nyerere Avenue', 
  '45 Nyerere Avenue, Kizingo', 
  'apartment', 
  'bedsitter', 
  6, 
  'verified', 
  'green', 
  'active'
);

-- UNIQUE Unit Type: Standard Bedsitter (25 sqm) - ONLY ONE TYPE
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status, unit_category)
VALUES (
  'ut-bed-001',
  '204b0262-a7ec-47ff-8f73-842c381b9402',
  'Standard Bedsitter',
  12000,
  25,
  6,
  0,
  6,
  'verified',
  'bedsitter'
);

-- 6 Bedsitter Units
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) VALUES
('u-bed-001', '204b0262-a7ec-47ff-8f73-842c381b9402', 'ut-bed-001', '001', 0, true),
('u-bed-002', '204b0262-a7ec-47ff-8f73-842c381b9402', 'ut-bed-001', '002', 0, true),
('u-bed-003', '204b0262-a7ec-47ff-8f73-842c381b9402', 'ut-bed-001', '003', 0, true),
('u-bed-004', '204b0262-a7ec-47ff-8f73-842c381b9402', 'ut-bed-001', '004', 1, true),
('u-bed-005', '204b0262-a7ec-47ff-8f73-842c381b9402', 'ut-bed-001', '005', 1, true),
('u-bed-006', '204b0262-a7ec-47ff-8f73-842c381b9402', 'ut-bed-001', '006', 1, true);

-- Property Photos
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption) VALUES
('ph-002-1', '204b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop', true, 'Bedsitter Interior'),
('ph-002-2', '204b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&h=600&fit=crop', false, 'Kitchen Area'),
('ph-002-3', '204b0262-a7ec-47ff-8f73-842c381b9401', 'https://images.unsplash.com/photo-1584622050152-b11f59f8d939?w=800&h=600&fit=crop', false, 'Bathroom');

-- ============================================
-- PROPERTY 3: Garden View 1BR
-- ============================================
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
VALUES (
  '304b0262-a7ec-47ff-8f73-842c381b9403', 
  'de073936-f866-4a79-9f6f-102d84e9cf30', 
  'Garden View 1BR', 
  'Cozy 1 bedroom apartment with beautiful garden view. Perfect for couples. Features spacious bedroom, modern bathroom, and private balcony.',
  'Mombasa', 
  'Bamburi', 
  'Mtopanga', 
  '78 Mtopanga Road, Bamburi', 
  'apartment', 
  'medium_price_apartment', 
  4, 
  'verified', 
  'green', 
  'active'
);

-- UNIQUE Unit Type: 1 Bedroom Apartment
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status, unit_category)
VALUES (
  'ut-1br-001',
  '304b0262-a7ec-47ff-8f73-842c381b9403',
  '1 Bedroom Apartment',
  25000,
  45,
  4,
  0,
  4,
  'verified',
  'one_bedroom'
);

-- 4 Units
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) VALUES
('u-1br-1', '304b0262-a7ec-47ff-8f73-842c381b9403', 'ut-1br-001', '1', 1, true),
('u-1br-2', '304b0262-a7ec-47ff-8f73-842c381b9403', 'ut-1br-001', '2', 1, true),
('u-1br-3', '304b0262-a7ec-47ff-8f73-842c381b9403', 'ut-1br-001', '3', 2, true),
('u-1br-4', '304b0262-a7ec-47ff-8f73-842c381b9403', 'ut-1br-001', '4', 2, true);

-- Property Photos
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption) VALUES
('ph-003-1', '304b0262-a7ec-47ff-8f73-842c381b9403', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', true, 'Living Room'),
('ph-003-2', '304b0262-a7ec-47ff-8f73-842c381b9403', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', false, 'Bedroom'),
('ph-003-3', '304b0262-a7ec-47ff-8f73-842c381b9403', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', false, 'Kitchen');

-- ============================================
-- PROPERTY 4: Mombasa Student Hostel
-- ============================================
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
VALUES (
  '404b0262-a7ec-47ff-8f73-842c381b9404', 
  'de073936-f866-4a79-9f6f-102d84e9cf30', 
  'Mombasa Student Hostel', 
  'Clean and secure hostel for students. Shared facilities including kitchen and bathrooms. 24/7 security and cleaning services.',
  'Mombasa', 
  'Mombasa CBD', 
  'Kenyatta Avenue', 
  '100 Kenyatta Avenue', 
  'hostel', 
  'hostel', 
  20, 
  'verified', 
  'green', 
  'active'
);

-- UNIQUE Unit Type: Hostel Bed Slot
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status, unit_category)
VALUES (
  'ut-hostel-001',
  '404b0262-a7ec-47ff-8f73-842c381b9404',
  'Hostel Bed Slot',
  5500,
  20,
  20,
  0,
  20,
  'verified',
  'hostel'
);

-- 20 Bed slots
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) 
SELECT generate_series('u-hostel-001'::uuid, 'u-hostel-020'::uuid, '1'::interval)::text, 
       '404b0262-a7ec-47ff-8f73-842c381b9404',
       'ut-hostel-001',
       generate_series(1, 20),
       (generate_series(1, 20) - 1) / 10 + 1,
       true;

-- Property Photos
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption) VALUES
('ph-004-1', '404b0262-a7ec-47ff-8f73-842c381b9404', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop', true, 'Dormitory Beds'),
('ph-004-2', '404b0262-a7ec-47ff-8f73-842c381b9404', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', false, 'Shared Kitchen'),
('ph-004-3', '404b0262-a7ec-47ff-8f73-842c381b9404', 'https://images.unsplash.com/photo-1584622050152-b11f59f8d939?w=800&h=600&fit=crop', false, 'Shared Bathroom');

-- ============================================
-- PROPERTY 5: CBD Retail Shop
-- ============================================
INSERT INTO properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color, listing_plan_status)
VALUES (
  '504b0262-a7ec-47ff-8f73-842c381b9405', 
  'de073936-f866-4a79-9f6f-102d84e9cf30', 
  'CBD Premium Retail Shop', 
  'Prime retail space in Mombasa CBD. High foot traffic area perfect for retail, salon, or office. Includes display windows and storage room.',
  'Mombasa', 
  'Mombasa CBD', 
  'Moi Avenue', 
  '25 Moi Avenue', 
  'shop', 
  'retail', 
  2, 
  'verified', 
  'green', 
  'active'
);

-- UNIQUE Unit Type: Retail Shop Space
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status, unit_category)
VALUES (
  'ut-shop-001',
  '504b0262-a7ec-47ff-8f73-842c381b9405',
  'Retail Shop Space',
  45000,
  50,
  2,
  0,
  2,
  'verified',
  'shop_unit'
);

-- 2 Shop Units
INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) VALUES
('u-shop-1', '504b0262-a7ec-47ff-8f73-842c381b9405', 'ut-shop-001', 'Shop 1', 0, true),
('u-shop-2', '504b0262-a7ec-47ff-8f73-842c381b9405', 'ut-shop-001', 'Shop 2', 0, true);

-- Property Photos
INSERT INTO property_photos (id, property_id, photo_url, is_primary, caption) VALUES
('ph-005-1', '504b0262-a7ec-47ff-8f73-842c381b9405', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop', true, 'Retail Interior'),
('ph-005-2', '504b0262-a7ec-47ff-8f73-842c381b9405', 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=600&fit=crop', false, 'Display Area');

-- ============================================
-- Update summary tables
-- ============================================
INSERT INTO property_listing_summary (property_id, title, country, state, city, area, neighborhood, address, property_type, property_class, verification_status, listing_plan_status, available_units, total_known_units, has_vacating_soon, map_color)
SELECT p.id, p.title, 'Kenya', p.state, p.city, p.area, p.neighborhood, p.address, p.property_type, p.property_class, p.verification_status, p.listing_plan_status, p.total_units, p.total_units, false, p.map_color
FROM properties p WHERE p.owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
ON CONFLICT (property_id) DO NOTHING;

INSERT INTO property_map_status (property_id, title, city, address, verification_status, map_color)
SELECT p.id, p.title, p.city, p.address, p.verification_status, p.map_color
FROM properties p WHERE p.owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
ON CONFLICT (property_id) DO NOTHING;

-- Verify data
SELECT 
  p.title as property,
  ut.name as unit_type,
  ut.size_sqm as sqm,
  ut.price as price,
  count(u.id) as units
FROM properties p
JOIN unit_types ut ON ut.property_id = p.id
JOIN units u ON u.unit_type_id = ut.id
WHERE p.owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
GROUP BY p.title, ut.name, ut.size_sqm, ut.price
ORDER BY p.title, ut.price DESC;
