# HABITRA - Implementation Instructions

## Step 1: Run SQL in Supabase
1. Go to your Supabase Dashboard
2. Open SQL Editor
3. Copy and run `SQL_HABITRA_UPDATES.sql`

## Step 2: Set Master Admin
Run this to make yourself master admin (replace with your admin_user ID):
```sql
UPDATE admin_users 
SET is_master_admin = true 
WHERE id = 'YOUR_ADMIN_USER_ID';
```

## Step 3: What Each Update Does

### Database Changes:
1. **interests table** - Added tenant_id_viewed, landlord_viewed_at, tenant_id_image_url
2. **properties** - Added house_rules, terms_of_service, title_deed_url, supporting_documents, verification tracking fields
3. **tenants/landlords** - Added master_admin_override tracking
4. **admin_users** - Added is_master_admin field
5. **New tables**:
   - tenant_reviews - Tenants review landlords/properties
   - landlord_reviews - Landlords review tenants
   - tenant_preferences - Tenant preferences

### Key Features Implemented:

1. **Property Verification** - Landlord uploads title deed → Admin verifies → Shows to tenants

2. **Tenant ID for Landlords** - Landlord can see tenant's ID image before/after booking to verify identity

3. **Master Admin Override** - You can override any admin decision on user/property verification

4. **Rules Agreement** - Simple checkbox (actual contracts done externally)

## Step 4: Verify Master Admin
After running SQL, check your admin record:
```sql
SELECT id, full_name, email, is_master_admin 
FROM admin_users;
```

## Step 5: Start Server
```bash
npm run dev
```

---

## Flow Summary:

### Landlord:
1. Register → Upload ID → Pending verification
2. Add property → Upload title deed → Pending admin approval
3. Once verified, property visible to tenants
4. See bookings → View tenant ID → Accept/Complete/Cancel

### Tenant:
1. Register → Upload ID → Pending verification
2. Browse verified properties (login required)
3. View property: photos, floorplan, rules, terms
4. Book (must be verified) → See landlord contact
5. Landlord sees your ID image

### Admin:
1. Verify user IDs
2. Verify property title deeds
3. Approve/reject content
4. Moderate reviews

### Master Admin (You):
1. Override any admin decision
2. Override property/user verification
3. Full system control
