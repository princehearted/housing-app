-- =============================================================================
-- COMPLETE HABITRA DATABASE SETUP
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS & AUTHENTICATION
-- =============================================================================

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_master_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants (renters)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  id_document_url TEXT,
  id_document_type TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMPTZ,
  verified_by_master BOOLEAN DEFAULT FALSE,
  master_admin_override BOOLEAN DEFAULT FALSE,
  master_admin_override_by UUID REFERENCES admin_users(id),
  master_admin_override_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landlords (property owners)
CREATE TABLE IF NOT EXISTS landlords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  id_document_url TEXT,
  id_document_type TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMPTZ,
  verified_by_master BOOLEAN DEFAULT FALSE,
  master_admin_override BOOLEAN DEFAULT FALSE,
  master_admin_override_by UUID REFERENCES admin_users(id),
  master_admin_override_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Users (links to auth)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  password_hash TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  landlord_id UUID REFERENCES landlords(id),
  admin_user_id UUID REFERENCES admin_users(id),
  is_active BOOLEAN DEFAULT TRUE,
  deletion_requested BOOLEAN DEFAULT FALSE,
  deletion_request_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROPERTIES
-- =============================================================================

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES landlords(id),
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  area TEXT,
  neighborhood TEXT,
  address TEXT,
  property_type TEXT,
  property_class TEXT,
  total_units INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMPTZ,
  verified_by_master BOOLEAN DEFAULT FALSE,
  master_admin_override BOOLEAN DEFAULT FALSE,
  master_admin_override_by UUID REFERENCES admin_users(id),
  master_admin_override_at TIMESTAMPTZ,
  master_admin_override_reason TEXT,
  house_rules TEXT,
  terms_of_service TEXT,
  rules_accepted BOOLEAN DEFAULT FALSE,
  title_deed_url TEXT,
  supporting_documents JSONB DEFAULT '[]',
  documents_verified BOOLEAN DEFAULT FALSE,
  documents_verified_by UUID REFERENCES admin_users(id),
  documents_verified_at TIMESTAMPTZ,
  documents_rejection_reason TEXT,
  map_color TEXT DEFAULT 'green',
  listing_plan_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Photos
CREATE TABLE IF NOT EXISTS property_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Amenities
CREATE TABLE IF NOT EXISTS property_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity_key TEXT NOT NULL,
  amenity_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unit Types (e.g., 1 Bedroom, Bedsitter)
CREATE TABLE IF NOT EXISTS unit_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC,
  size_sqm NUMERIC,
  total_units INTEGER DEFAULT 0,
  occupied_units INTEGER DEFAULT 0,
  available_units INTEGER DEFAULT 0,
  unit_category TEXT,
  floor_plan_image_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Units
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_type_id UUID NOT NULL REFERENCES unit_types(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- BOOKINGS / INTERESTS
-- =============================================================================

-- Interests (bookings)
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

-- =============================================================================
-- REVIEWS
-- =============================================================================

-- Tenant Reviews (tenant reviewing landlord/property)
CREATE TABLE IF NOT EXISTS tenant_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- Landlord Reviews (landlord reviewing tenant)
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

-- =============================================================================
-- PREFERENCES
-- =============================================================================

-- Tenant Preferences
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

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(verification_status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_unit_types_property ON unit_types(property_id);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON units(unit_type_id);
CREATE INDEX IF NOT EXISTS idx_interests_tenant ON interests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interests_landlord ON interests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_interests_property ON interests(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reviews_tenant ON tenant_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reviews_landlord ON tenant_reviews(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reviews_landlord ON landlord_reviews(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reviews_tenant ON landlord_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_preferences_tenant ON tenant_preferences(tenant_id);

-- Success message
SELECT 'All tables created successfully!' as message;
