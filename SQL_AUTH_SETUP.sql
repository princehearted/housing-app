-- Habitra auth setup
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

create index if not exists idx_app_users_tenant_id on app_users(tenant_id);
create index if not exists idx_app_users_landlord_id on app_users(landlord_id);
create index if not exists idx_app_users_admin_user_id on app_users(admin_user_id);

-- Keep updated_at fresh
create or replace function set_app_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_users_updated_at on app_users;
create trigger trg_app_users_updated_at
before update on app_users
for each row execute function set_app_users_updated_at();
