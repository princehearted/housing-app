# Habitra Homes Postman Smoke Test Checklist

## Health
- `GET /`

## Registration
- `POST /api/landlord/register`
- `POST /api/tenant/register`

## Property Setup
- `POST /api/property/create`
- `POST /api/unit-type/create`
- `POST /api/unit/create`

## Tenant Activity
- `POST /api/booking/create`
- `POST /api/rental/create`

## Admin
- `POST /api/admin/verify-property`

## Public Discovery
- `GET /api/properties`
- `GET /api/property/:id`

## Uploads (form-data)
- `POST /api/upload/unit-photos`
  - fields: `unit_type_id`, `photos` (multiple files)
- `POST /api/upload/property-photos`
  - fields: `property_id`, `photos` (multiple files)

## Constraints
- Max 10 photos/request
- Max 5MB/file
- Image types only (`jpeg`, `jpg`, `png`, `webp`, `gif`)
