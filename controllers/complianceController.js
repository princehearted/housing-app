import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMissingFields } from "../utils/validators.js"

const ADMIN_ROLES = ["admin", "master_admin"]
const LANDLORD_ACTION_TYPES = ["warning", "fine", "termination"]
const TENANT_ACTION_TYPES = ["warning", "termination"]
const APP_USER_ACTION_TYPES = ["warning", "fine", "termination", "suspension"]
const CASE_STATUSES = ["open", "closed", "appealed", "cancelled"]
const WARNING_CHANNELS = ["in_app", "email", "whatsapp_future"]

const getActiveAdminUser = async (adminUserId) => {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, role, is_active")
    .eq("id", adminUserId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.is_active !== true || !ADMIN_ROLES.includes(data.role)) {
    return null
  }

  return data
}

const ensurePropertyOwnedByLandlord = async (propertyId, landlordId) => {
  const { data, error } = await supabase
    .from("properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return !!data && data.owner_id === landlordId
}

const getContractFineDefaults = async (contractId) => {
  if (!contractId) {
    return { fine_amount: 0, termination_fine: 0, contract: null }
  }

  const { data: contract, error } = await supabase
    .from("landlord_platform_contracts")
    .select("id, property_id, landlord_id, fine_amount, termination_fine, status")
    .eq("id", contractId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!contract) {
    return { fine_amount: 0, termination_fine: 0, contract: null }
  }

  return {
    fine_amount: Number(contract.fine_amount) || 0,
    termination_fine: Number(contract.termination_fine) || 0,
    contract
  }
}

const deactivateAppUsersByLandlordId = async (landlordId) => {
  const { error } = await supabase
    .from("app_users")
    .update({ is_active: false })
    .eq("landlord_id", landlordId)

  if (error) {
    throw new Error(error.message)
  }
}

const deactivateAppUsersByTenantId = async (tenantId) => {
  const { error } = await supabase
    .from("app_users")
    .update({ is_active: false })
    .eq("tenant_id", tenantId)

  if (error) {
    throw new Error(error.message)
  }
}

const deactivateAppUserById = async (appUserId) => {
  const { error } = await supabase
    .from("app_users")
    .update({ is_active: false })
    .eq("id", appUserId)

  if (error) {
    throw new Error(error.message)
  }
}

const ensureWarningChannel = (channel) => {
  const resolvedChannel = channel || "in_app"
  if (!WARNING_CHANNELS.includes(resolvedChannel)) {
    return null
  }
  return resolvedChannel
}

const ensureCaseStatus = (status) => CASE_STATUSES.includes(status)

const toAmount = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const createLandlordComplianceCase = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const required = ["landlord_id", "property_id", "violation_type", "violation_details", "action_type"]
  const missing = getMissingFields(req.body, required)

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const {
    landlord_id,
    property_id,
    contract_id,
    violation_type,
    violation_details,
    action_type,
    fine_amount,
    warning_message,
    notes
  } = req.body

  if (!LANDLORD_ACTION_TYPES.includes(action_type)) {
    return res.status(400).json({ error: "action_type must be warning, fine, or termination" })
  }

  const hasAccess = await ensurePropertyOwnedByLandlord(property_id, landlord_id)
  if (!hasAccess) {
    return res.status(400).json({ error: "property_id must belong to landlord_id" })
  }

  const contractDefaults = await getContractFineDefaults(contract_id || null)

  if (contractDefaults.contract) {
    if (contractDefaults.contract.landlord_id !== landlord_id || contractDefaults.contract.property_id !== property_id) {
      return res.status(400).json({ error: "contract_id does not match landlord_id and property_id" })
    }
  }

  let resolvedFineAmount = toAmount(fine_amount)

  if (action_type === "warning") {
    resolvedFineAmount = 0
  }

  if (action_type === "fine" && resolvedFineAmount <= 0) {
    resolvedFineAmount = contractDefaults.fine_amount || 0
    if (resolvedFineAmount <= 0) {
      return res.status(400).json({ error: "fine_amount is required for landlord fine action" })
    }
  }

  if (action_type === "termination" && resolvedFineAmount <= 0) {
    resolvedFineAmount = contractDefaults.termination_fine || 0
    if (resolvedFineAmount <= 0) {
      return res.status(400).json({ error: "termination fine amount is required for landlord termination" })
    }
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("landlord_compliance_cases")
    .insert([
      {
        landlord_id,
        property_id,
        contract_id: contract_id || null,
        violation_type,
        violation_details,
        action_type,
        fine_amount: resolvedFineAmount,
        warning_message: warning_message || null,
        status: "open",
        notes: notes || null,
        created_by_admin_id: adminUserId
      }
    ])
    .select("*")

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  const complianceCase = insertedRows?.[0]

  if (action_type === "termination") {
    if (contract_id) {
      await supabase
        .from("landlord_platform_contracts")
        .update({ status: "terminated" })
        .eq("id", contract_id)
    }

    await supabase
      .from("properties")
      .update({ listing_plan_status: "inactive" })
      .eq("id", property_id)

    await deactivateAppUsersByLandlordId(landlord_id)
  }

  if (warning_message) {
    await supabase
      .from("landlord_warning_logs")
      .insert([
        {
          case_id: complianceCase.id,
          landlord_id,
          channel: "in_app",
          message: warning_message,
          sent_by_admin_id: adminUserId,
          delivery_status: "logged"
        }
      ])
  }

  res.json({
    message: "Landlord compliance case created",
    data: complianceCase
  })
})

