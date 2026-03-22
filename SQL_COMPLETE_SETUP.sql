-- Habitra Complete Database Setup
-- Run this in Supabase SQL Editor

-- 1. Landlords table
create table if not exists landlords (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  city text,
  verified boolean not null default false,
  documents jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tenants table
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  city text,
  verified boolean not null default false,
  id_documents jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Admin Users table
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  admin_role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. App Users table (auth)
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  city text,
  password_hash text not null,
  tenant_id uuid references tenants(id) on delete set null,
  landlord_id uuid references landlords(id) on delete set null,
  admin_user_id uuid references admin_users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Properties table
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references landlords(id) on delete cascade,
  title text not null,
  description text,
  country text default 'Kenya',
  state text,
  city text,
  area text,
  neighborhood text,
  address text,
  property_type text,
  property_class text,
  total_units integer default 0,
  occupied_units integer default 0,
  verification_status text default 'pending',
  listing_plan_status text default 'pending',
  map_color text default 'green',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Unit Types table
create table if not exists unit_types (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  price numeric,
  size_sqm integer,
  total_units integer default 0,
  occupied_units integer default 0,
  available_units integer default 0,
  unit_category text default 'residential',
  verification_status text default 'pending',
  created_at timestamptz not null default now()
);

-- 7. Units table
create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  unit_type_id uuid not null references unit_types(id) on delete cascade,
  unit_number text not null,
  floor integer,
  is_available boolean default true,
  created_at timestamptz not null default now()
);

-- 8. Bookings table
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  unit_type_id uuid references unit_types(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  booking_status text default 'pending',
  preferred_viewing_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Property Amenities table
create table if not exists property_amenities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  amenity_key text not null,
  amenity_label text not null,
  is_custom boolean not null default false,
  created_by_landlord_id uuid not null references landlords(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (property_id, amenity_key)
);

-- 10. Tenant Favorites table
create table if not exists tenant_favorites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tenant_id, property_id)
);

-- 11. Platform Contracts table
create table if not exists platform_contracts (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references landlords(id) on delete cascade,
  contract_type text not null,
  start_date date,
  end_date date,
  terms jsonb,
  status text default 'active',
  created_at timestamptz not null default now()
);

-- 12. Commission Ledger table
create table if not exists commission_ledger (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid references landlords(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  amount numeric,
  commission_rate numeric,
  status text default 'pending',
  created_at timestamptz not null default now()
);

-- 13. Compliance Records table
create table if not exists compliance_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete set null,
  landlord_id uuid references landlords(id) on delete set null,
  compliance_type text,
  status text default 'pending',
  documents jsonb,
  created_at timestamptz not null default now()
);

-- 14. Rentals table
create table if not exists rentals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  start_date date,
  end_date date,
  monthly_rent numeric,
  status text default 'active',
  created_at timestamptz not null default now()
);

-- Create indexes
create index if not exists idx_properties_owner_id on properties(owner_id);
create index if not exists idx_properties_verification_status on properties(verification_status);
create index if not exists idx_unit_types_property_id on unit_types(property_id);
create index if not exists idx_units_property_id on units(property_id);
create index if not exists idx_units_unit_type_id on units(unit_type_id);
create index if not exists idx_bookings_tenant_id on bookings(tenant_id);
create index if not exists idx_bookings_property_id on bookings(property_id);
create index if not exists idx_bookings_status on bookings(booking_status);
create index if not exists idx_tenant_favorites_tenant_id on tenant_favorites(tenant_id);
create index if not exists idx_app_users_email on app_users(email);

-- Insert a default admin user (password: Admin123!)
-- Note: In production, use proper password hashing
insert into admin_users (id, full_name, email, admin_role)
values 
  ('b01e0414-a293-420c-aef4-c5502d304a33', 'Super Admin', 'admin@habitra.ke', 'master_admin')
on conflict (email) do nothing;

-- Insert a demo landlord
insert into landlords (id, full_name, email, phone, city, verified)
values 
  ('de073936-f866-4a79-9f6f-102d84e9cf30', 'Demo Landlord', 'landlord@habitra.ke', '+254700000001', 'Mombasa', true)
on conflict (email) do nothing;

-- Insert a demo tenant
insert into tenants (id, full_name, email, phone, city, verified)
values 
  ('f52742bc-08ac-4ea2-8e16-ff07b49091d7', 'Demo Tenant', 'tenant@habitra.ke', '+254711000001', 'Mombasa', true)
