-- =============================================================================
-- HABITRA DATABASE UPDATES
-- Run these in your Supabase SQL Editor
-- =============================================================================

-- 1. Update interests table - add tenant_id_visible field
ALTER TABLE interests 
ADD COLUMN IF NOT EXISTS tenant_id_viewed BOOLEAN DEFAULT FALSE;

-- 2. Add landlord_viewed_at timestamp
ALTER TABLE interests 
ADD COLUMN IF NOT EXISTS landlord_viewed_at TIMESTAMPTZ;

-- 3. Add house_rules and terms_of_service to properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS house_rules TEXT;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS terms_of_service TEXT;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS rules_accepted BOOLEAN DEFAULT FALSE;

-- 4. Add title deed / document verification fields to properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS title_deed_url TEXT;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS supporting_documents JSONB DEFAULT '[]';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS documents_verified_by UUID REFERENCES admin_users(id);

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS documents_verified_at TIMESTAMPTZ;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS documents_rejection_reason TEXT;

-- 5. Add verification override fields to track master admin actions
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS verified_by_master BOOLEAN DEFAULT FALSE;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS master_admin_override BOOLEAN DEFAULT FALSE;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS master_admin_override_by UUID REFERENCES admin_users(id);

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS master_admin_override_at TIMESTAMPTZ;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS master_admin_override_reason TEXT;

-- 6. Add similar override fields to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS verified_by_master BOOLEAN DEFAULT FALSE;

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS master_admin_override BOOLEAN DEFAULT FALSE;

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS master_admin_override_by UUID REFERENCES admin_users(id);

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS master_admin_override_at TIMESTAMPTZ;

-- 7. Add similar override fields to landlords table
ALTER TABLE landlords 
ADD COLUMN IF NOT EXISTS verified_by_master BOOLEAN DEFAULT FALSE;

ALTER TABLE landlords 
ADD COLUMN IF NOT EXISTS master_admin_override BOOLEAN DEFAULT FALSE;

ALTER TABLE landlords 
ADD COLUMN IF NOT EXISTS master_admin_override_by UUID REFERENCES admin_users(id);

ALTER TABLE landlords 
ADD COLUMN IF NOT EXISTS master_admin_override_at TIMESTAMPTZ;

-- 8. Add role field to admin_users to identify master admin
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS is_master_admin BOOLEAN DEFAULT FALSE;

-- 9. Add tenant ID document to interests for landlord viewing
ALTER TABLE interests 
ADD COLUMN IF NOT EXISTS tenant_id_image_url TEXT;

-- 10. Create table for tenant reviews (tenant reviewing landlord/property)
CREATE TABLE IF NOT EXISTS tenant_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 11. Create table for landlord reviews (landlord reviewing tenant)
CREATE TABLE IF NOT EXISTS landlord_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  compliance_score INTEGER CHECK (compliance_score >= 1 AND compliance_score <= 5),
  payment_history TEXT,
  behavior_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 12. Create table for tenant preferences
CREATE TABLE IF NOT EXISTS tenant_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  preferred_city TEXT,
  min_budget NUMERIC,
  max_budget NUMERIC,
  property_type TEXT,
  desired_amenities JSONB DEFAULT '[]',
  experience_improvements TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_reviews_tenant ON tenant_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reviews_landlord ON tenant_reviews(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reviews_landlord ON landlord_reviews(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reviews_tenant ON landlord_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_preferences_tenant ON tenant_preferences(tenant_id);

-- Verify tables created
SELECT 'interests' as table_name;
SELECT 'tenant_reviews' as table_name;
SELECT 'landlord_reviews' as table_name;
SELECT 'tenant_preferences' as table_name;
