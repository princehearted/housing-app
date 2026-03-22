import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMissingFields } from "../utils/validators.js"

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-env"
const JWT_EXPIRES_IN = "7d"

const buildTokenPayload = async (appUser) => {
  let adminRole = null

  if (appUser.admin_user_id) {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role, is_master_admin")
      .eq("id", appUser.admin_user_id)
      .maybeSingle()

    if (adminUser?.is_master_admin) {
      adminRole = "master_admin"
    } else {
      adminRole = adminUser?.role || null
    }
  }

  return {
    sub: appUser.id,
    tenant_id: appUser.tenant_id,
    landlord_id: appUser.landlord_id,
    admin_user_id: appUser.admin_user_id,
    admin_role: adminRole
  }
}

const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

const uploadToSupabaseStorage = async (fileBuffer, fileName, bucket) => {
  if (!fileBuffer) return null
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`ids/${Date.now()}-${fileName}`, fileBuffer, {
        contentType: fileBuffer.contentType || "image/jpeg"
      })
    
    if (error) {
      console.error("Storage upload error:", error)
      return null
    }
    
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    return urlData.publicUrl
  } catch (err) {
    console.error("Upload error:", err)
    return null
  }
}

export const register = asyncHandler(async (req, res) => {
  const body = req.body || {}
  const files = req.files || {}
  
  const required = ["full_name", "email", "phone", "city", "password"]
  const missing = getMissingFields(body, required)

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const { full_name, email, phone, city, password, role } = body

  const normalizedEmail = String(email).trim().toLowerCase()

  const { data: existingUser, error: existingUserError } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (existingUserError) {
    return res.status(400).json({ error: existingUserError.message })
  }

  if (existingUser) {
    return res.status(409).json({ error: "Email already registered" })
  }

  let tenantId = null
  let landlordId = null

  let idFrontUrl = null
  let idBackUrl = null

  // Upload ID images if provided
  if (files.id_front && files.id_front[0]) {
    const frontFile = files.id_front[0]
    idFrontUrl = await uploadToSupabaseStorage(frontFile.buffer, frontFile.originalname, "user_documents")
  }
  
  if (files.id_back && files.id_back[0]) {
    const backFile = files.id_back[0]
    idBackUrl = await uploadToSupabaseStorage(backFile.buffer, backFile.originalname, "user_documents")
  }

  const userData = { 
    full_name, 
    email: normalizedEmail, 
    phone, 
    city, 
    verified: false 
  }
  
  if (idFrontUrl) userData.id_front_url = idFrontUrl
  if (idBackUrl) userData.id_back_url = idBackUrl

  if (role === "landlord") {
    const { data: existingLandlord } = await supabase
      .from("landlords")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (existingLandlord?.id) {
      landlordId = existingLandlord.id
      await supabase.from("landlords").update(userData).eq("id", landlordId)
    } else {
      const { data: insertedLandlords, error: landlordInsertError } = await supabase
        .from("landlords")
        .insert([userData])
        .select("id")

      if (landlordInsertError) return res.status(400).json({ error: landlordInsertError.message })
      landlordId = insertedLandlords?.[0]?.id || null
    }
  } else {
    // Default to tenant
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (existingTenant?.id) {
      tenantId = existingTenant.id
      await supabase.from("tenants").update(userData).eq("id", tenantId)
    } else {
      const { data: insertedTenants, error: tenantInsertError } = await supabase
        .from("tenants")
        .insert([userData])
        .select("id")

      if (tenantInsertError) return res.status(400).json({ error: tenantInsertError.message })
      tenantId = insertedTenants?.[0]?.id || null
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const { data: insertedUsers, error: userInsertError } = await supabase
    .from("app_users")
    .insert([
      {
        full_name,
        email: normalizedEmail,
        phone,
        city,
        password_hash: passwordHash,
        tenant_id: tenantId,
        landlord_id: landlordId,
        is_active: false
      }
    ])
    .select("id, full_name, email, phone, city, tenant_id, landlord_id, admin_user_id, is_active")

  if (userInsertError) {
    return res.status(400).json({ error: userInsertError.message })
  }

  res.json({
    message: "Account created. Pending admin verification.",
    user: insertedUsers?.[0] || null
  })
})

export const login = asyncHandler(async (req, res) => {
  const required = ["email", "password"]
  const missing = getMissingFields(req.body, required)

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const { email, password } = req.body
  const normalizedEmail = String(email).trim().toLowerCase()
  console.log(`[Login Attempt] Email: ${normalizedEmail}`)

  const { data: appUser, error: userError } = await supabase
    .from("app_users")
    .select("id, full_name, email, phone, city, password_hash, tenant_id, landlord_id, admin_user_id, is_active")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (userError) {
    console.error(`[Login Error] Supabase Error:`, userError)
    return res.status(400).json({ error: userError.message })
  }

  if (!appUser) {
    console.warn(`[Login Failed] No user found with email: ${normalizedEmail}`)
    return res.status(401).json({ error: "Invalid credentials" })
  }

  const isValidPassword = await bcrypt.compare(password, appUser.password_hash)
  console.log(`[Login] Bcrypt check: ${isValidPassword}`)
  
  // Demo mode: accept "demo123" for test accounts
  const isTestAccount = [
    'master@habitra.ke',
    'admin@habitra.ke',
    'landlord@habitra.ke',
    'tenant@habitra.ke',
    'prince.master@housingapp.ke',
    'test@habitra.ke',
    'landlord@test.com'
  ].includes(normalizedEmail)
  const isDemoPassword = password === "demo123" && isTestAccount
  console.log(`[Login] Demo check: ${isDemoPassword}`)
  
  if (!isValidPassword && !isDemoPassword) {
    console.warn(`[Login Failed] Password mismatch for email: ${normalizedEmail}`)
    return res.status(401).json({ error: "Invalid credentials" })
  }

  let adminRole = null
  if (appUser.admin_user_id) {
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("role, is_active, is_master_admin")
      .eq("id", appUser.admin_user_id)
      .maybeSingle()

    if (adminError) {
      console.error(`[Login Error] Admin lookup failed:`, adminError)
      return res.status(400).json({ error: adminError.message })
    }

    if (adminUser?.is_active === true) {
      if (adminUser.is_master_admin) {
        adminRole = "master_admin"
      } else {
        adminRole = adminUser.role
      }
    }
  }

  console.log(`[Login Success] User: ${appUser.full_name}, Role: ${adminRole || 'user'}`)

  if (!adminRole) {
    // Allow login even if not verified - they just can't book until verified
    // Users can still browse properties without login
  }

  const payload = await buildTokenPayload(appUser)
  const token = signToken(payload)

  const { password_hash, ...safeUser } = appUser

  let isVerified = false
  if (appUser.tenant_id) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("verified")
      .eq("id", appUser.tenant_id)
      .maybeSingle()
    isVerified = tenant?.verified === true
  }

  res.json({
    message: "Login successful",
    token,
    user: { ...safeUser, is_verified: isVerified, role: adminRole }
  })
})

export const requestDeletion = asyncHandler(async (req, res) => {
  const appUserId = req.auth?.sub
  const { notes } = req.body

  const { error } = await supabase
    .from("app_users")
    .update({ deletion_requested: true, deletion_request_notes: notes || "Requested via user dashboard" })
    .eq("id", appUserId)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ message: "Deletion request submitted. Admin will contact you." })
})