on conflict (email) do nothing;

-- Insert a demo property
insert into properties (id, owner_id, title, description, city, area, neighborhood, address, property_type, property_class, total_units, verification_status, map_color)
values 
  ('094b0262-a7ec-47ff-8f73-842c381b9401', 'de073936-f866-4a79-9f6f-102d84e9cf30', 'Demo Property', 'A beautiful demo property in Mombasa', 'Mombasa', 'Nyali', 'Links Road', '123 Links Road', 'apartment', 'high_end_apartment', 6, 'verified', 'green')
on conflict (id) do nothing;

-- Insert demo unit type
insert into unit_types (id, property_id, name, price, size_sqm, total_units, available_units, unit_category, verification_status)
values 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '094b0262-a7ec-47ff-8f73-842c381b9401', '1 Bedroom', 25000, 45, 2, 2, 'residential', 'verified')
on conflict (id) do nothing;

-- Insert demo units
insert into units (id, property_id, unit_type_id, unit_number, floor, is_available)
values 
  ('11111111-1111-1111-1111-111111111111', '094b0262-a7ec-47ff-8f73-842c381b9401', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '101', 1, true),
  ('22222222-2222-2222-2222-222222222222', '094b0262-a7ec-47ff-8f73-842c381b9401', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '102', 1, true)
on conflict (id) do nothing;

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers
drop trigger if exists update_landlords_updated_at on landlords;
create trigger update_landlords_updated_at before update on landlords for each row execute function update_updated_at_column();

drop trigger if exists update_tenants_updated_at on tenants;
create trigger update_tenants_updated_at before update on tenants for each row execute function update_updated_at_column();

drop trigger if exists update_properties_updated_at on properties;
create trigger update_properties_updated_at before update on properties for each row execute function update_updated_at_column();

drop trigger if exists update_app_users_updated_at on app_users;
create trigger update_app_users_updated_at before update on app_users for each row execute function update_updated_at_column();

-- Enable Row Level Security (optional - disable for development)
alter table landlords enable row level security;
alter table tenants enable row level security;
alter table properties enable row level security;
alter table unit_types enable row level security;
alter table units enable row level security;
alter table bookings enable row level security;

-- Create policies (allow all for development)
drop policy if exists "Allow all landlords" on landlords;
create policy "Allow all landlords" on landlords for all using (true);

drop policy if exists "Allow all tenants" on tenants;
create policy "Allow all tenants" on tenants for all using (true);

drop policy if exists "Allow all properties" on properties;
create policy "Allow all properties" on properties for all using (true);

drop policy if exists "Allow all unit_types" on unit_types;
create policy "Allow all unit_types" on unit_types for all using (true);

drop policy if exists "Allow all units" on units;
create policy "Allow all units" on units for all using (true);

drop policy if exists "Allow all bookings" on bookings;
create policy "Allow all bookings" on bookings for all using (true);

drop policy if exists "Allow all app_users" on app_users;
create policy "Allow all app_users" on app_users for all using (true);

drop policy if exists "Allow all admin_users" on admin_users;
create policy "Allow all admin_users" on admin_users for all using (true);

drop policy if exists "Allow all property_amenities" on property_amenities;
create policy "Allow all property_amenities" on property_amenities for all using (true);

drop policy if exists "Allow all tenant_favorites" on tenant_favorites;
create policy "Allow all tenant_favorites" on tenant_favorites for all using (true);

drop policy if exists "Allow all platform_contracts" on platform_contracts;
create policy "Allow all platform_contracts" on platform_contracts for all using (true);

drop policy if exists "Allow all commission_ledger" on commission_ledger;
create policy "Allow all commission_ledger" on commission_ledger for all using (true);

drop policy if exists "Allow all compliance_records" on compliance_records;
create policy "Allow all compliance_records" on compliance_records for all using (true);

drop policy if exists "Allow all rentals" on rentals;
create policy "Allow all rentals" on rentals for all using (true);

-- Enable service role key bypass (for backend)
-- This allows the backend to bypass RLS using the service role key

-- Test: Verify tables exist
select 'landlords' as table_name, count(*) as rows from landlords
union all select 'tenants', count(*) from tenants
union all select 'properties', count(*) from properties
union all select 'unit_types', count(*) from unit_types
union all select 'units', count(*) from units
union all select 'bookings', count(*) from bookings
union all select 'admin_users', count(*) from admin_users;
