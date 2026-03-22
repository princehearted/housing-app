-- Interests table for connecting tenants and landlords
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  tenant_name TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  tenant_message TEXT,
  landlord_response TEXT,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interests_tenant_id ON interests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interests_landlord_id ON interests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_interests_property_id ON interests(property_id);
CREATE INDEX IF NOT EXISTS idx_interests_status ON interests(status);

-- Verify table created
SELECT 'interests' as table_name;