export const me = asyncHandler(async (req, res) => {
  const appUserId = req.auth?.sub

  const { data: appUser, error } = await supabase
    .from("app_users")
    .select("id, full_name, email, phone, city, tenant_id, landlord_id, admin_user_id, is_active, created_at")
    .eq("id", appUserId)
    .maybeSingle()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  if (!appUser) {
    return res.status(404).json({ error: "User not found" })
  }

  res.json({ user: appUser })
})

export const activateLandlord = asyncHandler(async (req, res) => {
  const appUserId = req.auth?.sub
  const { full_name, phone, city } = req.body

  const { data: appUser, error: appUserError } = await supabase
    .from("app_users")
    .select("id, email, full_name, phone, city, landlord_id, tenant_id")
    .eq("id", appUserId)
    .maybeSingle()

  if (appUserError) {
    return res.status(400).json({ error: appUserError.message })
  }

  if (!appUser) {
    return res.status(404).json({ error: "User not found" })
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("verified")
    .eq("id", appUser.tenant_id)
    .maybeSingle()

  if (tenantError) {
    return res.status(400).json({ error: tenantError.message })
  }

  if (!tenant || tenant.verified !== true) {
    return res.status(403).json({ error: "Tenant verification required before landlord activation" })
  }

  if (appUser.landlord_id) {
    return res.json({ message: "Landlord profile already active", landlord_id: appUser.landlord_id })
  }

  const landlordPayload = {
    full_name: full_name || appUser.full_name,
    email: appUser.email,
    phone: phone || appUser.phone,
    city: city || appUser.city,
    verified: false
  }

  const { data: insertedLandlords, error: landlordInsertError } = await supabase
    .from("landlords")
    .insert([landlordPayload])
    .select("id")

  if (landlordInsertError) {
    return res.status(400).json({ error: landlordInsertError.message })
  }

  const landlordId = insertedLandlords?.[0]?.id

  const { error: updateUserError } = await supabase
    .from("app_users")
    .update({ landlord_id: landlordId })
    .eq("id", appUser.id)

  if (updateUserError) {
    return res.status(400).json({ error: updateUserError.message })
  }

  const payload = await buildTokenPayload({
    ...appUser,
    landlord_id: landlordId,
    admin_user_id: req.auth?.admin_user_id || null,
    tenant_id: appUser.tenant_id
  })

  const token = signToken(payload)

  res.json({
    message: "Landlord profile activated",
    landlord_id: landlordId,
    token
  })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const appUserId = req.auth?.sub
  const { name, phone, city } = req.body

  const { data: appUser, error } = await supabase
    .from("app_users")
    .update({
      full_name: name,
      phone,
      city
    })
    .eq("id", appUserId)
    .select("id, full_name, email, phone, city, tenant_id, landlord_id, admin_user_id, is_active")
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Profile updated",
    user: appUser
  })
})

export const changePassword = asyncHandler(async (req, res) => {
  const appUserId = req.auth?.sub
  const { current_password, new_password } = req.body

  if (!current_password || !new_password) {
    return res.status(400).json({ error: "Current and new password required" })
  }

  const { data: appUser, error: userError } = await supabase
    .from("app_users")
    .select("password_hash")
    .eq("id", appUserId)
    .maybeSingle()

  if (userError) {
    return res.status(400).json({ error: userError.message })
  }

  const isValidPassword = await bcrypt.compare(current_password, appUser.password_hash)
  if (!isValidPassword) {
    return res.status(401).json({ error: "Current password is incorrect" })
  }

  const newPasswordHash = await bcrypt.hash(new_password, 10)

  const { error: updateError } = await supabase
    .from("app_users")
    .update({ password_hash: newPasswordHash })
    .eq("id", appUserId)

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  res.json({ message: "Password updated successfully" })
})
