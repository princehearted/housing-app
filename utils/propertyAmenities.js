const AMENITY_CATALOG = [
  { key: "cctv_cameras", label: "CCTV Cameras" },
  { key: "security_guards", label: "Security Guards" },
  { key: "garbage_collection", label: "Garbage Collection" },
  { key: "controlled_gate_access", label: "Controlled Gate Access" },
  { key: "perimeter_wall", label: "Perimeter Wall" },
  { key: "electric_fence", label: "Electric Fence" },
  { key: "caretaker_on_site", label: "Caretaker On Site" },
  { key: "backup_generator", label: "Backup Generator" },
  { key: "borehole_water", label: "Borehole Water" },
  { key: "parking", label: "Parking" },
  { key: "elevator", label: "Elevator" },
  { key: "fire_safety", label: "Fire Safety" },
  { key: "wheelchair_access", label: "Wheelchair Access" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "swimming_pool", label: "Swimming Pool" },
  { key: "gym", label: "Gym" },
  { key: "playground", label: "Playground" }
]

const byKey = new Map(AMENITY_CATALOG.map((item) => [item.key.toLowerCase(), item]))
const byLabel = new Map(AMENITY_CATALOG.map((item) => [item.label.toLowerCase(), item]))

const sanitizeToKey = (value) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
}

export const resolveAmenityInput = (input) => {
  if (!input || String(input).trim() === "") {
    return null
  }

  const raw = String(input).trim()
  const lower = raw.toLowerCase()

  if (byKey.has(lower)) {
    return {
      amenity_key: byKey.get(lower).key,
      amenity_label: byKey.get(lower).label,
      is_custom: false
    }
  }

  if (byLabel.has(lower)) {
    return {
      amenity_key: byLabel.get(lower).key,
      amenity_label: byLabel.get(lower).label,
      is_custom: false
    }
  }

  const customKey = `custom_${sanitizeToKey(raw)}`

  if (!customKey || customKey === "custom_") {
    return null
  }

  return {
    amenity_key: customKey,
    amenity_label: raw,
    is_custom: true
  }
}

export const getAmenityCatalog = () => AMENITY_CATALOG
