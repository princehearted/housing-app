const categories = [
  { key: "mansion", label: "Mansions" },
  { key: "high_end_apartment", label: "High-End Apartments" },
  { key: "medium_price_apartment", label: "Medium Price Apartments" },
  { key: "bedsitter", label: "Bedsitters" },
  { key: "one_bedroom_apartment", label: "1 Bedroom Apartments" },
  { key: "two_bedroom_apartment", label: "2 Bedroom Apartments" },
  { key: "three_bedroom_apartment", label: "3 Bedroom Apartments" },
  { key: "single_room", label: "Single Rooms" },
  { key: "shop_units", label: "Shop Units" }
]

const iconSvg = {
  mansion: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M9 20v-5h6v5" />
    </svg>
  `,
  high_end_apartment: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="3" width="10" height="18" />
      <rect x="9" y="6" width="2" height="2" />
      <rect x="13" y="6" width="2" height="2" />
      <rect x="9" y="10" width="2" height="2" />
      <rect x="13" y="10" width="2" height="2" />
      <rect x="9" y="14" width="2" height="2" />
      <rect x="13" y="14" width="2" height="2" />
    </svg>
  `,
  medium_price_apartment: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="6" width="14" height="14" />
      <rect x="8" y="9" width="2" height="2" />
      <rect x="12" y="9" width="2" height="2" />
      <rect x="8" y="13" width="2" height="2" />
      <rect x="12" y="13" width="2" height="2" />
    </svg>
  `,
  bedsitter: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h18" />
      <rect x="4" y="12" width="16" height="6" />
      <rect x="5" y="9" width="6" height="3" />
    </svg>
  `,
  one_bedroom_apartment: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" />
      <path d="M9 9h6" />
      <circle cx="15" cy="12" r="1" />
    </svg>
  `,
  two_bedroom_apartment: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="7" width="16" height="10" />
      <path d="M8 9h4v4H8z" />
      <path d="M12 9h4v4h-4z" />
    </svg>
  `,
  three_bedroom_apartment: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" />
      <rect x="7" y="9" width="2" height="2" />
      <rect x="11" y="9" width="2" height="2" />
      <rect x="15" y="9" width="2" height="2" />
    </svg>
  `,
  single_room: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="5" width="12" height="14" />
      <circle cx="10" cy="12" r="1" />
    </svg>
  `,
  shop_units: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10h16" />
      <path d="M5 10l1-5h12l1 5" />
      <path d="M6 10v9h12v-9" />
      <path d="M9 19v-5h6v5" />
    </svg>
  `
}

const searchInput = document.getElementById("search-input")
const searchBtn = document.getElementById("search-btn")
const categoryGrid = document.getElementById("category-grid")
const statProperties = document.getElementById("stat-properties")
const statUnits = document.getElementById("stat-units")
const statOrange = document.getElementById("stat-orange")
const mapPanel = document.getElementById("map-panel")
const mapNote = document.getElementById("map-note")

let mapData = []
let shopListings = []

const filterAvailable = (items) => items.filter((p) => Number(p.available_units || 0) > 0)

const renderStats = (items) => {
  const available = filterAvailable(items)
  statProperties.textContent = String(available.length)
  statUnits.textContent = String(available.reduce((sum, x) => sum + Number(x.available_units || 0), 0))
  statOrange.textContent = String(items.filter((x) => x.has_vacating_soon === true).length)
}

const renderCategories = (items) => {
  const available = filterAvailable(items)
  categoryGrid.innerHTML = ""

  for (const category of categories) {
    const count = category.key === "shop_units"
      ? shopListings.length
      : available.filter((p) => p.property_class === category.key).length

    const card = document.createElement("article")
    card.className = "category-card"
    card.innerHTML = `
      <div class="category-icon">${iconSvg[category.key] || ""}</div>
      <div>
        <h4>${category.label}</h4>
        <p>${count} available</p>
      </div>
      <a href="./listings.html?class=${encodeURIComponent(category.key)}">View Listings</a>
    `

    categoryGrid.appendChild(card)
  }
}

const renderMap = (items) => {
  if (!items.length) {
    mapPanel.innerHTML = '<div class="empty">No map data yet.</div>'
    return
  }

  mapPanel.innerHTML = items
    .map((p) => {
      const status = p.map_color || "red"
      return `
        <div class="map-dot map-${status}">
          <span></span>
          <div>
            <strong>${p.title}</strong>
            <p>${[p.area, p.city].filter(Boolean).join(", ")}</p>
          </div>
        </div>
      `
    })
    .join("")
}

const applySearch = () => {
  const q = (searchInput.value || "").trim().toLowerCase()
  if (!q) {
    renderStats(mapData)
    renderCategories(mapData)
    renderMap(mapData)
    return
  }

  const filtered = mapData.filter((p) => {
    const text = `${p.title} ${p.city} ${p.area} ${p.neighborhood}`.toLowerCase()
    return text.includes(q)
  })

  renderStats(filtered)
  renderCategories(filtered)
  renderMap(filtered)
}

const loadMapData = async () => {
  try {
    mapNote.textContent = "Loading live map data..."
    const [mapRes, shopRes] = await Promise.all([
      fetch("/api/properties/map"),
      fetch("/api/shops")
    ])

    const mapPayload = mapRes.ok ? await mapRes.json() : { properties: [] }
    const shopPayload = shopRes.ok ? await shopRes.json() : { listings: [] }

    mapData = Array.isArray(mapPayload.properties) ? mapPayload.properties : []
    shopListings = Array.isArray(shopPayload.listings) ? shopPayload.listings : []

    mapNote.textContent = "Live map data: /api/properties/map"
  } catch (error) {
    console.error(error)
    mapData = []
    shopListings = []
    mapNote.textContent = "Map data unavailable."
  }

  renderStats(mapData)
  renderCategories(mapData)
  renderMap(mapData)
}

searchBtn.addEventListener("click", applySearch)
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    applySearch()
  }
})

loadMapData()
