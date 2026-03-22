import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getActiveAdminUser = async (adminUserId) => {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, role, is_active, is_master_admin")
    .eq("id", adminUserId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.is_active !== true) {
    return null
  }

  const effectiveRole = data.is_master_admin ? "master_admin" : data.role
  return { ...data, role: effectiveRole }
}

const writeAdminLog = async ({
  adminUserId,
  actionType,
  targetTable,
  targetId,
  decision,
  notes
}) => {
  const { error } = await supabase
    .from("admin_action_logs")
    .insert([
      {
        admin_user_id: adminUserId,
        action_type: actionType,
        target_table: targetTable,
        target_id: targetId,
        decision: decision || null,
        notes: notes || null
      }
    ])

  if (error) {
    throw new Error(error.message)
  }
}

export const verifyProperty = asyncHandler(async (req, res) => {
  const admin_user_id = req.auth?.admin_user_id
  const { property_id, notes } = req.body

  if (!admin_user_id || !property_id) {
    return res.status(400).json({ error: "property_id required" })
  }

  const adminUser = await getActiveAdminUser(admin_user_id)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const { data: property, error: propertySelectError } = await supabase
    .from("properties")
    .select("id, title")
    .eq("id", property_id)
    .maybeSingle()

  if (propertySelectError) {
    return res.status(400).json({ error: propertySelectError.message })
  }

  if (!property) {
    return res.status(404).json({ error: "Property not found" })
  }

  const { data: updatedRows, error } = await supabase
    .from("properties")
    .update({ verification_status: "verified" })
    .eq("id", property_id)
    .select("id, title, verification_status")

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  await writeAdminLog({
    adminUserId: admin_user_id,
    actionType: "verify_property",
    targetTable: "properties",
    targetId: property_id,
    decision: "verified",
    notes
  })

  res.json({
    message: "Property verified & visible",
    property: updatedRows?.[0] || null
  })
})

export const verifyTenant = asyncHandler(async (req, res) => {
  const admin_user_id = req.auth?.admin_user_id
  const { tenant_id, decision, notes } = req.body

  if (!admin_user_id || !tenant_id || !decision) {
    return res.status(400).json({ error: "tenant_id, decision required" })
  }

  if (!["verified", "rejected"].includes(decision)) {
    return res.status(400).json({ error: "decision must be verified or rejected" })
  }

  const adminUser = await getActiveAdminUser(admin_user_id)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenant_id)
    .maybeSingle()

  if (tenantError) {
    return res.status(400).json({ error: tenantError.message })
  }

  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found" })
  }

  const isVerified = decision === "verified"

  const { error: tenantUpdateError } = await supabase
    .from("tenants")
    .update({ verified: isVerified })
    .eq("id", tenant_id)

  if (tenantUpdateError) {
    return res.status(400).json({ error: tenantUpdateError.message })
  }

  const { error: appUserUpdateError } = await supabase
    .from("app_users")
    .update({ is_active: isVerified })
    .eq("tenant_id", tenant_id)

  if (appUserUpdateError) {
    return res.status(400).json({ error: appUserUpdateError.message })
  }

  await writeAdminLog({
    adminUserId: admin_user_id,
    actionType: "verify_tenant",
    targetTable: "tenants",
    targetId: tenant_id,
    decision,
    notes
  })

  res.json({
    message: `Tenant ${decision}`,
    tenant_id,
    app_access_active: isVerified
  })
})

