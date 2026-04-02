-- View all unit types with property info
SELECT ut.name, ut.price, ut.size_sqm, p.title as property
FROM unit_types ut
JOIN properties p ON p.id = ut.property_id
WHERE p.owner_id = 'de073936-f866-4a79-9f6f-102d84e9cf30'
ORDER BY p.title, ut.price DESC;
