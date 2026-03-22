import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMissingFields } from "../utils/validators.js"

const uploadTenantDocFile = async (tenantId, file, side) => {
  const safeName = file.originalname.replace(/\s+/g, "-")
  const filePath = `tenant/${tenantId}/${side}-${Date.now()}-${safeName}`

  const { error } = await supabase
    .storage
    .from("user_documents")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    })

  if (error) {
    throw new Error(error.message)
  }

  return filePath
}

export const registerTenant = asyncHandler(async (req, res) => {
  const required = ["full_name", "email", "phone", "city"]
  const missing = getMissingFields(req.body, required)

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const { full_name, email, phone, city } = req.body

  const { data, error } = await supabase
    .from("tenants")
    .insert([{ full_name, email, phone, city }])
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Tenant registered",
    data
  })
})

export const registerTenantWithDocuments = asyncHandler(async (req, res) => {
  const required = ["full_name", "email", "phone", "city"]
  const missing = getMissingFields(req.body, required)

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const idFrontFile = req.files?.id_front?.[0]
  const idBackFile = req.files?.id_back?.[0]

  if (!idFrontFile || !idBackFile) {
    return res.status(400).json({ error: "id_front and id_back files are required" })
  }

  const { full_name, email, phone, city } = req.body

  const { data: insertedTenants, error: tenantInsertError } = await supabase
    .from("tenants")
    .insert([{ full_name, email, phone, city, verified: false }])
    .select()

  if (tenantInsertError) {
    return res.status(400).json({ error: tenantInsertError.message })
  }

  const tenant = insertedTenants?.[0]

  const idFrontPath = await uploadTenantDocFile(tenant.id, idFrontFile, "id_front")
  const idBackPath = await uploadTenantDocFile(tenant.id, idBackFile, "id_back")

  const { error: updateTenantError } = await supabase
    .from("tenants")
    .update({
      id_front_url: idFrontPath,
      id_back_url: idBackPath
    })
    .eq("id", tenant.id)

  if (updateTenantError) {
    return res.status(400).json({ error: updateTenantError.message })
  }

  const { error: documentsInsertError } = await supabase
    .from("tenant_documents")
    .insert([
      { tenant_id: tenant.id, document_type: "national_id_front", file_url: idFrontPath },
      { tenant_id: tenant.id, document_type: "national_id_back", file_url: idBackPath }
    ])

  if (documentsInsertError) {
    return res.status(400).json({ error: documentsInsertError.message })
  }

  res.json({
    message: "Tenant registered with ID documents",
    tenant_id: tenant.id,
    id_documents: {
      id_front_url: idFrontPath,
      id_back_url: idBackPath
    }
  })
})

export const addTenantFavorite = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id

  if (!tenantId || !req.body.property_id) {
    return res.status(400).json({ error: "property_id required" })
  }

  const { property_id } = req.body

  const { data, error } = await supabase
    .from("tenant_favorites")
    .insert([{ tenant_id: tenantId, property_id }])
    .select()

  if (error) {
    if (error.code === "23505") {
      return res.status(200).json({ message: "Property already in favorites" })
    }

    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Property added to favorites",
    data
  })
})

export const removeTenantFavorite = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id

  if (!tenantId || !req.body.property_id) {
    return res.status(400).json({ error: "property_id required" })
  }

  const { property_id } = req.body

  const { error } = await supabase
    .from("tenant_favorites")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("property_id", property_id)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ message: "Property removed from favorites" })
})

export const getTenantFavorites = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .maybeSingle()

  if (tenantError) {
    return res.status(400).json({ error: tenantError.message })
  }

  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found" })
  }

  const { data: favorites, error: favoritesError } = await supabase
    .from("tenant_favorites")
    .select("id, property_id, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (favoritesError) {
    return res.status(400).json({ error: favoritesError.message })
  }

  const propertyIds = [...new Set((favorites || []).map((f) => f.property_id).filter(Boolean))]

  let propertyMap = new Map()
  if (propertyIds.length > 0) {
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, city, address, property_type, property_class, verification_status")
      .in("id", propertyIds)

    if (propertiesError) {
      return res.status(400).json({ error: propertiesError.message })
    }

    propertyMap = new Map((properties || []).map((p) => [p.id, p]))
  }

  const enrichedFavorites = (favorites || []).map((favorite) => ({
    ...favorite,
    property: propertyMap.get(favorite.property_id) || null
  }))

  res.json({
    count: enrichedFavorites.length,
    favorites: enrichedFavorites
  })
})

export const getTenantBookings = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .maybeSingle()

  if (tenantError) {
    return res.status(400).json({ error: tenantError.message })
  }

  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found" })
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, property_id, unit_type_id, unit_id, booking_status, preferred_viewing_at, landlord_response_at, contact_released, contact_released_at, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (bookingsError) {
    return res.status(400).json({ error: bookingsError.message })
  }

  const propertyIds = [...new Set((bookings || []).map((b) => b.property_id).filter(Boolean))]
  const unitTypeIds = [...new Set((bookings || []).map((b) => b.unit_type_id).filter(Boolean))]

  let propertyMap = new Map()
  if (propertyIds.length > 0) {
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, city, address, owner_id")
      .in("id", propertyIds)

    if (propertiesError) {
      return res.status(400).json({ error: propertiesError.message })
    }

    propertyMap = new Map((properties || []).map((p) => [p.id, p]))
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

  const enrichedBookings = (bookings || []).map((booking) => ({
    ...booking,
    property: propertyMap.get(booking.property_id) || null,
    unit_type: unitTypeMap.get(booking.unit_type_id) || null
  }))

  res.json({
    count: enrichedBookings.length,
    bookings: enrichedBookings
  })
})
