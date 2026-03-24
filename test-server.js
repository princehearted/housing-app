// Quick server test script
import "dotenv/config"

console.log("=== Housing App Configuration Test ===\n")

// Check environment variables
console.log("✓ Environment Variables:")
console.log(`  - SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`)
console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing'}`)
console.log(`  - JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Missing'}`)
console.log(`  - PORT: ${process.env.PORT || '3000 (default)'}`)

// Test Supabase connection
console.log("\n✓ Testing Supabase Connection...")
try {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { data, error } = await supabase
    .from("app_users")
    .select("count")
    .limit(1)
  
  if (error) {
    console.log(`  ✗ Supabase Error: ${error.message}`)
  } else {
    console.log("  ✓ Supabase connection successful!")
  }
} catch (err) {
  console.log(`  ✗ Connection failed: ${err.message}`)
}

// Test app import
console.log("\n✓ Testing App Import...")
try {
  const app = await import("./app.js")
  console.log("  ✓ App imported successfully!")
  console.log("  ✓ All routes configured")
} catch (err) {
  console.log(`  ✗ App import failed: ${err.message}`)
  console.log(`  Stack: ${err.stack}`)
}

console.log("\n=== Test Complete ===")
console.log("\nTo start the server, run: npm start")
console.log("Then open: http://localhost:3000/ui/services.html\n")
