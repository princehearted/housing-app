-- =============================================================================
-- ADD MISSING TABLES & COLUMNS
-- Run this in Supabase SQL Editor
-- =============================================================================

-- 1. Create interests table (if not using bookings)
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  tenant_name TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  tenant_message TEXT,
  tenant_id_image_url TEXT,
  landlord_response TEXT,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled')),
  tenant_id_viewed BOOLEAN DEFAULT FALSE,
  landlord_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- 2. Create landlord_reviews table (for landlords to review tenants)
CREATE TABLE IF NOT EXISTS landlord_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  compliance_score INTEGER CHECK (compliance_score >= 1 AND compliance_score <= 5),
  payment_history TEXT,
  behavior_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 3. Create tenant_preferences table
CREATE TABLE IF NOT EXISTS tenant_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  preferred_city TEXT,
  min_budget NUMERIC,
  max_budget NUMERIC,
  property_type TEXT,
  desired_amenities JSONB DEFAULT '[]',
  experience_improvements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add is_master_admin to admin_users (if not exists)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_master_admin BOOLEAN DEFAULT FALSE;

-- 5. Add master admin override fields to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS verified_by_master BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS master_admin_override BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS master_admin_override_by UUID REFERENCES admin_users(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS master_admin_override_at TIMESTAMPTZ;

-- 6. Add master admin override fields to landlords
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS verified_by_master BOOLEAN DEFAULT FALSE;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS master_admin_override BOOLEAN DEFAULT FALSE;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS master_admin_override_by UUID REFERENCES admin_users(id);
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS master_admin_override_at TIMESTAMPTZ;

-- 7. Add property fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS terms_of_service TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title_deed_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS documents_verified_by UUID REFERENCES admin_users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS documents_verified_at TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_by_master BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS master_admin_override BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS master_admin_override_by UUID REFERENCES admin_users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS master_admin_override_at TIMESTAMPTZ;

-- 8. Add tenant_id_image_url to bookings (for landlord viewing tenant ID)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tenant_id_image_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS landlord_viewed_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interests_tenant ON interests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interests_landlord ON interests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reviews_landlord ON landlord_reviews(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reviews_tenant ON landlord_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_preferences_tenant ON tenant_preferences(tenant_id);

SELECT 'All updates completed!' as message;
