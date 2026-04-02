import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMissingFields } from "../utils/validators.js"

const CONTRACT_STATUSES = ["draft", "sent", "tenant_signed", "landlord_signed", "fully_signed", "cancelled"]
const INITIAL_CONTRACT_STATUSES = ["draft", "sent"]

const ensureLandlordOwnsProperty = async (landlordId, propertyId) => {
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

const getContractById = async (contractId) => {
  const { data, error } = await supabase
    .from("rental_contracts")
    .select("*")
    .eq("id", contractId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export const createContract = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id

  const required = ["property_id", "tenant_id", "start_date"]
  const missing = getMissingFields(req.body, required)

  if (!landlordId) {
    return res.status(403).json({ error: "Landlord profile required" })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const {
    property_id,
    tenant_id,
    unit_id,
    booking_id,
    rental_id,
    title,
    terms_text,
    monthly_rent,
    deposit_amount,
    start_date,
    end_date,
    contract_status
  } = req.body

  const hasAccess = await ensureLandlordOwnsProperty(landlordId, property_id)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only create contracts for your own property" })
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

  let resolvedUnitId = unit_id || null

  if (booking_id) {
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, property_id, tenant_id, unit_id")
      .eq("id", booking_id)
      .maybeSingle()

    if (bookingError) {
      return res.status(400).json({ error: bookingError.message })
    }

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    if (booking.property_id !== property_id || booking.tenant_id !== tenant_id) {
      return res.status(400).json({ error: "booking_id does not match property_id and tenant_id" })
    }

    if (!resolvedUnitId && booking.unit_id) {
      resolvedUnitId = booking.unit_id
    }
  }

  if (rental_id) {
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select("id, property_id, tenant_id, unit_id")
      .eq("id", rental_id)
      .maybeSingle()

    if (rentalError) {
      return res.status(400).json({ error: rentalError.message })
    }

    if (!rental) {
      return res.status(404).json({ error: "Rental not found" })
    }

    if (rental.property_id !== property_id || rental.tenant_id !== tenant_id) {
      return res.status(400).json({ error: "rental_id does not match property_id and tenant_id" })
    }

    if (!resolvedUnitId && rental.unit_id) {
      resolvedUnitId = rental.unit_id
    }
  }

  if (resolvedUnitId) {
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("id, property_id")
      .eq("id", resolvedUnitId)
      .maybeSingle()

    if (unitError) {
      return res.status(400).json({ error: unitError.message })
    }

    if (!unit || unit.property_id !== property_id) {
      return res.status(400).json({ error: "unit_id does not belong to property_id" })
    }
  }

  const nextStatus = contract_status || "sent"
  if (!INITIAL_CONTRACT_STATUSES.includes(nextStatus)) {
    return res.status(400).json({ error: "contract_status must be draft or sent" })
  }

  const payload = {
    booking_id: booking_id || null,
    rental_id: rental_id || null,
    property_id,
    unit_id: resolvedUnitId,
    tenant_id,
    landlord_id: landlordId,
    created_by_landlord_id: landlordId,
    title: title || "Residential Lease Agreement",
    terms_text: terms_text || null,
    monthly_rent: monthly_rent ?? null,
    deposit_amount: deposit_amount ?? null,
    start_date,
    end_date: end_date || null,
    contract_status: nextStatus
  }

  const { data, error } = await supabase
    .from("rental_contracts")
    .insert([payload])
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Contract created",
    data: data?.[0] || null
  })
})

export const getContractDetails = asyncHandler(async (req, res) => {
  const contractId = req.params.id
  const tenantId = req.auth?.tenant_id
  const landlordId = req.auth?.landlord_id
  const adminUserId = req.auth?.admin_user_id

  const contract = await getContractById(contractId)

  if (!contract) {
    return res.status(404).json({ error: "Contract not found" })
  }

  const hasAccess = !!adminUserId || contract.tenant_id === tenantId || contract.landlord_id === landlordId

  if (!hasAccess) {
    return res.status(403).json({ error: "You can only view your own contracts" })
  }

  res.json({ contract })
})

export const listTenantContracts = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id

  const { data: contracts, error } = await supabase
    .from("rental_contracts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    count: contracts?.length || 0,
    contracts: contracts || []
  })
})

export const listLandlordContracts = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id

  const { data: contracts, error } = await supabase
    .from("rental_contracts")
    .select("*")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    count: contracts?.length || 0,
    contracts: contracts || []
  })
})

export const tenantSignContract = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id
  const { contract_id } = req.body

  if (!contract_id) {
    return res.status(400).json({ error: "contract_id required" })
  }

  const contract = await getContractById(contract_id)

  if (!contract) {
    return res.status(404).json({ error: "Contract not found" })
  }

  if (contract.tenant_id !== tenantId) {
    return res.status(403).json({ error: "You can only sign your own contract" })
  }

  if (!CONTRACT_STATUSES.includes(contract.contract_status) || contract.contract_status === "cancelled") {
    return res.status(400).json({ error: "Contract cannot be signed" })
  }

  if (contract.tenant_signed_at) {
    return res.status(200).json({ message: "Tenant already signed", contract })
  }

  const nowIso = new Date().toISOString()
  const nextStatus = contract.landlord_signed_at ? "fully_signed" : "tenant_signed"

  const { data: updatedRows, error } = await supabase
    .from("rental_contracts")
    .update({
      tenant_signed_at: nowIso,
      contract_status: nextStatus
    })
    .eq("id", contract_id)
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Tenant signed contract",
    contract: updatedRows?.[0] || null
  })
})

export const landlordSignContract = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { contract_id } = req.body

  if (!contract_id) {
    return res.status(400).json({ error: "contract_id required" })
  }

  const contract = await getContractById(contract_id)

  if (!contract) {
    return res.status(404).json({ error: "Contract not found" })
  }

  if (contract.landlord_id !== landlordId) {
    return res.status(403).json({ error: "You can only sign your own contract" })
  }

  if (!CONTRACT_STATUSES.includes(contract.contract_status) || contract.contract_status === "cancelled") {
    return res.status(400).json({ error: "Contract cannot be signed" })
  }

  if (contract.landlord_signed_at) {
    return res.status(200).json({ message: "Landlord already signed", contract })
  }

  const nowIso = new Date().toISOString()
  const nextStatus = contract.tenant_signed_at ? "fully_signed" : "landlord_signed"

  const { data: updatedRows, error } = await supabase
    .from("rental_contracts")
    .update({
      landlord_signed_at: nowIso,
      contract_status: nextStatus
    })
    .eq("id", contract_id)
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Landlord signed contract",
    contract: updatedRows?.[0] || null
  })
})
