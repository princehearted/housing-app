-- Habitra commission ledger
create table if not exists landlord_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references rentals(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  landlord_id uuid not null references landlords(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  billing_month date not null,
  rent_amount numeric not null,
  commission_rate numeric not null default 0.05,
  commission_amount numeric not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'waived', 'cancelled')),
  generated_at timestamptz not null default now(),
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_by_admin_id uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rental_id, billing_month)
);

create or replace function set_landlord_commission_ledger_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_landlord_commission_ledger_updated_at on landlord_commission_ledger;
create trigger trg_landlord_commission_ledger_updated_at
before update on landlord_commission_ledger
for each row execute function set_landlord_commission_ledger_updated_at();

create index if not exists idx_landlord_commission_ledger_landlord
  on landlord_commission_ledger (landlord_id, billing_month desc);

create index if not exists idx_landlord_commission_ledger_property
  on landlord_commission_ledger (property_id, billing_month desc);

create index if not exists idx_landlord_commission_ledger_status
  on landlord_commission_ledger (status, billing_month desc);
