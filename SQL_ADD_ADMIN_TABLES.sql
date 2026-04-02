-- Habitra Setup: Missing Admin Tables
-- Run this in Supabase SQL Editor if you see errors about missing tables

-- 1. admin_action_logs table
create table if not exists admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references admin_users(id) on delete set null,
  action_type text not null,
  target_table text,
  target_id uuid,
  decision text,
  notes text,
  created_at timestamptz not null default now()
);

-- 2. landlord_verification_documents table
create table if not exists landlord_verification_documents (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid references landlords(id) on delete cascade,
  document_type text not null,
  document_url text not null,
  verification_status text default 'pending',
  reviewed_by_admin_id uuid references admin_users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  uploaded_at timestamptz not null default now()
);

-- 3. property_documents_db table
create table if not exists property_documents_db (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  review_status text default 'pending',
  reviewed_by_admin_id uuid references admin_users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

-- Enable RLS (optional - disable for development)
alter table admin_action_logs enable row level security;
alter table landlord_verification_documents enable row level security;
alter table property_documents_db enable row level security;

-- Create policies (allow all for development)
drop policy if exists "Allow all logs" on admin_action_logs;
create policy "Allow all logs" on admin_action_logs for all using (true);

drop policy if exists "Allow all landlord docs" on landlord_verification_documents;
create policy "Allow all landlord docs" on landlord_verification_documents for all using (true);

drop policy if exists "Allow all property docs" on property_documents_db;
create policy "Allow all property docs" on property_documents_db for all using (true);
