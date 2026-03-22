-- Habitra contract module
create table if not exists rental_contracts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete set null,
  rental_id uuid references rentals(id) on delete set null,
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid references units(id) on delete set null,
  tenant_id uuid not null references tenants(id) on delete cascade,
  landlord_id uuid not null references landlords(id) on delete cascade,
  created_by_landlord_id uuid not null references landlords(id) on delete cascade,
  title text not null default 'Residential Lease Agreement',
  terms_text text,
  monthly_rent numeric,
  deposit_amount numeric,
  start_date date not null,
  end_date date,
  contract_status text not null default 'sent'
    check (contract_status in ('draft', 'sent', 'tenant_signed', 'landlord_signed', 'fully_signed', 'cancelled')),
  signed_document_url text,
  tenant_signed_at timestamptz,
  landlord_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_rental_contracts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_rental_contracts_updated_at on rental_contracts;
create trigger trg_rental_contracts_updated_at
before update on rental_contracts
for each row execute function set_rental_contracts_updated_at();

create index if not exists idx_rental_contracts_property_id
  on rental_contracts (property_id, created_at desc);

create index if not exists idx_rental_contracts_tenant_id
  on rental_contracts (tenant_id, created_at desc);

create index if not exists idx_rental_contracts_landlord_id
  on rental_contracts (landlord_id, created_at desc);

create index if not exists idx_rental_contracts_status
  on rental_contracts (contract_status, created_at desc);

create unique index if not exists ux_rental_contracts_booking_id_not_null
  on rental_contracts (booking_id)
  where booking_id is not null;

create unique index if not exists ux_rental_contracts_rental_id_not_null
  on rental_contracts (rental_id)
  where rental_id is not null;
