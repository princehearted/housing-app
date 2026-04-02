-- First, let's see ALL unit types to understand the duplicates
SELECT ut.id, ut.name, ut.price, ut.size_sqm, ut.property_id, p.title as property_title
FROM unit_types ut
JOIN properties p ON p.id = ut.property_id
WHERE p.owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
ORDER BY p.title, ut.price DESC;
