import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMissingFields } from "../utils/validators.js"

const ALLOWED_CONTRACT_TYPES = ["short_term", "permanent"]
const ALLOWED_STATUSES = ["active", "expired", "terminated", "cancelled"]

const getActiveAdminUser = async (adminUserId) => {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, role, is_active")
    .eq("id", adminUserId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.is_active !== true) {
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

const addMonthsToDateString = (dateString, months) => {
  if (!dateString || !Number.isFinite(months)) {
    return null
  }

  const date = new Date(`${dateString}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  date.setUTCMonth(date.getUTCMonth() + months)
  return date.toISOString().slice(0, 10)
}

export const createPlatformContract = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id

  const required = ["landlord_id", "property_id", "contract_type", "start_date"]
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
    contract_type,
    start_date,
    end_date,
    grace_months,
    rules_text,
    fine_amount,
    termination_fine,
    status
  } = req.body

  if (!ALLOWED_CONTRACT_TYPES.includes(contract_type)) {
    return res.status(400).json({ error: "contract_type must be short_term or permanent" })
  }

  const contractStatus = status || "active"
  if (!ALLOWED_STATUSES.includes(contractStatus)) {
    return res.status(400).json({ error: "status must be active, expired, terminated, or cancelled" })
  }

  const hasAccess = await ensurePropertyOwnedByLandlord(property_id, landlord_id)
  if (!hasAccess) {
    return res.status(400).json({ error: "property_id must belong to landlord_id" })
  }

  const parsedGraceMonths = Number.isFinite(Number(grace_months)) ? Number(grace_months) : 3

  if (parsedGraceMonths < 0 || parsedGraceMonths > 12) {
    return res.status(400).json({ error: "grace_months must be between 0 and 12" })
  }

  const normalizedEndDate = contract_type === "permanent" ? null : (end_date || null)
  if (contract_type === "short_term" && !normalizedEndDate) {
    return res.status(400).json({ error: "end_date is required for short_term contracts" })
  }

  const graceEndDate = normalizedEndDate
    ? addMonthsToDateString(normalizedEndDate, parsedGraceMonths)
    : null

  const { data, error } = await supabase
    .from("landlord_platform_contracts")
    .insert([
      {
        landlord_id,
        property_id,
        contract_type,
        start_date,
        end_date: normalizedEndDate,
        grace_months: parsedGraceMonths,
        grace_end_date: graceEndDate,
        status: contractStatus,
        rules_text: rules_text || null,
        fine_amount: fine_amount ?? 0,
        termination_fine: termination_fine ?? 0,
        created_by_admin_id: adminUserId
      }
    ])
    .select("*")

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Platform contract created",
    data: data?.[0] || null
  })
})

export const listPlatformContractsAdmin = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { status, landlord_id, property_id, limit } = req.query

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const parsedLimit = Number.parseInt(String(limit || "20"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20

  let query = supabase
    .from("landlord_platform_contracts")
    .select("*, landlords:landlord_id(id, full_name, email, phone, city), properties:property_id(id, title, city, address)")
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (status) {
    query = query.eq("status", status)
  }

  if (landlord_id) {
    query = query.eq("landlord_id", landlord_id)
  }

  if (property_id) {
    query = query.eq("property_id", property_id)
  }

  const { data, error } = await query

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    count: data?.length || 0,
    contracts: data || []
  })
})

export const listLandlordPlatformContracts = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id

  const { data, error } = await supabase
    .from("landlord_platform_contracts")
    .select("*")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    count: data?.length || 0,
    contracts: data || []
  })
})

export const updatePlatformContractStatus = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { contract_id, status } = req.body

  if (!adminUserId || !contract_id || !status) {
    return res.status(400).json({ error: "contract_id, status required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: "status must be active, expired, terminated, or cancelled" })
  }

  const { data, error } = await supabase
    .from("landlord_platform_contracts")
    .update({ status })
    .eq("id", contract_id)
    .select("*")

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Contract not found" })
  }

  res.json({
    message: "Platform contract status updated",
    data: data[0]
  })
})

export const activatePropertyListingFromContract = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { contract_id } = req.body

  if (!adminUserId || !contract_id) {
    return res.status(400).json({ error: "contract_id required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const { data: contract, error: contractError } = await supabase
    .from("landlord_platform_contracts")
    .select("id, property_id, status, signed_at")
    .eq("id", contract_id)
    .maybeSingle()

  if (contractError) {
    return res.status(400).json({ error: contractError.message })
  }

  if (!contract) {
    return res.status(404).json({ error: "Contract not found" })
  }

  if (contract.status !== "active") {
    return res.status(400).json({ error: "Only active contracts can activate listing" })
  }

  if (!contract.signed_at) {
    return res.status(400).json({ error: "Contract must be signed before listing activation" })
  }

  const nowIso = new Date().toISOString()

  const { data: updatedRows, error: propertyError } = await supabase
    .from("properties")
    .update({
      listing_plan_status: "active",
      listing_activated_at: nowIso
    })
    .eq("id", contract.property_id)
    .select("id, title, listing_plan_status, listing_activated_at")

  if (propertyError) {
    return res.status(400).json({ error: propertyError.message })
  }

  res.json({
    message: "Property listing activated from contract",
    property: updatedRows?.[0] || null
  })
})
