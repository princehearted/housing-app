-- Delete ALL unit_types and units, then insert fresh with unique names
-- This will clear everything and start fresh

-- Step 1: Delete all units first
DELETE FROM units WHERE property_id IN (
  SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
);

-- Step 2: Delete all unit_types
DELETE FROM unit_types WHERE property_id IN (
  SELECT id FROM properties WHERE owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
);

-- Step 3: Insert fresh unique unit types for each property

-- Nyali Breeze Apartments - 3 unique unit types
INSERT INTO unit_types (property_id, name, price, size_sqm, total_units, available_units, verification_status)
SELECT id, 'Bedsitter Type A', 12000, 25, 4, 4, 'verified' FROM properties WHERE title = 'Nyali Breeze Apartments';

INSERT INTO unit_types (property_id, name, price, size_sqm, total_units, available_units, verification_status)
SELECT id, 'Bedsitter Type B', 15000, 30, 2, 2, 'verified' FROM properties WHERE title = 'Nyali Breeze Apartments';

INSERT INTO unit_types (property_id, name, price, size_sqm, total_units, available_units, verification_status)
SELECT id, '1 Bedroom', 25000, 45, 3, 3, 'verified' FROM properties WHERE title = 'Nyali Breeze Apartments';

-- Bamburi Family Homes - 3 unique unit types
INSERT INTO unit_types (property_id, name, price, size_sqm, total_units, available_units, verification_status)
SELECT id, 'Bedsitter', 10000, 25, 6, 6, 'verified' FROM properties WHERE title = 'Bamburi Family Homes';

INSERT INTO unit_types (property_id, name, price, size_sqm, total_units, available_units, verification_status)
SELECT id, '1 Bedroom', 22000, 45, 4, 4, 'verified' FROM properties WHERE title = 'Bamburi Family Homes';

INSERT INTO unit_types (property_id, name, price, size_sqm, total_units, available_units, verification_status)
SELECT id, '2 Bedroom', 40000, 75, 2, 2, 'verified' FROM properties WHERE title = 'Bamburi Family Homes';

-- Likoni Heights Studios - 2 unique unit types
INSERT INTO unit_types (property_id, name, price, size_sqm, total_units, available_units, verification_status)
SELECT id, 'Studio', 15000, 30, 8, 8, 'verified' FROM properties WHERE title = 'Likoni Heights Studios';

INSERT INTO unit_types (property_id, name, price, size_sqm, total_units, available_units, verification_status)
SELECT id, '1 Bedroom', 25000, 50, 4, 4, 'verified' FROM properties WHERE title = 'Likoni Heights Studios';

-- Step 4: Insert units for each unit type
INSERT INTO units (property_id, unit_type_id, unit_number, floor, is_available)
SELECT property_id, id, gs, gs/2, true
FROM unit_types
CROSS JOIN generate_series(1, total_units) as gs;

-- Verify
SELECT ut.name, ut.price, ut.size_sqm, p.title as property, count(u.id) as units
FROM unit_types ut
JOIN properties p ON p.id = ut.property_id
LEFT JOIN units u ON u.unit_type_id = ut.id
WHERE p.owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
GROUP BY ut.name, ut.price, ut.size_sqm, p.title
ORDER BY p.title, ut.price DESC;
