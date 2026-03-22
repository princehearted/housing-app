// Using global API utility from api.js (ensure it's included in HTML)
const API = window.API;

const listTitle = document.getElementById("list-title")
const listSubtitle = document.getElementById("list-subtitle")
const listCount = document.getElementById("list-count")
const listGrid = document.getElementById("list-grid")
const searchInput = document.getElementById("list-search")
const searchBtn = document.getElementById("list-search-btn")

const params = new URLSearchParams(window.location.search)
const classKey = params.get("class")

const classLabels = {
  mansion: "Mansions",
  high_end_apartment: "High-End Apartments",
  medium_price_apartment: "Medium Price Apartments",
  bedsitter: "Bedsitters",
  one_bedroom_apartment: "1 Bedroom Apartments",
  two_bedroom_apartment: "2 Bedroom Apartments",
  three_bedroom_apartment: "3 Bedroom Apartments",
  single_room: "Single Rooms",
  shop_units: "Shop Units"
}

const statusLabel = {
  green: "Available",
  orange: "Vacating Soon",
  red: "Fully Occupied"
}

const formatKES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(amount)

let listings = []

const renderListings = (items) => {
  listGrid.innerHTML = ""

  if (!items.length) {
    listGrid.innerHTML = '<div class="empty">No available homes in this category yet.</div>'
    listCount.textContent = "0 listings"
    return
  }

  for (const item of items) {
    const hasPrice = Number.isFinite(item.min_price) && item.min_price > 0
    const priceText = hasPrice ? `From ${formatKES(item.min_price)} / month` : "Price shared by landlord"

    const card = document.createElement("article")
    card.className = "card"
    card.innerHTML = `
      <div class="card-photo" style="background-image: url('${item.photo || 'wallpaper.jpg'}'); background-size: cover; height: 200px;"></div>
      <div class="card-body">
        <h4 class="card-title">${item.title}</h4>
        <p class="card-meta">${item.area}, ${item.city}</p>
        <div class="badges">
          <span class="badge ${item.map_color || 'green'}">${statusLabel[item.map_color || 'green']}</span>
        </div>
        <p class="price">${priceText}</p>
        <a class="details-link" href="./property.html?id=${encodeURIComponent(item.id)}">View Details</a>
      </div>
    `

    listGrid.appendChild(card)
  }

  listCount.textContent = `${items.length} listings`
}

const applySearch = () => {
  const q = (searchInput.value || "").trim().toLowerCase()
  if (!q) {
    renderListings(listings)
    return
  }

  const filtered = listings.filter((item) => {
    const text = `${item.title} ${item.city} ${item.area}`.toLowerCase()
    return text.includes(q)
  })

  renderListings(filtered)
}

const loadListings = async () => {
  listTitle.textContent = classLabels[classKey] || "Listings"
  listSubtitle.textContent = "Showing verified properties."

  try {
    const queryParams = {};
    if (classKey) {
      // Map frontend category to backend property_class or property_type
      queryParams.property_class = classKey;
    }

    const data = await API.properties.listVerified(queryParams);
    const rawProperties = data.properties || [];

    listings = rawProperties.map(p => ({
      id: p.id,
      title: p.title,
      city: p.city,
      area: p.area || p.neighborhood || p.address || "",
      property_class: p.property_class,
      min_price: Number(p.min_price || 0),
      map_color: p.map_color || "green",
      photo: p.primary_photo_url
    }));

    renderListings(listings);
  } catch (error) {
    console.error("Failed to load listings:", error);
    listGrid.innerHTML = '<div class="empty">Error loading properties. Please try again.</div>';
  }
}

searchBtn.addEventListener("click", applySearch)
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    applySearch()
  }
})

loadListings()


searchBtn.addEventListener("click", applySearch)
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    applySearch()
  }
})

loadListings()
