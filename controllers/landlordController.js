import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMissingFields } from "../utils/validators.js"

export const registerLandlord = asyncHandler(async (req, res) => {
  const required = ["full_name", "email", "phone", "city"]
  const missing = getMissingFields(req.body, required)

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const { full_name, email, phone, city } = req.body

  const { data, error } = await supabase
    .from("landlords")
    .insert([{ full_name, email, phone, city }])
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Landlord registered",
    data
  })
})

export const getLandlordBookings = asyncHandler(async (req, res) => {
  const landlord_id = req.auth?.landlord_id
  const { booking_status } = req.query

  const { data: landlord, error: landlordError } = await supabase
    .from("landlords")
    .select("id")
    .eq("id", landlord_id)
    .maybeSingle()

  if (landlordError) {
    return res.status(400).json({ error: landlordError.message })
  }

  if (!landlord) {
    return res.status(404).json({ error: "Landlord not found" })
  }

  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("id, title, city, address")
    .eq("owner_id", landlord_id)

  if (propertiesError) {
    return res.status(400).json({ error: propertiesError.message })
  }

  const propertyIds = (properties || []).map((p) => p.id)
  if (propertyIds.length === 0) {
    return res.json({ count: 0, bookings: [] })
  }

  let bookingsQuery = supabase
    .from("bookings")
    .select("id, tenant_id, property_id, unit_type_id, unit_id, booking_status, preferred_viewing_at, landlord_response_at, contact_released, contact_released_at, created_at")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false })

  if (booking_status) {
    bookingsQuery = bookingsQuery.eq("booking_status", booking_status)
  }

  const { data: bookings, error: bookingsError } = await bookingsQuery

  if (bookingsError) {
    return res.status(400).json({ error: bookingsError.message })
  }

  const tenantIds = [...new Set((bookings || []).map((b) => b.tenant_id).filter(Boolean))]
  const unitTypeIds = [...new Set((bookings || []).map((b) => b.unit_type_id).filter(Boolean))]

  let tenantMap = new Map()
  if (tenantIds.length > 0) {
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, full_name, email, phone, city")
      .in("id", tenantIds)

    if (tenantsError) {
      return res.status(400).json({ error: tenantsError.message })
    }

    tenantMap = new Map((tenants || []).map((t) => [t.id, t]))
  }

  let unitTypeMap = new Map()
  if (unitTypeIds.length > 0) {
    const { data: unitTypes, error: unitTypesError } = await supabase
      .from("unit_types")
      .select("id, name, price")
      .in("id", unitTypeIds)

    if (unitTypesError) {
      return res.status(400).json({ error: unitTypesError.message })
    }

    unitTypeMap = new Map((unitTypes || []).map((u) => [u.id, u]))
  }

  const propertyMap = new Map((properties || []).map((p) => [p.id, p]))

  const enrichedBookings = (bookings || []).map((booking) => {
    const tenant = tenantMap.get(booking.tenant_id) || null
    const canSeeContact = booking.contact_released === true || booking.booking_status === "approved"

    return {
      ...booking,
      property: propertyMap.get(booking.property_id) || null,
      unit_type: unitTypeMap.get(booking.unit_type_id) || null,
      tenant: tenant
        ? {
            id: tenant.id,
            full_name: tenant.full_name,
            city: tenant.city,
            email: canSeeContact ? tenant.email : null,
            phone: canSeeContact ? tenant.phone : null
          }
        : null
    }
  })

  res.json({
    count: enrichedBookings.length,
    bookings: enrichedBookings
  })
})