export const createTenantComplianceCase = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const required = ["tenant_id", "violation_type", "violation_details", "action_type"]
  const missing = getMissingFields(req.body, required)

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const {
    tenant_id,
    property_id,
    landlord_id,
    violation_type,
    violation_details,
    action_type,
    fine_amount,
    warning_message,
    notes
  } = req.body

  if (!TENANT_ACTION_TYPES.includes(action_type)) {
    return res.status(400).json({ error: "action_type must be warning or termination for tenant cases" })
  }

  let resolvedFineAmount = toAmount(fine_amount)

  if (action_type === "warning" && resolvedFineAmount > 0) {
    return res.status(400).json({ error: "Tenant fine is only allowed after termination" })
  }

  if (action_type === "warning") {
    resolvedFineAmount = 0
  }

  if (action_type === "termination" && resolvedFineAmount <= 0) {
    return res.status(400).json({ error: "Termination fine amount is required for tenant termination" })
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("tenant_compliance_cases")
    .insert([
      {
        tenant_id,
        property_id: property_id || null,
        landlord_id: landlord_id || null,
        violation_type,
        violation_details,
        action_type,
        fine_amount: resolvedFineAmount,
        warning_message: warning_message || null,
        status: "open",
        notes: notes || null,
        created_by_admin_id: adminUserId
      }
    ])
    .select("*")

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  const complianceCase = insertedRows?.[0]

  if (action_type === "termination") {
    await deactivateAppUsersByTenantId(tenant_id)
  }

  if (warning_message) {
    await supabase
      .from("tenant_warning_logs")
      .insert([
        {
          case_id: complianceCase.id,
          tenant_id,
          channel: "in_app",
          message: warning_message,
          sent_by_admin_id: adminUserId,
          delivery_status: "logged"
        }
      ])
  }

  res.json({
    message: "Tenant compliance case created",
    data: complianceCase
  })
})

export const createAppUserComplianceCase = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const required = ["app_user_id", "violation_type", "violation_details", "action_type"]
  const missing = getMissingFields(req.body, required)

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const {
    app_user_id,
    role_context,
    violation_type,
    violation_details,
    action_type,
    fine_amount,
    warning_message,
    notes
  } = req.body

  if (!APP_USER_ACTION_TYPES.includes(action_type)) {
    return res.status(400).json({ error: "action_type must be warning, fine, termination, or suspension" })
  }

  const resolvedRoleContext = role_context || "global"
  if (!["tenant", "landlord", "both", "global"].includes(resolvedRoleContext)) {
    return res.status(400).json({ error: "role_context must be tenant, landlord, both, or global" })
  }

  let resolvedFineAmount = toAmount(fine_amount)

  if (action_type === "warning") {
    resolvedFineAmount = 0
  }

  if (action_type === "fine" && resolvedFineAmount <= 0) {
    return res.status(400).json({ error: "fine_amount is required for app user fine action" })
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("app_user_compliance_cases")
    .insert([
      {
        app_user_id,
        role_context: resolvedRoleContext,
        violation_type,
        violation_details,
        action_type,
        fine_amount: resolvedFineAmount,
        warning_message: warning_message || null,
        status: "open",
        notes: notes || null,
        created_by_admin_id: adminUserId
      }
    ])
    .select("*")

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  const complianceCase = insertedRows?.[0]

  if (action_type === "termination" || action_type === "suspension") {
    await deactivateAppUserById(app_user_id)
  }

  if (warning_message) {
    await supabase
      .from("app_user_warning_logs")
      .insert([
        {
          case_id: complianceCase.id,
          app_user_id,
          channel: "in_app",
          message: warning_message,
          sent_by_admin_id: adminUserId,
          delivery_status: "logged"
        }
      ])
  }

  res.json({
    message: "App user compliance case created",
    data: complianceCase
  })
})

