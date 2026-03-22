import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMissingFields, toNumber } from "../utils/validators.js"
import { getAmenityCatalog, resolveAmenityInput } from "../utils/propertyAmenities.js"

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

export const createProperty = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const required = [
    "title",
    "description",
    "country",
    "state",
    "city",
    "area",
    "neighborhood",
    "address",
    "property_type",
    "property_class",
    "total_units"
  ]
  const missing = getMissingFields(req.body, required)

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const payload = {
    ...req.body,
    owner_id: landlordId
  }

  const { data, error } = await supabase
    .from("properties")
    .insert([payload])
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ message: "Property created", data })
})

export const createUnitType = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const required = ["property_id", "name", "price", "size_sqm", "total_units"]
  const missing = getMissingFields(req.body, required)

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const { property_id, name, price, size_sqm, total_units, unit_category } = req.body

  const resolvedCategory = unit_category || "residential"
  if (!["residential", "shop"].includes(resolvedCategory)) {
    return res.status(400).json({ error: "unit_category must be residential or shop" })
  }

  const hasAccess = await ensureLandlordOwnsProperty(landlordId, property_id)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only create unit types for your own property" })
  }

  const { data, error } = await supabase
    .from("unit_types")
    .insert([{ property_id, name, price, size_sqm, total_units, unit_category: resolvedCategory }])
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ message: "Unit type created", data })
})

