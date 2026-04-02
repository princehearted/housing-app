import "dotenv/config"
import supabase from "../config/supabaseClient.js"

const landlordsSeed = [
  {
    full_name: "Aisha Mwangi",
    email: "seed.landlord1@housingapp.ke",
    phone: "+254700100001",
    city: "Mombasa"
  },
  {
    full_name: "Brian Odhiambo",
    email: "seed.landlord2@housingapp.ke",
    phone: "+254700100002",
    city: "Mombasa"
  },
  {
    full_name: "Caroline Njeri",
    email: "seed.landlord3@housingapp.ke",
    phone: "+254700100003",
    city: "Mombasa"
  }
]

const tenantsSeed = [
  {
    full_name: "Hassan Ali",
    email: "seed.tenant1@housingapp.ke",
    phone: "+254711200001",
    city: "Mombasa"
  },
  {
    full_name: "Mercy Wanjiku",
    email: "seed.tenant2@housingapp.ke",
    phone: "+254711200002",
    city: "Mombasa"
  },
  {
    full_name: "Kevin Mutiso",
    email: "seed.tenant3@housingapp.ke",
    phone: "+254711200003",
    city: "Mombasa"
  }
]

const propertyTemplates = [
  {
    title: "Nyali Breeze Apartments",
    description: "Modern apartment block near beaches and malls.",
    property_type: "apartment",
    property_class: "high_end_apartment",
    address: "Nyali, Links Road",
    area: "Nyali",
    neighborhood: "Links Road"
  },
  {
    title: "Bamburi Family Homes",
    description: "Spacious units for families in Bamburi.",
    property_type: "apartment",
    property_class: "medium_price_apartment",
    address: "Bamburi, Old Malindi Road",
    area: "Bamburi",
    neighborhood: "Old Malindi Road"
  },
  {
    title: "Likoni Heights Studios",
    description: "Affordable studios with easy public transport access.",
    property_type: "apartment",
    property_class: "bedsitter",
    address: "Likoni, Shelly Beach Road",
    area: "Likoni",
    neighborhood: "Shelly Beach Road"
  }
]

const unitTypeTemplates = [
  {
    name: "Bedsitter",
    price: 12000,
    size_sqm: 28,
    total_units: 2
  },
  {
    name: "1 Bedroom Apartment",
    price: 22000,
    size_sqm: 45,
    total_units: 2
  },
  {
    name: "2 Bedroom Apartment",
    price: 45000,
    size_sqm: 80,
    total_units: 2
  }
]

const todayPlusDays = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const failIfError = (error, context) => {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
}

const getOrCreateLandlord = async (landlord) => {
  const { data: existing, error: selectError } = await supabase
    .from("landlords")
    .select("id, email")
    .eq("email", landlord.email)
    .limit(1)

  failIfError(selectError, "Select landlord")

  if (existing && existing.length > 0) {
    return existing[0]
  }

  const { data: inserted, error: insertError } = await supabase
    .from("landlords")
    .insert([{ ...landlord, verified: true }])
    .select("id, email")

  failIfError(insertError, "Insert landlord")
  return inserted[0]
}

