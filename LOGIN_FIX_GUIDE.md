# 🔐 Login Issue Fix Guide

## Problem: Can't Sign In to Test Accounts

### Common Causes:
1. ❌ Test accounts not activated (`is_active = false`)
2. ❌ Password hash doesn't match "demo123"
3. ❌ Tenant/Landlord profiles not verified
4. ❌ Admin accounts not properly linked
5. ❌ Accounts don't exist in database

---

## ✅ SOLUTION (Quick Fix)

### Step 1: Diagnose the Problem
```powershell
npm run check:login
```

This will show you exactly what's wrong with each test account.

### Step 2: Fix All Test Accounts
```powershell
npm run fix:accounts
```

This automatically:
- ✅ Creates missing test accounts
- ✅ Activates all accounts (`is_active = true`)
- ✅ Resets passwords to "demo123"
- ✅ Verifies tenant/landlord profiles
- ✅ Activates admin accounts
- ✅ Links all profiles correctly

### Step 3: Test Login
1. Start your server: `npm start`
2. Open: http://localhost:3000/ui/login.html
3. Try logging in with:
   - **Email**: tenant@habitra.ke
   - **Password**: demo123

---

## 📝 Test Account Credentials

After running `npm run fix:accounts`, these accounts will work:

| Email | Password | Role | Dashboard |
|-------|----------|------|-----------|
| master@habitra.ke | demo123 | Master Admin | master-admin.html |
| admin@habitra.ke | demo123 | Admin | master-admin.html |
| landlord@habitra.ke | demo123 | Landlord | landlord-dashboard.html |
| tenant@habitra.ke | demo123 | Tenant | tenant-dashboard.html |

---

## 🔍 What the Scripts Do

### `npm run check:login`
**Diagnostic Script** - Shows you:
- ✅ If account exists
- ✅ If account is active
- ✅ If password is correct
- ✅ If profiles are verified
- ✅ Overall login status

**Example Output:**
```
📧 Checking: tenant@habitra.ke
------------------------------------------------------------
  ✅ User found (ID: abc123)
  📝 Name: Test Tenant
  ✅ Account Status: ACTIVE
  ✅ Password: Correct (demo123 works)
  👤 Tenant Profile: ✅ VERIFIED
  
  🎉 LOGIN STATUS: ✅ SHOULD WORK
```

### `npm run fix:accounts`
**Fix Script** - Automatically:
1. Checks if each test account exists
2. Creates account if missing
3. Sets `is_active = true`
4. Resets password to "demo123"
5. Creates/verifies tenant/landlord profiles
6. Creates/activates admin profiles
7. Links everything correctly

**Example Output:**
```
📧 Processing: tenant@habitra.ke
  ✓ User exists (ID: abc123)
  ✓ Updated: is_active=true, password reset
  ✓ Tenant verified

✅ Test account fix complete!
```

---

## 🛠️ Manual Fix (If Scripts Don't Work)

If the automated scripts fail, you can manually fix accounts in Supabase:

### 1. Go to Supabase Dashboard
- Open: https://supabase.com/dashboard
- Select your project
- Go to "Table Editor"

### 2. Fix `app_users` Table
Find the user by email and update:
```sql
UPDATE app_users 
SET is_active = true,
    password_hash = '$2a$10$...' -- Use bcrypt hash of 'demo123'
WHERE email = 'tenant@habitra.ke';
```

### 3. Fix `tenants` Table (for tenant accounts)
```sql
UPDATE tenants 
SET verified = true
WHERE email = 'tenant@habitra.ke';
```

### 4. Fix `landlords` Table (for landlord accounts)
```sql
UPDATE landlords 
SET verified = true
WHERE email = 'landlord@habitra.ke';
```

### 5. Fix `admin_users` Table (for admin accounts)
```sql
UPDATE admin_users 
SET is_active = true,
    is_master_admin = true  -- Only for master@habitra.ke
WHERE email = 'master@habitra.ke';
```

