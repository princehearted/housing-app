import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMissingFields } from "../utils/validators.js"

export const createBooking = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id

  const required = ["property_id", "unit_type_id", "unit_id"]
  const missing = getMissingFields(req.body, required)

  if (!tenantId) {
    return res.status(403).json({ error: "Tenant profile required" })
  }

  // Check if tenant is verified
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("verified")
    .eq("id", tenantId)
    .maybeSingle()

  if (tenantError) {
    return res.status(400).json({ error: tenantError.message })
  }

  if (!tenant || tenant.verified !== true) {
    return res.status(403).json({ error: "Your account needs verification before booking. Please wait for admin to verify your ID." })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const { property_id, unit_type_id, unit_id, preferred_viewing_at } = req.body

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, verification_status")
    .eq("id", property_id)
    .maybeSingle()

  if (propertyError) {
    return res.status(400).json({ error: propertyError.message })
  }

  if (!property || property.verification_status !== "verified") {
    return res.status(400).json({ error: "Property is not available for booking" })
  }

  const { data: unitType, error: unitTypeError } = await supabase
    .from("unit_types")
    .select("id, property_id")
    .eq("id", unit_type_id)
    .maybeSingle()

  if (unitTypeError) {
    return res.status(400).json({ error: unitTypeError.message })
  }

  if (!unitType || unitType.property_id !== property_id) {
    return res.status(400).json({ error: "unit_type_id does not belong to property_id" })
  }

  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select("id, property_id, unit_type_id, is_available")
    .eq("id", unit_id)
    .maybeSingle()

  if (unitError) {
    return res.status(400).json({ error: unitError.message })
  }

  if (!unit || unit.property_id !== property_id || unit.unit_type_id !== unit_type_id) {
    return res.status(400).json({ error: "unit_id does not match property_id and unit_type_id" })
  }

  if (unit.is_available !== true) {
    return res.status(400).json({ error: "Selected unit is not available" })
  }

  const { data: existingBooking, error: existingBookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("unit_id", unit_id)
    .in("booking_status", ["pending", "approved"])
    .maybeSingle()

  if (existingBookingError) {
    return res.status(400).json({ error: existingBookingError.message })
  }

  if (existingBooking) {
    return res.status(409).json({ error: "You already have an active booking for this unit" })
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert([
      {
        tenant_id: tenantId,
        property_id,
        unit_type_id,
        unit_id,
        booking_status: "pending",
        preferred_viewing_at: preferred_viewing_at || null
      }
    ])
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ message: "Booking created", data })
})

export const respondToBooking = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id

  const required = ["booking_id", "action"]
  const missing = getMissingFields(req.body, required)

  if (!landlordId) {
    return res.status(403).json({ error: "Landlord profile required" })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const { booking_id, action } = req.body

  if (!["approved", "declined"].includes(action)) {
    return res.status(400).json({ error: "action must be approved or declined" })
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, tenant_id, property_id, unit_id, booking_status")
    .eq("id", booking_id)
    .maybeSingle()

  if (bookingError) {
    return res.status(400).json({ error: bookingError.message })
  }

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" })
  }

  if (booking.booking_status !== "pending") {
    return res.status(400).json({ error: "Only pending bookings can be responded to" })
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, owner_id")
    .eq("id", booking.property_id)
    .maybeSingle()

  if (propertyError) {
    return res.status(400).json({ error: propertyError.message })
  }

  if (!property || property.owner_id !== landlordId) {
    return res.status(403).json({ error: "Only the property owner can respond to this booking" })
  }

  const isApproved = action === "approved"
  const nowIso = new Date().toISOString()

  const { data: updatedBookingRows, error: updateError } = await supabase
    .from("bookings")
    .update({
      booking_status: action,
      landlord_response_at: nowIso,
      contact_released: isApproved,
      contact_released_at: isApproved ? nowIso : null
    })
    .eq("id", booking_id)
    .select()

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  if (isApproved) {
    const { error: contactLogError } = await supabase
      .from("contact_release_logs")
      .insert([
        {
          booking_id,
          tenant_id: booking.tenant_id,
          landlord_id: landlordId,
          released_by: "system",
          notes: "Contact shared after booking approval"
        }
      ])

    if (contactLogError) {
      return res.status(400).json({ error: contactLogError.message })
    }

    if (booking.unit_id) {
      const { error: unitUpdateError } = await supabase
        .from("units")
        .update({ is_available: false })
        .eq("id", booking.unit_id)

      if (unitUpdateError) {
        return res.status(400).json({ error: unitUpdateError.message })
      }
    }
  }

  res.json({
    message: `Booking ${action}`,
    booking: updatedBookingRows?.[0] || null
  })
})

export const createRental = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id

  const required = ["property_id", "unit_id", "start_date"]
  const missing = getMissingFields(req.body, required)

  if (!tenantId) {
    return res.status(403).json({ error: "Tenant profile required" })
  }

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const { property_id, unit_id, start_date } = req.body

  const { data, error } = await supabase
    .from("rentals")
    .insert([{ tenant_id: tenantId, property_id, unit_id, start_date }])
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ message: "Rental created", data })
})