export const sendLandlordWarning = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const required = ["case_id", "message"]
  const missing = getMissingFields(req.body, required)

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const { case_id, message, channel } = req.body
  const resolvedChannel = ensureWarningChannel(channel)

  if (!resolvedChannel) {
    return res.status(400).json({ error: "channel must be in_app, email, or whatsapp_future" })
  }

  const { data: complianceCase, error: caseError } = await supabase
    .from("landlord_compliance_cases")
    .select("id, landlord_id")
    .eq("id", case_id)
    .maybeSingle()

  if (caseError) {
    return res.status(400).json({ error: caseError.message })
  }

  if (!complianceCase) {
    return res.status(404).json({ error: "Compliance case not found" })
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("landlord_warning_logs")
    .insert([
      {
        case_id,
        landlord_id: complianceCase.landlord_id,
        channel: resolvedChannel,
        message,
        sent_by_admin_id: adminUserId,
        delivery_status: "logged"
      }
    ])
    .select("*")

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  res.json({
    message: "Landlord warning logged",
    data: insertedRows?.[0] || null
  })
})

export const sendTenantWarning = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const required = ["case_id", "message"]
  const missing = getMissingFields(req.body, required)

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const { case_id, message, channel } = req.body
  const resolvedChannel = ensureWarningChannel(channel)

  if (!resolvedChannel) {
    return res.status(400).json({ error: "channel must be in_app, email, or whatsapp_future" })
  }

  const { data: complianceCase, error: caseError } = await supabase
    .from("tenant_compliance_cases")
    .select("id, tenant_id")
    .eq("id", case_id)
    .maybeSingle()

  if (caseError) {
    return res.status(400).json({ error: caseError.message })
  }

  if (!complianceCase) {
    return res.status(404).json({ error: "Compliance case not found" })
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("tenant_warning_logs")
    .insert([
      {
        case_id,
        tenant_id: complianceCase.tenant_id,
        channel: resolvedChannel,
        message,
        sent_by_admin_id: adminUserId,
        delivery_status: "logged"
      }
    ])
    .select("*")

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  res.json({
    message: "Tenant warning logged",
    data: insertedRows?.[0] || null
  })
})

export const sendAppUserWarning = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const required = ["case_id", "message"]
  const missing = getMissingFields(req.body, required)

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const { case_id, message, channel } = req.body
  const resolvedChannel = ensureWarningChannel(channel)

  if (!resolvedChannel) {
    return res.status(400).json({ error: "channel must be in_app, email, or whatsapp_future" })
  }

  const { data: complianceCase, error: caseError } = await supabase
    .from("app_user_compliance_cases")
    .select("id, app_user_id")
    .eq("id", case_id)
    .maybeSingle()

  if (caseError) {
    return res.status(400).json({ error: caseError.message })
  }

  if (!complianceCase) {
    return res.status(404).json({ error: "Compliance case not found" })
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("app_user_warning_logs")
    .insert([
      {
        case_id,
        app_user_id: complianceCase.app_user_id,
        channel: resolvedChannel,
        message,
        sent_by_admin_id: adminUserId,
        delivery_status: "logged"
      }
    ])
    .select("*")

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  res.json({
    message: "App user warning logged",
    data: insertedRows?.[0] || null
  })
})

