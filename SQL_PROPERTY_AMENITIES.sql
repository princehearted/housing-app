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

create index if not exists idx_property_amenities_property_id
  on property_amenities (property_id, created_at desc);
