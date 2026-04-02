import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function traceLogins() {
  console.log("--- Habitra Login Trace ---");
  console.log("Connecting to:", process.env.SUPABASE_URL);

  try {
    // Let's just fetch everything to see what we get
    const { data: users, error } = await supabase
      .from("app_users")
      .select(`
        email,
        full_name,
        is_active,
        admin_user_id,
        landlord_id,
        tenant_id,
        admin_users:admin_user_id(*),
        landlords:landlord_id(verified),
        tenants:tenant_id(verified)
      `);

    if (error) throw error;

    if (!users || users.length === 0) {
      console.log("No users found in app_users table.");
      return;
    }

    const tableData = users.map(u => {
      let role = "NO ROLE";
      let verified = "N/A";

      if (u.admin_user_id) {
        const adminData = u.admin_users || {};
        const adminRole = adminData.is_master_admin ? "master_admin" : (adminData.role || '?');
        role = `ADMIN (${adminRole})`;
        verified = adminData.is_active ? "YES" : "NO";
      } else if (u.landlord_id) {
        role = "LANDLORD";
        verified = u.landlords?.verified ? "YES" : "NO";
      } else if (u.tenant_id) {
        role = "TENANT";
        verified = u.tenants?.verified ? "YES" : "NO";
      }

      return {
        Email: u.email,
        Name: u.full_name,
        Active: u.is_active ? "YES" : "NO",
        Role: role,
        Verified: verified
      };
    });

    console.table(tableData);

    console.log("\n--- Debug Checklist ---");
    console.log("1. Does the email match exactly (no spaces)?");
    console.log("2. Is 'Active' YES? (If NO, login might fail depending on your settings)");
    console.log("3. Is 'Role' correct? (If NO, you won't get the right dashboard)");

  } catch (err) {
    console.error("Error tracing logins:", err.message);
  }
}

traceLogins();
