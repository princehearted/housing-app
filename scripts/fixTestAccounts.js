import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log("🔍 Checking and fixing test accounts...\n")

const testAccounts = [
  {
    email: 'master@habitra.ke',
    password: 'demo123',
    full_name: 'Master Admin',
    role: 'master_admin',
    is_admin: true
  },
  {
    email: 'admin@habitra.ke',
    password: 'demo123',
    full_name: 'Admin User',
    role: 'admin',
    is_admin: true
  },
  {
    email: 'landlord@habitra.ke',
    password: 'demo123',
    full_name: 'Test Landlord',
    role: 'landlord',
    is_admin: false
  },
  {
    email: 'tenant@habitra.ke',
    password: 'demo123',
    full_name: 'Test Tenant',
    role: 'tenant',
    is_admin: false
  }
]

async function fixTestAccounts() {
  const passwordHash = await bcrypt.hash('demo123', 10)
  
  for (const account of testAccounts) {
    console.log(`\n📧 Processing: ${account.email}`)
    
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', account.email)
        .maybeSingle()

      if (existingUser) {
        console.log(`  ✓ User exists (ID: ${existingUser.id})`)
        
        // Update to ensure is_active = true and correct password
        const { error: updateError } = await supabase
          .from('app_users')
          .update({
            is_active: true,
            password_hash: passwordHash,
            full_name: account.full_name
          })
          .eq('id', existingUser.id)

        if (updateError) {
          console.log(`  ✗ Update failed: ${updateError.message}`)
        } else {
          console.log(`  ✓ Updated: is_active=true, password reset`)
        }

        // Handle admin accounts
        if (account.is_admin && existingUser.admin_user_id) {
          const { error: adminError } = await supabase
            .from('admin_users')
            .update({
              is_active: true,
              is_master_admin: account.role === 'master_admin'
            })
            .eq('id', existingUser.admin_user_id)

          if (adminError) {
            console.log(`  ✗ Admin update failed: ${adminError.message}`)
          } else {
            console.log(`  ✓ Admin activated: ${account.role}`)
          }
        } else if (account.is_admin && !existingUser.admin_user_id) {
          // Create admin record
          const { data: newAdmin, error: adminInsertError } = await supabase
            .from('admin_users')
            .insert([{
              full_name: account.full_name,
              email: account.email,
              role: account.role,
              is_active: true,
              is_master_admin: account.role === 'master_admin'
            }])
            .select('id')
            .single()

          if (adminInsertError) {
            console.log(`  ✗ Admin creation failed: ${adminInsertError.message}`)
          } else {
            // Link admin to app_user
            await supabase
              .from('app_users')
              .update({ admin_user_id: newAdmin.id })
              .eq('id', existingUser.id)
            console.log(`  ✓ Admin record created and linked`)
          }
        }

        // Handle tenant accounts
        if (account.role === 'tenant' && existingUser.tenant_id) {
          const { error: tenantError } = await supabase
            .from('tenants')
            .update({ verified: true })
            .eq('id', existingUser.tenant_id)

          if (tenantError) {
            console.log(`  ✗ Tenant verification failed: ${tenantError.message}`)
          } else {
            console.log(`  ✓ Tenant verified`)
          }
        } else if (account.role === 'tenant' && !existingUser.tenant_id) {
          // Create tenant record
          const { data: newTenant, error: tenantInsertError } = await supabase
            .from('tenants')
            .insert([{
              full_name: account.full_name,
              email: account.email,
              phone: '0700000000',
              city: 'Nairobi',
              verified: true
            }])
            .select('id')
            .single()

          if (tenantInsertError) {
            console.log(`  ✗ Tenant creation failed: ${tenantInsertError.message}`)
          } else {
            await supabase
              .from('app_users')
              .update({ tenant_id: newTenant.id })
              .eq('id', existingUser.id)
            console.log(`  ✓ Tenant record created and linked`)
          }
        }

        // Handle landlord accounts
        if (account.role === 'landlord' && existingUser.landlord_id) {
          const { error: landlordError } = await supabase
            .from('landlords')
            .update({ verified: true })
            .eq('id', existingUser.landlord_id)

          if (landlordError) {
            console.log(`  ✗ Landlord verification failed: ${landlordError.message}`)
          } else {
            console.log(`  ✓ Landlord verified`)
          }
        } else if (account.role === 'landlord' && !existingUser.landlord_id) {
          // Create landlord record
          const { data: newLandlord, error: landlordInsertError } = await supabase
            .from('landlords')
            .insert([{
              full_name: account.full_name,
              email: account.email,
              phone: '0700000000',
              city: 'Nairobi',
              verified: true
            }])
            .select('id')
            .single()

          if (landlordInsertError) {
            console.log(`  ✗ Landlord creation failed: ${landlordInsertError.message}`)
          } else {
            await supabase
              .from('app_users')
              .update({ landlord_id: newLandlord.id })
              .eq('id', existingUser.id)
            console.log(`  ✓ Landlord record created and linked`)
          }
        }

      } else {
        console.log(`  ℹ User doesn't exist, creating...`)
        
        // Create tenant/landlord record first
        let tenantId = null
        let landlordId = null
        let adminUserId = null

        if (account.role === 'tenant') {
          const { data: newTenant, error } = await supabase
            .from('tenants')
            .insert([{
              full_name: account.full_name,
              email: account.email,
              phone: '0700000000',
              city: 'Nairobi',
              verified: true
            }])
            .select('id')
            .single()

          if (error) {
            console.log(`  ✗ Tenant creation failed: ${error.message}`)
            continue
          }
          tenantId = newTenant.id
          console.log(`  ✓ Tenant record created`)
        }

        if (account.role === 'landlord') {
          const { data: newLandlord, error } = await supabase
            .from('landlords')
            .insert([{
              full_name: account.full_name,
              email: account.email,
              phone: '0700000000',
              city: 'Nairobi',
              verified: true
            }])
            .select('id')
            .single()

          if (error) {
            console.log(`  ✗ Landlord creation failed: ${error.message}`)
            continue
          }
          landlordId = newLandlord.id
          console.log(`  ✓ Landlord record created`)
        }

        if (account.is_admin) {
          const { data: newAdmin, error } = await supabase
            .from('admin_users')
            .insert([{
              full_name: account.full_name,
              email: account.email,
              role: account.role,
              is_active: true,
              is_master_admin: account.role === 'master_admin'
            }])
            .select('id')
            .single()

          if (error) {
            console.log(`  ✗ Admin creation failed: ${error.message}`)
            continue
          }
          adminUserId = newAdmin.id
          console.log(`  ✓ Admin record created`)
        }

        // Create app_user
        const { data: newUser, error: userError } = await supabase
          .from('app_users')
          .insert([{
            full_name: account.full_name,
            email: account.email,
            phone: '0700000000',
            city: 'Nairobi',
            password_hash: passwordHash,
            tenant_id: tenantId,
            landlord_id: landlordId,
            admin_user_id: adminUserId,
            is_active: true
          }])
          .select('id')
          .single()

        if (userError) {
          console.log(`  ✗ User creation failed: ${userError.message}`)
        } else {
          console.log(`  ✓ User created successfully (ID: ${newUser.id})`)
        }
      }

    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`)
    }
  }

  console.log("\n\n✅ Test account fix complete!")
  console.log("\n📝 Test Credentials:")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  testAccounts.forEach(acc => {
    console.log(`${acc.email.padEnd(25)} | demo123 | ${acc.role}`)
  })
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
}

fixTestAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Fatal error:", error)
    process.exit(1)
  })
