# Habitra Homes - Beginner Playbook

## 1) Start Backend (VS Code Terminal)
```powershell
node server.js
```

If port conflict:
```powershell
taskkill /IM node.exe /F
node server.js
```

## 2) Quick Health Test
```http
GET http://localhost:3000/
```
Expected:
`Rental platform backend running`

## 3) Seed Demo Data (Optional but Recommended)
```powershell
npm run seed:demo
```
Copy IDs from output into Postman variables.

## 4) Postman Collection
Import:
`postman/Housing-App-API.postman_collection.json`

Set variables:
- `base_url`
- `tenant_id`
- `landlord_id`
- `property_id`
- `unit_type_id`
- `unit_id`
- `booking_id`
- `admin_token` (JWT for admin endpoints)

## 5) Core Test Order
1. `Health -> Root Check`
2. `Booking & Rental -> Respond To Booking (Approve)`
3. `Landlord -> Landlord Bookings (Approved)`
4. `Tenant -> Tenant Bookings`
5. `Property -> Map Properties`

## 6) Tenant Register With ID Photos
```powershell
curl.exe -X POST "http://localhost:3000/api/tenant/register-with-docs" -F "full_name=Photo Tenant" -F "email=phototenant1@housingapp.ke" -F "phone=+254711555333" -F "city=Mombasa" -F "id_front=@C:\Users\princ\OneDrive\Desktop\id_front.jpg" -F "id_back=@C:\Users\princ\OneDrive\Desktop\id_back.jpg"
```

## 7) Upload Tests
Property document:
```powershell
curl.exe -X POST "http://localhost:3000/api/upload/property-document" -F "property_id=094b0262-a7ec-47ff-8f73-842c381b9401" -F "document_type=title_deed" -F "document=@C:\Users\princ\OneDrive\Desktop\id_front.jpg"
```

Landlord verification doc:
```powershell
curl.exe -X POST "http://localhost:3000/api/upload/landlord-verification-doc" -F "landlord_id=de073936-f866-4a79-9f6f-102d84e9cf30" -F "document_type=national_id" -F "document=@C:\Users\princ\OneDrive\Desktop\id_back.jpg"
```

Tenant extra document:
```powershell
curl.exe -X POST "http://localhost:3000/api/upload/tenant-document" -F "tenant_id=f52742bc-08ac-4ea2-8e16-ff07b49091d7" -F "document_type=passport" -F "document=@C:\Users\princ\OneDrive\Desktop\id_back.jpg"
```

## 8) Admin Verification (PowerShell Safe)
Use `Invoke-RestMethod` for JSON payloads in PowerShell.

Landlord doc review:
```powershell
$body = @{ admin_user_id = "b01e0414-a293-420c-aef4-c5502d304a33"; document_id = "a96dc6f5-cd65-4190-a9e6-9943d4c0c411"; decision = "verified"; notes = "ID document name match verified" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/admin/review-landlord-document" -ContentType "application/json" -Body $body
```

Property doc review:
```powershell
$body = @{ admin_user_id = "b01e0414-a293-420c-aef4-c5502d304a33"; document_id = "3d0c8997-9df9-46e0-bbdb-0b9bcf3f4360"; decision = "approved"; notes = "Title deed details verified" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/admin/review-property-document" -ContentType "application/json" -Body $body
```

Master override:
```powershell
$body = @{ admin_user_id = "b01e0414-a293-420c-aef4-c5502d304a33"; property_id = "094b0262-a7ec-47ff-8f73-842c381b9401"; decision = "verified"; notes = "Master admin final override" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/admin/master-override-property" -ContentType "application/json" -Body $body
```

## 9) Troubleshooting
- If you see `Route not found`: restart server (`Ctrl + C`, then `node server.js`).
- If you see `>>` in terminal unexpectedly: press `Ctrl + C` and run command again on one line.
- If `curl` JSON keeps failing in PowerShell: switch to `Invoke-RestMethod`.

## 10) Brand
- Parent brand: `Habitra`
- Housing module: `Habitra Homes`
- Ops label: `Habitra Home Solutions`

