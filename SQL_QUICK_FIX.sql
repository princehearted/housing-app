-- Delete duplicate unit types for bedsitter property
DELETE FROM units WHERE unit_type_id IN (
  SELECT id FROM unit_types WHERE property_id = '204b0262-a7ec-47ff-8f73-842c381b9402'
);
DELETE FROM unit_types WHERE property_id = '204b0262-a7ec-47ff-8f73-842c381b9402';

-- Add NEW unique bedsitter (Type B - 30 sqm, KES 15,000)
INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status)
VALUES ('204b0262-a7ec-47ff-8f73-842c381b9101', '204b0262-a7ec-47ff-8f73-842c381b9402', 'Type B Bedsitter (30 sqm)', 15000, 30, 3, 0, 3, 'verified');

INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) VALUES
('304b0262-a7ec-47ff-8f73-842c381b9101', '204b0262-a7ec-47ff-8f73-842c381b9402', '204b0262-a7ec-47ff-8f73-842c381b9101', 'B01', 0, true),
('304b0262-a7ec-47ff-8f73-842c381b9102', '204b0262-a7ec-47ff-8f73-842c381b9402', '204b0262-a7ec-47ff-8f73-842c381b9101', 'B02', 0, true),
('304b0262-a7ec-47ff-8f73-842c381b9103', '204b0262-a7ec-47ff-8f73-842c381b9402', '204b0262-a7ec-47ff-8f73-842c381b9101', 'B03', 1, true);

-- Fix 2BR property
DELETE FROM units WHERE unit_type_id IN (
  SELECT id FROM unit_types WHERE property_id = '094b0262-a7ec-47ff-8f73-842c381b9401'
);
DELETE FROM unit_types WHERE property_id = '094b0262-a7ec-47ff-8f73-842c381b9401';

INSERT INTO unit_types (id, property_id, name, price, size_sqm, total_units, occupied_units, available_units, verification_status) VALUES
('094b0262-a7ec-47ff-8f73-842c381b9101', '094b0262-a7ec-47ff-8f73-842c381b9401', '2 Bedroom Deluxe', 45000, 85, 2, 0, 2, 'verified'),
('094b0262-a7ec-47ff-8f73-842c381b9102', '094b0262-a7ec-47ff-8f73-842c381b9401', '2 Bedroom Standard', 35000, 70, 2, 0, 2, 'verified');

INSERT INTO units (id, property_id, unit_type_id, unit_number, floor, is_available) VALUES
('094b0262-a7ec-47ff-8f73-842c381b9101', '094b0262-a7ec-47ff-8f73-842c381b9401', '094b0262-a7ec-47ff-8f73-842c381b9101', '101', 1, true),
('094b0262-a7ec-47ff-8f73-842c381b9102', '094b0262-a7ec-47ff-8f73-842c381b9401', '094b0262-a7ec-47ff-8f73-842c381b9101', '102', 1, true),
('094b0262-a7ec-47ff-8f73-842c381b9103', '094b0262-a7ec-47ff-8f73-842c381b9401', '094b0262-a7ec-47ff-8f73-842c381b9102', '201', 2, true),
('094b0262-a7ec-47ff-8f73-842c381b9104', '094b0262-a7ec-47ff-8f73-842c381b9401', '094b0262-a7ec-47ff-8f73-842c381b9102', '202', 2, true);