export const reviewLandlordDocument = asyncHandler(async (req, res) => {
  const admin_user_id = req.auth?.admin_user_id
  const { document_id, decision, notes } = req.body

  if (!admin_user_id || !document_id || !decision) {
    return res.status(400).json({ error: "document_id, decision required" })
  }

  if (!["verified", "rejected"].includes(decision)) {
    return res.status(400).json({ error: "decision must be verified or rejected" })
  }

  const adminUser = await getActiveAdminUser(admin_user_id)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const { data: documentRow, error: documentSelectError } = await supabase
    .from("landlord_verification_documents")
    .select("id, landlord_id")
    .eq("id", document_id)
    .maybeSingle()

  if (documentSelectError) {
    return res.status(400).json({ error: documentSelectError.message })
  }

  if (!documentRow) {
    return res.status(404).json({ error: "Verification document not found" })
  }

  const reviewedAt = new Date().toISOString()

  const { data: updatedRows, error: updateError } = await supabase
    .from("landlord_verification_documents")
    .update({
      verification_status: decision,
      reviewed_by_admin_id: admin_user_id,
      reviewed_at: reviewedAt,
      review_notes: notes || null
    })
    .eq("id", document_id)
    .select()

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  const { error: landlordUpdateError } = await supabase
    .from("landlords")
    .update({ verified: decision === "verified" })
    .eq("id", documentRow.landlord_id)

  if (landlordUpdateError) {
    return res.status(400).json({ error: landlordUpdateError.message })
  }

  await writeAdminLog({
    adminUserId: admin_user_id,
    actionType: "review_landlord_document",
    targetTable: "landlord_verification_documents",
    targetId: document_id,
    decision,
    notes
  })

  res.json({
    message: `Landlord document ${decision}`,
    data: updatedRows?.[0] || null
  })
})

export const reviewPropertyDocument = asyncHandler(async (req, res) => {
  const admin_user_id = req.auth?.admin_user_id
  const { document_id, decision, notes } = req.body

  if (!admin_user_id || !document_id || !decision) {
    return res.status(400).json({ error: "document_id, decision required" })
  }

  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ error: "decision must be approved or rejected" })
  }

  const adminUser = await getActiveAdminUser(admin_user_id)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const { data: documentRow, error: documentSelectError } = await supabase
    .from("property_documents_db")
    .select("id, property_id")
    .eq("id", document_id)
    .maybeSingle()

  if (documentSelectError) {
    return res.status(400).json({ error: documentSelectError.message })
  }

  if (!documentRow) {
    return res.status(404).json({ error: "Property document not found" })
  }

  const reviewedAt = new Date().toISOString()

  const { data: updatedRows, error: updateError } = await supabase
    .from("property_documents_db")
    .update({
      review_status: decision,
      reviewed_by_admin_id: admin_user_id,
      reviewed_at: reviewedAt,
      review_notes: notes || null
    })
    .eq("id", document_id)
    .select()

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  const propertyDecision = decision === "approved" ? "verified" : "rejected"
  const { error: propertyUpdateError } = await supabase
    .from("properties")
    .update({ verification_status: propertyDecision })
    .eq("id", documentRow.property_id)

  if (propertyUpdateError) {
    return res.status(400).json({ error: propertyUpdateError.message })
  }

  await writeAdminLog({
    adminUserId: admin_user_id,
    actionType: "review_property_document",
    targetTable: "property_documents_db",
    targetId: document_id,
    decision,
    notes
  })

  res.json({
    message: `Property document ${decision}`,
    property_status: propertyDecision,
    data: updatedRows?.[0] || null
  })
})

export const masterOverrideProperty = asyncHandler(async (req, res) => {
  const admin_user_id = req.auth?.admin_user_id
  const { property_id, decision, notes } = req.body

  if (!admin_user_id || !property_id || !decision) {
    return res.status(400).json({ error: "property_id, decision required" })
  }

  if (!["verified", "rejected", "pending"].includes(decision)) {
    return res.status(400).json({ error: "decision must be verified, rejected, or pending" })
  }

  const adminUser = await getActiveAdminUser(admin_user_id)
  if (!adminUser || adminUser.role !== "master_admin") {
    return res.status(403).json({ error: "Only master_admin can override property decisions" })
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("properties")
    .update({ verification_status: decision })
    .eq("id", property_id)
    .select("id, title, verification_status")

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  if (!updatedRows || updatedRows.length === 0) {
    return res.status(404).json({ error: "Property not found" })
  }

  await writeAdminLog({
    adminUserId: admin_user_id,
    actionType: "override_property_decision",
    targetTable: "properties",
    targetId: property_id,
    decision,
    notes
  })

  res.json({
    message: "Master override applied",
    property: updatedRows[0]
  })
})

export const listDeletionRequests = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("app_users")
    .select("id, full_name, email, phone, city, deletion_requested, deletion_request_notes")
    .eq("deletion_requested", true)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, requests: data || [] })
})

export const approveDeletion = asyncHandler(async (req, res) => {
  const admin_user_id = req.auth?.admin_user_id
  const { user_id } = req.body

  if (!user_id) {
    return res.status(400).json({ error: "user_id required" })
  }

  const { error } = await supabase
    .from("app_users")
    .delete()
    .eq("id", user_id)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ message: "Account deleted successfully." })
})

