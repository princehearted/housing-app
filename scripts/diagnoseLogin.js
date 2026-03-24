import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log("🔍 Diagnosing Login Issues\n")
console.log("=" .repeat(60))

const testEmails = [
  'master@habitra.ke',
  'admin@habitra.ke',
  'landlord@habitra.ke',
  'tenant@habitra.ke'
]

async function diagnoseLogin() {
  for (const email of testEmails) {
    console.log(`\n📧 Checking: ${email}`)
    console.log("-".repeat(60))
    
    try {
      // Check app_users table
      const { data: appUser, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (userError) {
        console.log(`  ❌ Database Error: ${userError.message}`)
        continue
      }

      if (!appUser) {
        console.log(`  ❌ User NOT FOUND in database`)
        console.log(`  💡 Solution: Run 'npm run fix:accounts' to create this user`)
        continue
      }

      console.log(`  ✅ User found (ID: ${appUser.id})`)
      console.log(`  📝 Name: ${appUser.full_name}`)
      console.log(`  📧 Email: ${appUser.email}`)
      console.log(`  📱 Phone: ${appUser.phone || 'N/A'}`)
      console.log(`  🏙️  City: ${appUser.city || 'N/A'}`)
      
      // Check is_active status
      if (appUser.is_active) {
        console.log(`  ✅ Account Status: ACTIVE`)
      } else {
        console.log(`  ❌ Account Status: INACTIVE`)
        console.log(`  💡 Solution: Run 'npm run fix:accounts' to activate`)
      }

      // Check password
      const testPassword = 'demo123'
      const passwordMatch = await bcrypt.compare(testPassword, appUser.password_hash)
      if (passwordMatch) {
        console.log(`  ✅ Password: Correct (demo123 works)`)
      } else {
        console.log(`  ❌ Password: Incorrect hash`)
        console.log(`  💡 Solution: Run 'npm run fix:accounts' to reset password`)
      }

      // Check role-specific data
      if (appUser.tenant_id) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('verified')
          .eq('id', appUser.tenant_id)
          .maybeSingle()
        
        if (tenant) {
          console.log(`  👤 Tenant Profile: ${tenant.verified ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`)
        } else {
          console.log(`  ❌ Tenant Profile: MISSING`)
        }
      }

      if (appUser.landlord_id) {
        const { data: landlord } = await supabase
          .from('landlords')
          .select('verified')
          .eq('id', appUser.landlord_id)
          .maybeSingle()
        
        if (landlord) {
          console.log(`  🏠 Landlord Profile: ${landlord.verified ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`)
        } else {
          console.log(`  ❌ Landlord Profile: MISSING`)
        }
      }

      if (appUser.admin_user_id) {
        const { data: admin } = await supabase
          .from('admin_users')
          .select('role, is_active, is_master_admin')
          .eq('id', appUser.admin_user_id)
          .maybeSingle()
        
        if (admin) {
          const role = admin.is_master_admin ? 'MASTER ADMIN' : admin.role.toUpperCase()
          console.log(`  👑 Admin Profile: ${role} (${admin.is_active ? '✅ ACTIVE' : '❌ INACTIVE'})`)
        } else {
          console.log(`  ❌ Admin Profile: MISSING`)
        }
      }

      // Overall login status
      const canLogin = appUser.is_active && passwordMatch
      if (canLogin) {
        console.log(`  \n  🎉 LOGIN STATUS: ✅ SHOULD WORK`)
      } else {
        console.log(`  \n  ⚠️  LOGIN STATUS: ❌ WILL FAIL`)
        console.log(`  💡 Run: npm run fix:accounts`)
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("\n📋 SUMMARY:")
  console.log("  If any accounts show issues above, run:")
  console.log("  \n  npm run fix:accounts\n")
  console.log("  This will:")
  console.log("  • Activate all test accounts")
  console.log("  • Reset passwords to 'demo123'")
  console.log("  • Verify tenant/landlord profiles")
  console.log("  • Activate admin accounts")
  console.log("\n" + "=".repeat(60) + "\n")
}

diagnoseLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Fatal error:", error)
    process.exit(1)
  })
