-- Habitra compliance module (landlord + tenant + app-user misuse)

-- 1) Landlord compliance cases
create table if not exists landlord_compliance_cases (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references landlords(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  contract_id uuid references landlord_platform_contracts(id) on delete set null,

  violation_type text not null,
  violation_details text not null,
  action_type text not null check (action_type in ('warning', 'fine', 'termination')),

  fine_amount numeric not null default 0,
  warning_message text,

  status text not null default 'open' check (status in ('open', 'closed', 'appealed', 'cancelled')),
  notes text,
  resolved_at timestamptz,

  created_by_admin_id uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists landlord_warning_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references landlord_compliance_cases(id) on delete cascade,
  landlord_id uuid not null references landlords(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'whatsapp_future')),
  message text not null,
  sent_by_admin_id uuid references admin_users(id) on delete set null,
  sent_at timestamptz not null default now(),
  delivery_status text not null default 'logged'
);

-- 2) Tenant compliance cases
create table if not exists tenant_compliance_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  landlord_id uuid references landlords(id) on delete set null,

  violation_type text not null,
  violation_details text not null,
  action_type text not null check (action_type in ('warning', 'termination')),

  fine_amount numeric not null default 0,
  warning_message text,

  status text not null default 'open' check (status in ('open', 'closed', 'appealed', 'cancelled')),
  notes text,
  resolved_at timestamptz,

  created_by_admin_id uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tenant_warning_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references tenant_compliance_cases(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'whatsapp_future')),
  message text not null,
  sent_by_admin_id uuid references admin_users(id) on delete set null,
  sent_at timestamptz not null default now(),
  delivery_status text not null default 'logged'
);

-- 3) App-user misuse compliance cases
create table if not exists app_user_compliance_cases (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references app_users(id) on delete cascade,
  role_context text not null default 'global' check (role_context in ('tenant', 'landlord', 'both', 'global')),

  violation_type text not null,
  violation_details text not null,
  action_type text not null check (action_type in ('warning', 'fine', 'termination', 'suspension')),

  fine_amount numeric not null default 0,
  warning_message text,

  status text not null default 'open' check (status in ('open', 'closed', 'appealed', 'cancelled')),
  notes text,
  resolved_at timestamptz,

  created_by_admin_id uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_user_warning_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references app_user_compliance_cases(id) on delete cascade,
  app_user_id uuid not null references app_users(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'whatsapp_future')),
  message text not null,
  sent_by_admin_id uuid references admin_users(id) on delete set null,
  sent_at timestamptz not null default now(),
  delivery_status text not null default 'logged'
);

-- 4) Shared updated_at trigger function
create or replace function set_compliance_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_landlord_compliance_cases_updated_at on landlord_compliance_cases;
create trigger trg_landlord_compliance_cases_updated_at
before update on landlord_compliance_cases
for each row execute function set_compliance_updated_at();

drop trigger if exists trg_tenant_compliance_cases_updated_at on tenant_compliance_cases;
create trigger trg_tenant_compliance_cases_updated_at
before update on tenant_compliance_cases
for each row execute function set_compliance_updated_at();

drop trigger if exists trg_app_user_compliance_cases_updated_at on app_user_compliance_cases;
create trigger trg_app_user_compliance_cases_updated_at
before update on app_user_compliance_cases
for each row execute function set_compliance_updated_at();

-- 5) Indexes
create index if not exists idx_landlord_compliance_cases_landlord
  on landlord_compliance_cases (landlord_id, status, created_at desc);

create index if not exists idx_landlord_compliance_cases_property
  on landlord_compliance_cases (property_id, status, created_at desc);

create index if not exists idx_landlord_warning_logs_landlord
  on landlord_warning_logs (landlord_id, sent_at desc);

create index if not exists idx_landlord_warning_logs_case
  on landlord_warning_logs (case_id, sent_at desc);

create index if not exists idx_tenant_compliance_cases_tenant
  on tenant_compliance_cases (tenant_id, status, created_at desc);

create index if not exists idx_tenant_warning_logs_tenant
  on tenant_warning_logs (tenant_id, sent_at desc);

create index if not exists idx_tenant_warning_logs_case
  on tenant_warning_logs (case_id, sent_at desc);

create index if not exists idx_app_user_compliance_cases_user
  on app_user_compliance_cases (app_user_id, status, created_at desc);

create index if not exists idx_app_user_warning_logs_user
  on app_user_warning_logs (app_user_id, sent_at desc);

create index if not exists idx_app_user_warning_logs_case
  on app_user_warning_logs (case_id, sent_at desc);