const getOrCreateTenant = async (tenant) => {
  const { data: existing, error: selectError } = await supabase
    .from("tenants")
    .select("id, email")
    .eq("email", tenant.email)
    .limit(1)

  failIfError(selectError, "Select tenant")

  if (existing && existing.length > 0) {
    return existing[0]
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tenants")
    .insert([{ ...tenant, verified: true }])
    .select("id, email")

  failIfError(insertError, "Insert tenant")
  return inserted[0]
}

const getOrCreateProperty = async (ownerId, template) => {
  const { data: existing, error: selectError } = await supabase
    .from("properties")
    .select("id, title, owner_id")
    .eq("owner_id", ownerId)
    .eq("title", template.title)
    .limit(1)

  failIfError(selectError, "Select property")

  if (existing && existing.length > 0) {
    return existing[0]
  }

  const payload = {
    owner_id: ownerId,
    title: template.title,
    description: template.description,
    country: "Kenya",
    state: "Mombasa County",
    city: "Mombasa",
    area: template.area,
    neighborhood: template.neighborhood,
    address: template.address,
    property_type: template.property_type,
    property_class: template.property_class,
    total_units: 6,
    occupied_units: 0,
    verification_status: "verified",
    listing_plan_status: "active"
  }

  const { data: inserted, error: insertError } = await supabase
    .from("properties")
    .insert([payload])
    .select("id, title, owner_id")

  failIfError(insertError, "Insert property")
  return inserted[0]
}

const getOrCreateUnitType = async (propertyId, template) => {
  const { data: existing, error: selectError } = await supabase
    .from("unit_types")
    .select("id, property_id, name")
    .eq("property_id", propertyId)
    .eq("name", template.name)
    .limit(1)

  failIfError(selectError, "Select unit type")

  if (existing && existing.length > 0) {
    return existing[0]
  }

  const payload = {
    property_id: propertyId,
    name: template.name,
    price: template.price,
    size_sqm: template.size_sqm,
    total_units: template.total_units,
    occupied_units: 0,
    available_units: template.total_units,
    verification_status: "verified"
  }

  const { data: inserted, error: insertError } = await supabase
    .from("unit_types")
    .insert([payload])
    .select("id, property_id, name")

  failIfError(insertError, "Insert unit type")
  return inserted[0]
}

const getOrCreateUnit = async (propertyId, unitTypeId, unitNumber, floor) => {
  const { data: existing, error: selectError } = await supabase
    .from("units")
    .select("id, property_id, unit_type_id, unit_number")
    .eq("property_id", propertyId)
    .eq("unit_number", unitNumber)
    .limit(1)

  failIfError(selectError, "Select unit")

  if (existing && existing.length > 0) {
    return existing[0]
  }

  const { data: inserted, error: insertError } = await supabase
    .from("units")
    .insert([
      {
        property_id: propertyId,
        unit_type_id: unitTypeId,
        unit_number: unitNumber,
        floor,
        is_available: true
      }
    ])
    .select("id, property_id, unit_type_id, unit_number")

  failIfError(insertError, "Insert unit")
  return inserted[0]
}

const getOrCreatePendingBooking = async ({ tenantId, propertyId, unitTypeId, unitId }) => {
  const { data: existing, error: selectError } = await supabase
    .from("bookings")
    .select("id, booking_status")
    .eq("tenant_id", tenantId)
    .eq("property_id", propertyId)
    .eq("unit_id", unitId)
    .eq("booking_status", "pending")
    .limit(1)

  failIfError(selectError, "Select booking")

  if (existing && existing.length > 0) {
    return existing[0]
  }

  const { data: inserted, error: insertError } = await supabase
    .from("bookings")
    .insert([
      {
        tenant_id: tenantId,
        property_id: propertyId,
        unit_type_id: unitTypeId,
        unit_id: unitId,
        booking_status: "pending",
        preferred_viewing_at: `${todayPlusDays(3)}T10:00:00.000Z`
      }
    ])
    .select("id, booking_status")

  failIfError(insertError, "Insert booking")
  return inserted[0]
}

const seed = async () => {
  console.log("Seeding demo data...\n")

  const landlords = []
  for (const landlord of landlordsSeed) {
    landlords.push(await getOrCreateLandlord(landlord))
  }

  const tenants = []
  for (const tenant of tenantsSeed) {
    tenants.push(await getOrCreateTenant(tenant))
  }

  const properties = []
  for (let i = 0; i < propertyTemplates.length; i += 1) {
    properties.push(await getOrCreateProperty(landlords[i].id, propertyTemplates[i]))
  }

  const unitTypes = []
  const units = []

  for (const property of properties) {
    for (let i = 0; i < unitTypeTemplates.length; i += 1) {
      const unitType = await getOrCreateUnitType(property.id, unitTypeTemplates[i])
      unitTypes.push(unitType)

      const basePrefix = `${String.fromCharCode(65 + i)}`
      const unit1 = await getOrCreateUnit(property.id, unitType.id, `${basePrefix}-101`, 1)
      const unit2 = await getOrCreateUnit(property.id, unitType.id, `${basePrefix}-102`, 1)
      units.push(unit1, unit2)
    }
  }

  const sampleBooking = await getOrCreatePendingBooking({
    tenantId: tenants[0].id,
    propertyId: properties[0].id,
    unitTypeId: unitTypes[0].id,
    unitId: units[0].id
  })

  console.log("Seed complete. Use these IDs in Postman variables:\n")
  console.log(JSON.stringify({
    tenant_id: tenants[0].id,
    landlord_id: landlords[0].id,
    property_id: properties[0].id,
    unit_type_id: unitTypes[0].id,
    unit_id: units[0].id,
    booking_id: sampleBooking.id
  }, null, 2))

  console.log("\nSummary:")
  console.log(`Landlords: ${landlords.length}`)
  console.log(`Tenants: ${tenants.length}`)
  console.log(`Properties: ${properties.length}`)
  console.log(`Unit Types: ${unitTypes.length}`)
  console.log(`Units: ${units.length}`)
  console.log("Sample pending booking ready for /api/booking/respond")
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error.message)
    process.exit(1)
  })
