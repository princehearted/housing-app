-- Fix duplicate unit_types by keeping one and deleting others
BEGIN;

-- Step 1: Find duplicates and keep the one with lowest ID
CREATE TEMP TABLE keep_ids AS
SELECT MIN(id) as keep_id, name, property_id
FROM unit_types
GROUP BY name, property_id;

-- Step 2: Update units to point to kept unit_type
UPDATE units u
SET unit_type_id = k.keep_id
FROM keep_ids k
JOIN unit_types ut ON ut.name = k.name AND ut.property_id = k.property_id AND ut.id = k.keep_id
WHERE u.unit_type_id = ut.id AND u.unit_type_id != k.keep_id;

-- Step 3: Delete duplicate unit_types
DELETE FROM unit_types
WHERE id NOT IN (SELECT keep_id FROM keep_ids);

COMMIT;

-- Verify
SELECT name, property_id, COUNT(*) as count
FROM unit_types
GROUP BY name, property_id
HAVING COUNT(*) > 1;
