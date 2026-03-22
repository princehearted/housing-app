import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const ALLOWED_LEDGER_STATUSES = ["pending", "paid", "waived", "cancelled"]

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

const parseBillingMonth = (value) => {
  const base = value ? new Date(`${value}T00:00:00.000Z`) : new Date()
  if (Number.isNaN(base.getTime())) {
    return null
  }

  const monthStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0))

  return {
    monthStart,
    monthEnd,
    monthStartDate: monthStart.toISOString().slice(0, 10),
    monthEndDate: monthEnd.toISOString().slice(0, 10)
  }
}

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const isRentalEligibleForCommission = (rentalStartDate, listingActivatedAt) => {
  if (!rentalStartDate || !listingActivatedAt) {
    return false
  }

  const listingDate = String(listingActivatedAt).slice(0, 10)
  return rentalStartDate >= listingDate
}

export const generateMonthlyCommission = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { billing_month, property_id } = req.body || {}

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const parsedMonth = parseBillingMonth(billing_month)
  if (!parsedMonth) {
    return res.status(400).json({ error: "billing_month must be a valid date (YYYY-MM-DD)" })
  }

  let rentalsQuery = supabase
    .from("rentals")
    .select("id, property_id, tenant_id, unit_id, start_date, end_date")
    .lte("start_date", parsedMonth.monthEndDate)
    .or(`end_date.is.null,end_date.gte.${parsedMonth.monthStartDate}`)

  if (property_id) {
    rentalsQuery = rentalsQuery.eq("property_id", property_id)
  }

  const { data: rentals, error: rentalsError } = await rentalsQuery

  if (rentalsError) {
    return res.status(400).json({ error: rentalsError.message })
  }

  if (!rentals || rentals.length === 0) {
    return res.json({
      billing_month: parsedMonth.monthStartDate,
      prepared_count: 0,
      inserted_count: 0,
      skipped_count: 0,
      skipped: []
    })
  }

  const propertyIds = [...new Set(rentals.map((r) => r.property_id).filter(Boolean))]
  const unitIds = [...new Set(rentals.map((r) => r.unit_id).filter(Boolean))]

  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("id, owner_id, listing_activated_at, commission_rate")
    .in("id", propertyIds)

  if (propertiesError) {
    return res.status(400).json({ error: propertiesError.message })
  }

  const propertyMap = new Map((properties || []).map((p) => [p.id, p]))

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("id, unit_type_id")
    .in("id", unitIds)

  if (unitsError) {
    return res.status(400).json({ error: unitsError.message })
  }

  const unitMap = new Map((units || []).map((u) => [u.id, u]))

  const unitTypeIds = [...new Set((units || []).map((u) => u.unit_type_id).filter(Boolean))]

  const { data: unitTypes, error: unitTypesError } = await supabase
    .from("unit_types")
    .select("id, price")
    .in("id", unitTypeIds)

  if (unitTypesError) {
    return res.status(400).json({ error: unitTypesError.message })
  }

  const unitTypeMap = new Map((unitTypes || []).map((u) => [u.id, u]))

  const ledgerRows = []
  const skipped = []

  for (const rental of rentals) {
    const property = propertyMap.get(rental.property_id)
    if (!property) {
      skipped.push({ rental_id: rental.id, reason: "property_not_found" })
      continue
    }

    if (!isRentalEligibleForCommission(rental.start_date, property.listing_activated_at)) {
      skipped.push({ rental_id: rental.id, reason: "tenant_occupied_before_listing_activation" })
      continue
    }

    const unit = unitMap.get(rental.unit_id)
    if (!unit) {
      skipped.push({ rental_id: rental.id, reason: "unit_not_found" })
      continue
    }

    const unitType = unitTypeMap.get(unit.unit_type_id)
    const rentAmount = toSafeNumber(unitType?.price, NaN)
    if (!Number.isFinite(rentAmount)) {
      skipped.push({ rental_id: rental.id, reason: "unit_type_price_missing" })
      continue
    }

    const commissionRate = toSafeNumber(property.commission_rate, 0.05)
    const commissionAmount = Number((rentAmount * commissionRate).toFixed(2))

    ledgerRows.push({
      rental_id: rental.id,
      property_id: rental.property_id,
      landlord_id: property.owner_id,
      tenant_id: rental.tenant_id,
      billing_month: parsedMonth.monthStartDate,
      rent_amount: rentAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      status: "pending",
      created_by_admin_id: adminUserId
    })
  }

  if (ledgerRows.length === 0) {
    return res.json({
      billing_month: parsedMonth.monthStartDate,
      prepared_count: 0,
      inserted_count: 0,
      skipped_count: skipped.length,
      skipped
    })
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("landlord_commission_ledger")
    .insert(ledgerRows, {
      onConflict: "rental_id,billing_month",
      ignoreDuplicates: true
    })
    .select("id, rental_id, landlord_id, billing_month, commission_amount, status")

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  res.json({
    billing_month: parsedMonth.monthStartDate,
    prepared_count: ledgerRows.length,
    inserted_count: insertedRows?.length || 0,
    skipped_count: skipped.length,
    skipped,
    inserted: insertedRows || []
  })
})

