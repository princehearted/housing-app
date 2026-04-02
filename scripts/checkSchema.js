import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log("--- Checking admin_users schema ---");
  console.log("URL:", process.env.SUPABASE_URL);

  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'admin_users' });
  
  if (error) {
    console.error("RPC Error:", error.message);
    // fallback to select *
    const { data: selectData, error: selectError } = await supabase
      .from("admin_users")
      .select("*")
      .limit(1);
      
    if (selectError) {
      console.error("Select Error:", selectError.message);
    } else if (selectData && selectData.length > 0) {
      console.log("Columns:", Object.keys(selectData[0]));
    } else {
      console.log("No data in admin_users.");
    }
  } else {
    console.log("Columns:", data);
  }
}

checkSchema();
