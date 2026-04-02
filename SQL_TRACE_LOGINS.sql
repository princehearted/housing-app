-- Habitra: TRACE LOGINS (Run this in Supabase SQL Editor)
-- This will show you all users and their linked roles

SELECT 
  u.email,
  u.full_name,
  u.is_active as user_active,
  CASE 
    WHEN u.admin_user_id IS NOT NULL THEN 'ADMIN (' || a.admin_role || ')'
    WHEN u.landlord_id IS NOT NULL THEN 'LANDLORD'
    WHEN u.tenant_id IS NOT NULL THEN 'TENANT'
    ELSE 'NO ROLE'
  END as role_type,
  CASE
    WHEN u.landlord_id IS NOT NULL THEN l.verified::text
    WHEN u.tenant_id IS NOT NULL THEN t.verified::text
    WHEN u.admin_user_id IS NOT NULL THEN a.is_active::text
    ELSE 'N/A'
  END as profile_verified_active,
  u.admin_user_id,
  u.landlord_id,
  u.tenant_id
FROM app_users u
LEFT JOIN admin_users a ON u.admin_user_id = a.id
LEFT JOIN landlords l ON u.landlord_id = l.id
LEFT JOIN tenants t ON u.tenant_id = t.id;

-- Also check if any of the emails were mistyped (e.g. whitespace)
SELECT email, length(email), '"' || email || '"' as email_wrapped FROM app_users;