export const getAdminQueue = asyncHandler(async (req, res) => {
  const admin_user_id = req.auth?.admin_user_id
  const rawLimit = Number.parseInt(String(req.query.limit || "20"), 10)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20

  const adminUser = await getActiveAdminUser(admin_user_id)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const [
    pendingTenantsResult,
    pendingLandlordDocsResult,
    pendingPropertyDocsResult,
    pendingPropertiesResult
  ] = await Promise.all([
    supabase
      .from("app_users")
      .select("id, full_name, email, phone, city, is_active, created_at, tenant_id, tenants:tenant_id(id, verified)")
      .is("admin_user_id", null)
      .eq("is_active", false)
      .not("tenant_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(limit),

    supabase
      .from("landlord_verification_documents")
      .select("id, landlord_id, document_type, document_url, verification_status, uploaded_at, landlords:landlord_id(id, full_name, email, phone, city)")
      .eq("verification_status", "pending")
      .order("uploaded_at", { ascending: true })
      .limit(limit),

    supabase
      .from("property_documents_db")
      .select("id, property_id, document_type, file_url, created_at, review_status, properties:property_id(id, title, city, address, owner_id)")
      .or("review_status.is.null,review_status.eq.pending")
      .order("created_at", { ascending: true })
      .limit(limit),

    supabase
      .from("properties")
      .select("id, owner_id, title, city, address, verification_status, created_at")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit)
  ])

  if (pendingTenantsResult.error) {
    return res.status(400).json({ error: pendingTenantsResult.error.message })
  }

  if (pendingLandlordDocsResult.error) {
    return res.status(400).json({ error: pendingLandlordDocsResult.error.message })
  }

  if (pendingPropertyDocsResult.error) {
    return res.status(400).json({ error: pendingPropertyDocsResult.error.message })
  }

  if (pendingPropertiesResult.error) {
    return res.status(400).json({ error: pendingPropertiesResult.error.message })
  }

  res.json({
    queue: {
      pending_tenants: pendingTenantsResult.data || [],
      pending_landlord_documents: pendingLandlordDocsResult.data || [],
      pending_property_documents: pendingPropertyDocsResult.data || [],
      pending_properties: pendingPropertiesResult.data || []
    },
    counts: {
      pending_tenants: pendingTenantsResult.data?.length || 0,
      pending_landlord_documents: pendingLandlordDocsResult.data?.length || 0,
      pending_property_documents: pendingPropertyDocsResult.data?.length || 0,
      pending_properties: pendingPropertiesResult.data?.length || 0
    }
  })
})

export const getAdmins = asyncHandler(async (req, res) => {
  const { data: admins, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  res.json({ admins })
})

export const toggleAdminStatus = asyncHandler(async (req, res) => {
  const { admin_id, is_active } = req.body
  const { error } = await supabase
    .from("admin_users")
    .update({ is_active })
    .eq("id", admin_id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: `Admin ${is_active ? 'enabled' : 'disabled'}` })
})

export const promoteUserToAdmin = asyncHandler(async (req, res) => {
  const { app_user_id, role } = req.body
  
  // 1. Create admin_users entry
  const { data: appUser } = await supabase.from("app_users").select("full_name, email").eq("id", app_user_id).single()
  
  const { data: newAdmin, error: adminError } = await supabase
    .from("admin_users")
    .insert([{ 
      full_name: appUser.full_name, 
      email: appUser.email, 
      role: role || 'admin',
      is_master_admin: role === 'master_admin'
    }])
    .select()
    .single()

  if (adminError) return res.status(400).json({ error: adminError.message })

  // 2. Link back to app_users
  const { error: linkError } = await supabase
    .from("app_users")
    .update({ admin_user_id: newAdmin.id })
    .eq("id", app_user_id)

  if (linkError) return res.status(400).json({ error: linkError.message })

  res.json({ message: "User promoted to admin", admin: newAdmin })
})

export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query
  const { data: users, error } = await supabase
    .from("app_users")
    .select("id, full_name, email, admin_user_id, landlord_id, tenant_id")
    .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
    .limit(10)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ users })
})