export const createUnit = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const required = ["property_id", "unit_type_id", "unit_number", "floor"]
  const missing = getMissingFields(req.body, required)

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` })
  }

  const { property_id, unit_type_id, unit_number, floor } = req.body

  const hasAccess = await ensureLandlordOwnsProperty(landlordId, property_id)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only create units for your own property" })
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

  const { data, error } = await supabase
    .from("units")
    .insert([{ property_id, unit_type_id, unit_number, floor }])
    .select()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ message: "Unit created", data })
})

export const getLandlordProperties = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  
  if (!landlordId) {
    return res.status(403).json({ error: "Landlord profile required" })
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", landlordId)
    .order("created_at", { ascending: false })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  // Get unit counts for each property
  const propertyIds = properties.map(p => p.id)
  let unitTypes = []
  
  if (propertyIds.length > 0) {
    const { data: ut } = await supabase
      .from("unit_types")
      .select("id, property_id, name, price, size_sqm, total_units")
      .in("property_id", propertyIds)
    unitTypes = ut || []
  }

  const propertiesWithUnits = properties.map(p => ({
    ...p,
    unit_types: unitTypes.filter(ut => ut.property_id === p.id)
  }))

  res.json({
    count: properties.length,
    properties: propertiesWithUnits
  })
})

export const listVerifiedProperties = asyncHandler(async (req, res) => {
  const { city, property_type, min_price, max_price, min_size, max_size, bedrooms } = req.query

  let propertyQuery = supabase
    .from("properties")
    .select("*")
    .eq("verification_status", "verified")

  if (city) {
    propertyQuery = propertyQuery.or(`city.ilike.%${city}%,area.ilike.%${city}%,neighborhood.ilike.%${city}%,title.ilike.%${city}%`)
  }

  if (property_type) {
    propertyQuery = propertyQuery.eq("property_type", property_type)
  }

  const { data: properties, error: propertiesError } = await propertyQuery

  if (propertiesError) {
    return res.status(400).json({ error: propertiesError.message })
  }

  if (!properties || properties.length === 0) {
    return res.json({ count: 0, properties: [] })
  }

  let filteredProperties = properties

  const parsedMinPrice = toNumber(min_price)
  const parsedMaxPrice = toNumber(max_price)
  const parsedMinSize = toNumber(min_size)
  const parsedMaxSize = toNumber(max_size)

  if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined || parsedMinSize !== undefined || parsedMaxSize !== undefined || bedrooms) {
    const propertyIds = properties.map((property) => property.id)

    let unitTypesQuery = supabase
      .from("unit_types")
      .select("id, property_id, name, price, size_sqm")
      .in("property_id", propertyIds)

    if (parsedMinPrice !== undefined) {
      unitTypesQuery = unitTypesQuery.gte("price", parsedMinPrice)
    }

    if (parsedMaxPrice !== undefined) {
      unitTypesQuery = unitTypesQuery.lte("price", parsedMaxPrice)
    }

    if (parsedMinSize !== undefined) {
      unitTypesQuery = unitTypesQuery.gte("size_sqm", parsedMinSize)
    }

    if (parsedMaxSize !== undefined) {
      unitTypesQuery = unitTypesQuery.lte("size_sqm", parsedMaxSize)
    }

    if (bedrooms) {
      unitTypesQuery = unitTypesQuery.ilike("name", `%${bedrooms}%`)
    }

    const { data: unitTypes, error: unitTypesError } = await unitTypesQuery

    if (unitTypesError) {
      return res.status(400).json({ error: unitTypesError.message })
    }

    const matchedPropertyIds = new Set((unitTypes || []).map((unitType) => unitType.property_id))
    filteredProperties = properties.filter((property) => matchedPropertyIds.has(property.id))
  }

  res.json({
    count: filteredProperties.length,
    properties: filteredProperties
  })
})

export const listMapProperties = asyncHandler(async (req, res) => {
  const { city, map_color, property_class } = req.query

  let query = supabase
    .from("property_listing_summary")
    .select("*")

  if (city) {
    query = query.ilike("city", `%${city}%`)
  }

  if (map_color) {
    query = query.eq("map_color", map_color)
  }

  if (property_class) {
    query = query.eq("property_class", property_class)
  }

  const { data, error } = await query.order("title", { ascending: true })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    count: data?.length || 0,
    properties: data || []
  })
})

export const listPropertyAmenities = asyncHandler(async (req, res) => {
  const propertyId = req.params.id

  const { data, error } = await supabase
    .from("property_amenities")
    .select("id, property_id, amenity_key, amenity_label, is_custom, created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    count: data?.length || 0,
    amenities: data || []
  })
})

export const addPropertyAmenity = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const propertyId = req.params.id
  const { amenity } = req.body

  if (!amenity) {
    return res.status(400).json({ error: "amenity required" })
  }

  const resolvedAmenity = resolveAmenityInput(amenity)
  if (!resolvedAmenity) {
    return res.status(400).json({ error: "Invalid amenity value" })
  }

  const hasAccess = await ensureLandlordOwnsProperty(landlordId, propertyId)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only edit amenities for your own property" })
  }

  const { data, error } = await supabase
    .from("property_amenities")
    .insert([
      {
        property_id: propertyId,
        amenity_key: resolvedAmenity.amenity_key,
        amenity_label: resolvedAmenity.amenity_label,
        is_custom: resolvedAmenity.is_custom,
        created_by_landlord_id: landlordId
      }
    ])
    .select()

  if (error) {
    if (error.code === "23505") {
      return res.status(200).json({ message: "Amenity already added" })
    }

    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Amenity added",
    data: data?.[0] || null
  })
})

export const setPropertyAmenities = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const propertyId = req.params.id
  const { amenities } = req.body

  if (!Array.isArray(amenities)) {
    return res.status(400).json({ error: "amenities must be an array" })
  }

  const hasAccess = await ensureLandlordOwnsProperty(landlordId, propertyId)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only edit amenities for your own property" })
  }

  const dedupedAmenities = []
  const seenAmenityKeys = new Set()

  for (const item of amenities) {
    const resolvedAmenity = resolveAmenityInput(item)
    if (!resolvedAmenity) {
      return res.status(400).json({ error: "Invalid amenity value in amenities list" })
    }

    if (seenAmenityKeys.has(resolvedAmenity.amenity_key)) {
      continue
    }

    seenAmenityKeys.add(resolvedAmenity.amenity_key)
    dedupedAmenities.push(resolvedAmenity)
  }

  const { error: deleteError } = await supabase
    .from("property_amenities")
    .delete()
    .eq("property_id", propertyId)

  if (deleteError) {
    return res.status(400).json({ error: deleteError.message })
  }

  if (dedupedAmenities.length > 0) {
    const payload = dedupedAmenities.map((item) => ({
      property_id: propertyId,
      amenity_key: item.amenity_key,
      amenity_label: item.amenity_label,
      is_custom: item.is_custom,
      created_by_landlord_id: landlordId
    }))

    const { error: insertError } = await supabase
      .from("property_amenities")
      .insert(payload)

    if (insertError) {
      return res.status(400).json({ error: insertError.message })
    }
  }

  const { data: updatedAmenities, error: fetchError } = await supabase
    .from("property_amenities")
    .select("id, property_id, amenity_key, amenity_label, is_custom, created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })

  if (fetchError) {
    return res.status(400).json({ error: fetchError.message })
  }

  res.json({
    message: "Amenities updated",
    count: updatedAmenities?.length || 0,
    amenities: updatedAmenities || []
  })
})

export const removePropertyAmenity = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const propertyId = req.params.id
  const amenityInput = req.params.amenityKey

  const resolvedAmenity = resolveAmenityInput(amenityInput)
  if (!resolvedAmenity) {
    return res.status(400).json({ error: "Invalid amenity key" })
  }

  const hasAccess = await ensureLandlordOwnsProperty(landlordId, propertyId)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only edit amenities for your own property" })
  }

  const { error } = await supabase
    .from("property_amenities")
    .delete()
    .eq("property_id", propertyId)
    .eq("amenity_key", resolvedAmenity.amenity_key)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ message: "Amenity removed" })
})

export const listAmenityCatalog = asyncHandler(async (req, res) => {
  const catalog = getAmenityCatalog()

  res.json({
    count: catalog.length,
    amenities: catalog
  })
})

export const getPropertyDetails = asyncHandler(async (req, res) => {
  const { id } = req.params
  const adminId = req.auth?.admin_user_id
  const landlordId = req.auth?.landlord_id

  let query = supabase.from("properties").select("*").eq("id", id)

  // If not admin or the owner, only show if verified
  if (!adminId) {
    if (landlordId) {
      // Allow landlord to see their own property regardless of status
      query = query.or(`verification_status.eq.verified,owner_id.eq.${landlordId}`)
    } else {
      // Regular tenants only see verified
      query = query.eq("verification_status", "verified")
    }
  }

  const { data: property, error: propertyError } = await query.maybeSingle()

  if (propertyError) {
    return res.status(400).json({ error: propertyError.message })
  }

  if (!property) {
    return res.status(404).json({ error: "Property not found" })
  }

  const { data: unitTypes, error: unitTypesError } = await supabase
    .from("unit_types")
    .select("*")
    .eq("property_id", id)

  if (unitTypesError) {
    return res.status(400).json({ error: unitTypesError.message })
  }

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("*")
    .eq("property_id", id)

  if (unitsError) {
    return res.status(400).json({ error: unitsError.message })
  }

  const { data: propertyPhotos } = await supabase
    .from("property_photos")
    .select("*")
    .eq("property_id", id)

  // Provide high-quality placeholder images for testing if no photos exist
  // This helps users see the "setup of the image viewing" before verification
  const effectivePhotos = (propertyPhotos && propertyPhotos.length > 0) 
    ? propertyPhotos 
    : [
        { photo_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", is_primary: true },
        { photo_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", is_primary: false },
        { photo_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80", is_primary: false }
      ]

  const { data: amenities } = await supabase
    .from("property_amenities")
    .select("id, amenity_key, amenity_label, is_custom")
    .eq("property_id", id)
    .order("amenity_label", { ascending: true })

  const { data: documents } = await supabase
    .from("property_documents_db")
    .select("*")
    .eq("property_id", id)

  // Provide mock floor plans if none exist for testing layouts
  const effectiveFloorPlans = (documents && documents.filter(d => d.document_type === 'floor_plan').length > 0)
    ? documents.filter(d => d.document_type === 'floor_plan')
    : [
        { document_url: "https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&w=1200&q=80", document_type: 'floor_plan' }
      ]

  const unitTypeIds = (unitTypes || []).map((unitType) => unitType.id)

  let unitTypePhotos = []
  if (unitTypeIds.length > 0) {
    const { data: loadedUnitTypePhotos, error: unitTypePhotosError } = await supabase
      .from("unit_type_photos")
      .select("*")
      .in("unit_type_id", unitTypeIds)

    if (unitTypePhotosError) {
      return res.status(400).json({ error: unitTypePhotosError.message })
    }

    unitTypePhotos = loadedUnitTypePhotos || []
  }

  // Provide mock photos for unit types if they don't have any (for testing layouts)
  const mockUnitPhotos = [
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
  ]

  const unitTypesWithMedia = (unitTypes || []).map((unitType, idx) => {
    const existingPhotos = unitTypePhotos.filter((photo) => photo.unit_type_id === unitType.id)
    return {
      ...unitType,
      photos: existingPhotos.length > 0 ? existingPhotos : [{ photo_url: mockUnitPhotos[idx % mockUnitPhotos.length] }],
      units: (units || []).filter((unit) => unit.unit_type_id === unitType.id)
    }
  })

  res.json({
    property: {
      ...property,
      amenities: amenities || [],
      photos: effectivePhotos,
      floor_plans: effectiveFloorPlans,
      unit_types: unitTypesWithMedia
    }
  })
})

export const mockPropertyPhoto = asyncHandler(async (req, res) => {
  const { property_id, photo_url } = req.body
  
  const { data, error } = await supabase
    .from("property_photos")
    .insert([{ property_id, photo_url, is_primary: false }])
    .select()

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: "Mock photo added", data: data[0] })
})

export const mockPropertyDocument = asyncHandler(async (req, res) => {
  const { property_id, document_url, document_type } = req.body
  
  const { data, error } = await supabase
    .from("property_documents_db")
    .insert([{ property_id, document_url, document_type, verification_status: 'pending' }])
    .select()

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: "Mock document added", data: data[0] })
})

export const listShopListings = asyncHandler(async (req, res) => {
  const { city } = req.query

  let propertyQuery = supabase
    .from("properties")
    .select("id, title, city, area, neighborhood, address, property_class, property_type")
    .eq("verification_status", "verified")

  if (city) {
    propertyQuery = propertyQuery.ilike("city", `%${city}%`)
  }

  const { data: properties, error: propertiesError } = await propertyQuery

  if (propertiesError) {
    return res.status(400).json({ error: propertiesError.message })
  }

  if (!properties || properties.length === 0) {
    return res.json({ count: 0, listings: [] })
  }

  const propertyIds = properties.map((property) => property.id)

  const { data: unitTypes, error: unitTypesError } = await supabase
    .from("unit_types")
    .select("id, property_id, name, price, size_sqm, unit_category")
    .in("property_id", propertyIds)
    .eq("unit_category", "shop")

  if (unitTypesError) {
    return res.status(400).json({ error: unitTypesError.message })
  }

  if (!unitTypes || unitTypes.length === 0) {
    return res.json({ count: 0, listings: [] })
  }

  const unitTypeIds = unitTypes.map((unitType) => unitType.id)

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("id, unit_type_id, is_available")
    .in("unit_type_id", unitTypeIds)
    .eq("is_available", true)

  if (unitsError) {
    return res.status(400).json({ error: unitsError.message })
  }

  if (!units || units.length === 0) {
    return res.json({ count: 0, listings: [] })
  }

  const propertyLookup = new Map(properties.map((property) => [property.id, property]))
  const unitTypeLookup = new Map(unitTypes.map((unitType) => [unitType.id, unitType]))
  const summary = new Map()

  for (const unit of units) {
    const unitType = unitTypeLookup.get(unit.unit_type_id)
    if (!unitType) continue

    const propertyId = unitType.property_id
    const entry = summary.get(propertyId) || {
      property_id: propertyId,
      available_units: 0,
      min_price: 0
    }

    entry.available_units += 1

    const price = Number(unitType.price)
    if (Number.isFinite(price) && price > 0) {
      entry.min_price = entry.min_price > 0 ? Math.min(entry.min_price, price) : price
    }

    summary.set(propertyId, entry)
  }

  const listings = Array.from(summary.values())
    .map((entry) => {
      const property = propertyLookup.get(entry.property_id)
      if (!property) return null

      return {
        property_id: entry.property_id,
        title: property.title,
        city: property.city,
        area: property.area,
        neighborhood: property.neighborhood,
        address: property.address,
        property_class: property.property_class,
        property_type: property.property_type,
        available_units: entry.available_units,
        min_price: entry.min_price,
        map_color: entry.available_units > 0 ? "green" : "red"
      }
    })
    .filter(Boolean)

  res.json({ count: listings.length, listings })
})