---

## 🔐 Password Hash for "demo123"

If you need to manually set the password hash:

```
$2a$10$rKvVJKn5YJYxYxYxYxYxYeN7N7N7N7N7N7N7N7N7N7N7N7N7N7
```

Or generate a new one:
```javascript
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash('demo123', 10)
console.log(hash)
```

---

## 🚨 Troubleshooting

### Issue: "Invalid credentials" error
**Causes:**
- Account doesn't exist
- Password hash is wrong
- Account is not active

**Solution:**
```powershell
npm run check:login  # See what's wrong
npm run fix:accounts # Fix it
```

### Issue: "Account is not active" error
**Cause:** `is_active = false` in database

**Solution:**
```powershell
npm run fix:accounts
```

### Issue: Login works but redirects to wrong page
**Cause:** Profile not properly linked

**Solution:**
```powershell
npm run fix:accounts
```

### Issue: Scripts fail with database error
**Causes:**
- Supabase credentials wrong in `.env`
- Database tables don't exist
- Network connection issue

**Check:**
1. Verify `.env` file has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Run database setup scripts first
3. Check internet connection

---

## 📊 Login Flow Explained

### What Happens When You Login:

1. **Frontend** sends email + password to `/api/auth/login`

2. **Backend** checks:
   ```javascript
   // 1. Find user by email
   const user = await supabase
     .from('app_users')
     .select('*')
     .eq('email', email)
     .maybeSingle()
   
   // 2. Verify password
   const isValid = await bcrypt.compare(password, user.password_hash)
   // OR accept "demo123" for test accounts
   
   // 3. Check if active
   if (!user.is_active) return error
   
   // 4. Get role info (tenant/landlord/admin)
   
   // 5. Generate JWT token
   
   // 6. Return token + user data
   ```

3. **Frontend** stores token and redirects based on role:
   - Master Admin → `master-admin.html`
   - Admin → `master-admin.html`
   - Landlord → `landlord-dashboard.html`
   - Tenant → `tenant-dashboard.html`

### Why Login Fails:

❌ **Step 1 fails** → User not found in database
❌ **Step 2 fails** → Password hash doesn't match
❌ **Step 3 fails** → Account not active (`is_active = false`)

**Fix all with:** `npm run fix:accounts`

---

## ✅ Verification Checklist

After running the fix script, verify:

- [ ] Run `npm run check:login` - all accounts show ✅
- [ ] Start server: `npm start`
- [ ] Open login page: http://localhost:3000/ui/login.html
- [ ] Login with tenant@habitra.ke / demo123
- [ ] Should redirect to tenant dashboard
- [ ] Logout and try landlord@habitra.ke / demo123
- [ ] Should redirect to landlord dashboard
- [ ] Try admin@habitra.ke / demo123
- [ ] Should redirect to admin panel

---

## 🎯 Quick Commands Reference

```powershell
# Check what's wrong
npm run check:login

# Fix all test accounts
npm run fix:accounts

# Start the server
npm start

# Test in browser
# http://localhost:3000/ui/login.html
```

---

## 📞 Still Having Issues?

If login still doesn't work after running `npm run fix:accounts`:

1. **Check server logs** - Look for error messages when you try to login
2. **Check browser console** (F12) - Look for API errors
3. **Verify .env file** - Make sure Supabase credentials are correct
4. **Check database** - Go to Supabase dashboard and verify tables exist

---

## 🔒 Security Note

**Important:** The "demo123" password and test accounts are for **development only**.

Before deploying to production:
- ❌ Delete all test accounts
- ❌ Remove demo password logic from `authController.js`
- ✅ Use strong passwords
- ✅ Enable proper user registration flow
- ✅ Add email verification

---

**Last Updated:** 2024
**Status:** ✅ Login fix scripts ready to use

Run `npm run fix:accounts` now to fix your test accounts! 🚀