export const listAdminCommissionLedger = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { billing_month, status, landlord_id, property_id, limit } = req.query

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
    .from("landlord_commission_ledger")
    .select("*, landlords:landlord_id(id, full_name, email), properties:property_id(id, title, city), tenants:tenant_id(id, full_name, email)")
    .order("billing_month", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (billing_month) {
    query = query.eq("billing_month", billing_month)
  }

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
    ledger: data || []
  })
})

export const markCommissionPaid = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { ledger_id, payment_reference, notes } = req.body

  if (!adminUserId || !ledger_id) {
    return res.status(400).json({ error: "ledger_id required" })
  }

  const adminUser = await getActiveAdminUser(adminUserId)
  if (!adminUser) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from("landlord_commission_ledger")
    .update({
      status: "paid",
      paid_at: nowIso,
      payment_reference: payment_reference || null,
      notes: notes || null
    })
    .eq("id", ledger_id)
    .select("*")

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Ledger entry not found" })
  }

  res.json({
    message: "Commission marked as paid",
    data: data[0]
  })
})

export const listLandlordCommissionLedger = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { billing_month, status, limit } = req.query

  const parsedLimit = Number.parseInt(String(limit || "50"), 10)
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50

  let query = supabase
    .from("landlord_commission_ledger")
    .select("*")
    .eq("landlord_id", landlordId)
    .order("billing_month", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(safeLimit)

  if (billing_month) {
    query = query.eq("billing_month", billing_month)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    count: data?.length || 0,
    ledger: data || []
  })
})

export const getLandlordCommissionSummary = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { billing_month } = req.query

  let query = supabase
    .from("landlord_commission_ledger")
    .select("status, commission_amount")
    .eq("landlord_id", landlordId)

  if (billing_month) {
    query = query.eq("billing_month", billing_month)
  }

  const { data, error } = await query

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  const summary = {
    total_count: data?.length || 0,
    pending_amount: 0,
    paid_amount: 0,
    waived_amount: 0,
    cancelled_amount: 0
  }

  for (const row of data || []) {
    const amount = toSafeNumber(row.commission_amount, 0)
    if (row.status === "paid") summary.paid_amount += amount
    else if (row.status === "waived") summary.waived_amount += amount
    else if (row.status === "cancelled") summary.cancelled_amount += amount
    else summary.pending_amount += amount
  }

  summary.pending_amount = Number(summary.pending_amount.toFixed(2))
  summary.paid_amount = Number(summary.paid_amount.toFixed(2))
  summary.waived_amount = Number(summary.waived_amount.toFixed(2))
  summary.cancelled_amount = Number(summary.cancelled_amount.toFixed(2))

  res.json({
    billing_month: billing_month || null,
    summary
  })
})
