-- Delete ALL duplicate unit types and recreate properly

-- First, let's see ALL unit types with their IDs
SELECT ut.id, ut.name, ut.price, ut.size_sqm, p.title as property
FROM unit_types ut
JOIN properties p ON p.id = ut.property_id
ORDER BY p.title, ut.price DESC;