export const updateLandlordComplianceCaseStatus = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { case_id, status, notes } = req.body

  if (!adminUserId || !case_id || !status) {
    return res.status(400).json({ error: "case_id, status required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  if (!ensureCaseStatus(status)) {
    return res.status(400).json({ error: "status must be open, closed, appealed, or cancelled" })
  }

  const updates = {
    status,
    notes: notes || null,
    resolved_at: status === "closed" ? new Date().toISOString() : null
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("landlord_compliance_cases")
    .update(updates)
    .eq("id", case_id)
    .select("*")

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  if (!updatedRows || updatedRows.length === 0) {
    return res.status(404).json({ error: "Compliance case not found" })
  }

  res.json({
    message: "Landlord compliance case status updated",
    data: updatedRows[0]
  })
})

export const updateTenantComplianceCaseStatus = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { case_id, status, notes } = req.body

  if (!adminUserId || !case_id || !status) {
    return res.status(400).json({ error: "case_id, status required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  if (!ensureCaseStatus(status)) {
    return res.status(400).json({ error: "status must be open, closed, appealed, or cancelled" })
  }

  const updates = {
    status,
    notes: notes || null,
    resolved_at: status === "closed" ? new Date().toISOString() : null
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("tenant_compliance_cases")
    .update(updates)
    .eq("id", case_id)
    .select("*")

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  if (!updatedRows || updatedRows.length === 0) {
    return res.status(404).json({ error: "Compliance case not found" })
  }

  res.json({
    message: "Tenant compliance case status updated",
    data: updatedRows[0]
  })
})

export const updateAppUserComplianceCaseStatus = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { case_id, status, notes } = req.body

  if (!adminUserId || !case_id || !status) {
    return res.status(400).json({ error: "case_id, status required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  if (!ensureCaseStatus(status)) {
    return res.status(400).json({ error: "status must be open, closed, appealed, or cancelled" })
  }

  const updates = {
    status,
    notes: notes || null,
    resolved_at: status === "closed" ? new Date().toISOString() : null
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("app_user_compliance_cases")
    .update(updates)
    .eq("id", case_id)
    .select("*")

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  if (!updatedRows || updatedRows.length === 0) {
    return res.status(404).json({ error: "Compliance case not found" })
  }

  res.json({
    message: "App user compliance case status updated",
    data: updatedRows[0]
  })
})

export const listAdminLandlordComplianceCases = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { status, landlord_id, property_id, limit } = req.query

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  let query = supabase
    .from("landlord_compliance_cases")
    .select("*, landlords:landlord_id(id, full_name, email), properties:property_id(id, title, city), contracts:contract_id(id, contract_type, status)")
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (status) query = query.eq("status", status)
  if (landlord_id) query = query.eq("landlord_id", landlord_id)
  if (property_id) query = query.eq("property_id", property_id)

  const { data, error } = await query

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, cases: data || [] })
})

export const listAdminTenantComplianceCases = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { status, tenant_id, property_id, limit } = req.query

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  let query = supabase
    .from("tenant_compliance_cases")
    .select("*, tenants:tenant_id(id, full_name, email), properties:property_id(id, title, city), landlords:landlord_id(id, full_name, email)")
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (status) query = query.eq("status", status)
  if (tenant_id) query = query.eq("tenant_id", tenant_id)
  if (property_id) query = query.eq("property_id", property_id)

  const { data, error } = await query

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, cases: data || [] })
})

export const listAdminAppUserComplianceCases = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { status, app_user_id, role_context, limit } = req.query

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  let query = supabase
    .from("app_user_compliance_cases")
    .select("*, app_users:app_user_id(id, full_name, email, is_active)")
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (status) query = query.eq("status", status)
  if (app_user_id) query = query.eq("app_user_id", app_user_id)
  if (role_context) query = query.eq("role_context", role_context)

  const { data, error } = await query

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, cases: data || [] })
})

export const listLandlordComplianceCases = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { status, limit } = req.query

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  let query = supabase
    .from("landlord_compliance_cases")
    .select("*")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (status) query = query.eq("status", status)

  const { data, error } = await query

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, cases: data || [] })
})

export const listTenantComplianceCases = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id
  const { status, limit } = req.query

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  let query = supabase
    .from("tenant_compliance_cases")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (status) query = query.eq("status", status)

  const { data, error } = await query

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, cases: data || [] })
})

export const listMyAppUserComplianceCases = asyncHandler(async (req, res) => {
  const appUserId = req.auth?.sub
  const { status, limit } = req.query

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  let query = supabase
    .from("app_user_compliance_cases")
    .select("*")
    .eq("app_user_id", appUserId)
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (status) query = query.eq("status", status)

  const { data, error } = await query

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, cases: data || [] })
})

export const listLandlordWarnings = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { limit } = req.query

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  const { data, error } = await supabase
    .from("landlord_warning_logs")
    .select("*")
    .eq("landlord_id", landlordId)
    .order("sent_at", { ascending: false })
    .limit(safeLimit)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, warnings: data || [] })
})

export const listTenantWarnings = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id
  const { limit } = req.query

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  const { data, error } = await supabase
    .from("tenant_warning_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sent_at", { ascending: false })
    .limit(safeLimit)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, warnings: data || [] })
})

export const listMyAppUserWarnings = asyncHandler(async (req, res) => {
  const appUserId = req.auth?.sub
  const { limit } = req.query

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  const { data, error } = await supabase
    .from("app_user_warning_logs")
    .select("*")
    .eq("app_user_id", appUserId)
    .order("sent_at", { ascending: false })
    .limit(safeLimit)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ count: data?.length || 0, warnings: data || [] })
})
