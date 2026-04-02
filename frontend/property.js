const titleEl = document.getElementById("property-title")
const locationEl = document.getElementById("property-location")
const descriptionEl = document.getElementById("property-description")
const metaEl = document.getElementById("property-meta")
const amenitiesEl = document.getElementById("amenities-list")
const unitsContainer = document.getElementById("units-container")
const interestSection = document.getElementById("interest-section")
const selectedUnitName = document.getElementById("selected-unit-name")
const selectedUnitPrice = document.getElementById("selected-unit-price")
const landlordContactEl = document.getElementById("landlord-contact")

const interestForm = document.getElementById("interest-form")
const interestEmail = document.getElementById("interest-email")
const interestPhone = document.getElementById("interest-phone")
const interestNotes = document.getElementById("interest-notes")
const interestStatus = document.getElementById("interest-status")
const interestSubmit = document.getElementById("interest-submit")

const token = localStorage.getItem("auth_token")
const user = JSON.parse(localStorage.getItem("user_data") || "{}")

if (!token) {
  window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href)
}

const isVerified = user.tenant_id && user.is_verified === true

const navLogin = document.getElementById("nav-login")
const navUser = document.getElementById("nav-user")
const logoutBtn = document.getElementById("logout-btn")

if (token) {
  navLogin.style.display = "none"
  navUser.style.display = "inline"
  navUser.textContent = user.full_name || "User"
  logoutBtn.style.display = "inline"
  
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    window.location.href = "./login.html"
  })
}

const formatKES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(amount)

const params = new URLSearchParams(window.location.search)
const propertyId = params.get("id")

let currentProperty = null
let currentUnitType = null

const amenityIcons = {
  parking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v12"/><circle cx="18" cy="9" r="5"/><path d="M15 17h3a2 2 0 002-2v-4a2 2 0 00-2-2h-3m-6 0H6a2 2 0 00-2 2v4a2 2 0 002 2h3"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>',
  water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
  security: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  generator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64A9 9 0 015.64 19.36"/><path d="M18 2v6h6"/><circle cx="12" cy="12" r="9"/></svg>',
  elevator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h2M14 14h2"/></svg>',
  gym: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5h11M6.5 17.5h11M3 12h3a2 2 0 012 2v3m-6-9a2 2 0 012-2h3m6 0a2 2 0 012 2v3m-6-9V6"/></svg>',
  pool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h2a2 2 0 012 2v4a2 2 0 01-2 2H4v-8z"/><path d="M20 12h-2a2 2 0 00-2 2v4a2 2 0 002 2h2v-8z"/><path d="M4 8v8c4 0 8-2 8-8v-0z"/></svg>'
}

const getAmenityIcon = (key) => amenityIcons[key] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>'

const setStatus = (message, tone = "info") => {
  interestStatus.textContent = message
  interestStatus.dataset.tone = tone
}

const renderGallery = (photos, propertyPhotos) => {
  const allPhotos = [...(propertyPhotos || []), ...(photos || [])]
  const mainImage = document.getElementById("main-image")
  const thumbs = document.getElementById("thumbnails")
  
  if (!allPhotos.length) {
    mainImage.innerHTML = `
      <div class="placeholder-img">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        <span>Property Photo</span>
      </div>
    `
    thumbs.innerHTML = ""
    return
  }

  const showPhoto = (url) => {
    mainImage.innerHTML = `<img src="${url}" alt="Property photo" />`
    document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"))
    document.querySelector(`.thumb[data-src="${url}"]`)?.classList.add("active")
  }

  thumbs.innerHTML = allPhotos.map((p, i) => `
    <div class="thumb ${i === 0 ? 'active' : ''}" data-src="${p.photo_url || p}">
      <img src="${p.photo_url || p}" alt="Thumbnail" />
    </div>
  `).join("")

  document.querySelectorAll(".thumb").forEach(thumb => {
    thumb.addEventListener("click", () => showPhoto(thumb.dataset.src))
  })

  showPhoto(allPhotos[0].photo_url || allPhotos[0])
}

const renderAmenities = (amenities) => {
  if (!amenities || !amenities.length) {
    amenitiesEl.innerHTML = '<p class="subtext">No amenities listed yet</p>'
    return
  }

  amenitiesEl.innerHTML = amenities.map(a => `
    <div class="amenity-tag">
      ${getAmenityIcon(a.amenity_key)}
      <span>${a.amenity_label}</span>
    </div>
  `).join("")
}

const renderUnits = (unitTypes) => {
  if (!unitTypes || !unitTypes.length) {
    unitsContainer.innerHTML = '<div class="empty">No units available yet</div>'
    return
  }

  unitsContainer.innerHTML = unitTypes.map((ut, idx) => {
    const units = ut.units || []
    const availableUnits = units.filter(u => u.is_available === true)
    const photos = ut.photos || []
    const floorPlan = ut.floor_plan_image_url

    return `
      <div class="unit-accordion-item" data-index="${idx}">
        <div class="unit-header" onclick="toggleUnit(${idx})">
          <div class="unit-header-info">
            <div class="unit-type-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div class="unit-header-text">
              <h4>${ut.name || "Unit Type"}</h4>
              <p>${ut.size_sqm || "-"} sqm</p>
            </div>
          </div>
          <div class="unit-header-price">
            <div class="price">${Number(ut.price) ? formatKES(ut.price) + "/mo" : "Contact for price"}</div>
            <div class="${availableUnits.length ? 'available' : 'unavailable'}">${availableUnits.length} available</div>
          </div>
        </div>
        <div class="unit-content" id="unit-content-${idx}">
          ${photos.length ? `
            <div class="unit-photos">
              ${photos.map(p => `<div class="unit-photo"><img src="${p.photo_url}" alt="Unit photo" /></div>`).join("")}
            </div>
          ` : ""}
          
          ${floorPlan ? `
            <div class="floor-plan-section">
              <h5>Floor Plan</h5>
              <img src="${floorPlan}" alt="Floor plan" />
            </div>
          ` : ""}

          <div class="unit-list">
            <h5>Individual Units</h5>
            ${units.map(u => `
              <div class="unit-item ${u.is_available ? 'available' : ''}">
                <div class="unit-item-info">
                  <span class="unit-item-number">Unit ${u.unit_number}</span>
                  <span class="unit-item-floor">Floor ${u.floor || "-"}</span>
                </div>
                <button 
                  class="book-unit-btn" 
                  ${!u.is_available ? 'disabled' : ''}
                  onclick="selectUnit('${ut.id}', '${u.id}', '${ut.name}', ${ut.price})">
                  ${u.is_available ? 'Book' : 'Occupied'}
                </button>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `
  }).join("")
}

window.toggleUnit = (index) => {
  const content = document.getElementById(`unit-content-${index}`)
  content.classList.toggle("open")
}

window.selectUnit = (unitTypeId, unitId, unitName, price) => {
  currentUnitType = { unitTypeId, unitId, unitName, price }
  
  selectedUnitName.textContent = unitName
  selectedUnitPrice.textContent = Number(price) ? formatKES(price) + "/mo" : "Contact for price"
  
  if (!isVerified) {
    interestSection.style.display = "block"
    interestSection.scrollIntoView({ behavior: "smooth" })
    interestForm.innerHTML = `
      <div class="info-box" style="background:#fef3c7;border-color:#f59e0b;">
        <p style="color:#92400e;margin:0;">⚠️ <strong>Verification Required</strong></p>
        <p style="color:#92400e;margin:8px 0 0;">You need to verify your account before you can book properties. Please complete your verification on the dashboard.</p>
        <a href="./tenant-dashboard.html" class="btn-primary" style="display:inline-block;margin-top:12px;text-align:center;max-width:200px;">Go to Dashboard</a>
      </div>
    `
    return
  }
  
  interestForm.innerHTML = `
    <div class="booking-notice">
      <p>📢 By booking, you agree to the house rules and terms of service above.</p>
    </div>
    <label>
      Your Email
      <input id="interest-email" type="email" placeholder="your@email.com" required />
    </label>
    <label>
      Your Phone Number
      <input id="interest-phone" type="tel" placeholder="+254712345678" required />
    </label>
    <label>
      Why are you interested? (optional)
      <textarea id="interest-notes" placeholder="Tell the landlord a bit about yourself..." rows="3"></textarea>
    </label>
    <button id="interest-submit" type="submit" class="btn-primary">Book Now</button>
    <p id="interest-status" class="form-status"></p>
  `
  
  interestSection.style.display = "block"
  interestSection.scrollIntoView({ behavior: "smooth" })
  
  const savedUser = JSON.parse(localStorage.getItem("user_data") || "{}")
  if (savedUser.email) interestEmail.value = savedUser.email
  if (savedUser.phone) interestPhone.value = savedUser.phone
}

const loadProperty = async (id) => {
  try {
    const response = await fetch(`/api/property/${encodeURIComponent(id)}`)

    if (!response.ok) {
      throw new Error(`Property request failed with ${response.status}`)
    }

    const payload = await response.json()
    const property = payload.property

    if (!property) {
      throw new Error("Property payload missing")
    }

    currentProperty = property

    titleEl.textContent = property.title || "Untitled Property"
    locationEl.textContent = [property.area, property.neighborhood, property.city].filter(Boolean).join(", ")
    descriptionEl.textContent = property.description || "No description yet."

    const metaBadges = [
      property.property_type,
      property.property_class,
      property.verification_status
    ].filter(Boolean)

    metaEl.innerHTML = metaBadges.map(x => `<span class="badge soft">${x}</span>`).join("")

    renderGallery(property.photos || [], property.photos)
    renderAmenities(property.amenities || [])
    renderUnits(property.unit_types || [])

    if (property.house_rules) {
      document.getElementById("house-rules-section").style.display = "block"
      document.getElementById("house-rules-content").innerHTML = `<p>${property.house_rules}</p>`
    }

    if (property.terms_of_service) {
      document.getElementById("terms-section").style.display = "block"
      document.getElementById("terms-content").innerHTML = `<p>${property.terms_of_service}</p>`
    }

    landlordContactEl.innerHTML = `
      <div class="info-box">
        <p>📞 Contact details will be shown after you book!</p>
      </div>
    `
  } catch (error) {
    console.error(error)
    titleEl.textContent = "Unable to load property"
    descriptionEl.textContent = "Please go back and try another listing."
    unitsContainer.innerHTML = '<div class="empty">Details unavailable.</div>'
    setStatus("Error loading property.", "warn")
  }
}

interestForm.addEventListener("submit", async (event) => {
  event.preventDefault()

  if (!currentUnitType) {
    setStatus("Please select a unit first", "error")
    return
  }

  const email = interestEmail.value.trim()
  const phone = interestPhone.value.trim()

  if (!email || !phone) {
    setStatus("Please fill in all required fields", "error")
    return
  }

  setStatus("Sending your interest...", "info")
  interestSubmit.disabled = true

  const savedToken = localStorage.getItem("auth_token")

  if (!savedToken) {
    setStatus("Please login first to express interest", "warn")
    interestSubmit.disabled = false
    setTimeout(() => {
      window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href)
    }, 1500)
    return
  }

  try {
    const response = await fetch("/api/interest/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${savedToken}`
      },
      body: JSON.stringify({
        property_id: propertyId,
        unit_type_id: currentUnitType.unitTypeId,
        unit_id: currentUnitType.unitId,
        tenant_message: interestNotes.value.trim()
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to book")
    }

    setStatus("Booking successful! Here's the landlord contact:", "success")
    interestSubmit.disabled = true
    
    if (result.landlord_contact) {
      landlordContactEl.innerHTML = `
        <div class="contact-details">
          <p><strong>📞 ${result.landlord_contact.name || "Landlord"}</strong></p>
          <p>📧 ${result.landlord_contact.email || ""}</p>
          <p>📱 ${result.landlord_contact.phone || ""}</p>
          <p style="margin-top:12px;color:#666;font-size:13px;">The landlord has been notified of your booking.</p>
        </div>
      `
    }
    
    setTimeout(() => {
      interestSection.style.display = "none"
    }, 5000)
  } catch (error) {
    setStatus(error.message || "Failed to express interest", "error")
    interestSubmit.disabled = false
  }
})

if (!propertyId) {
  titleEl.textContent = "Property ID missing"
  descriptionEl.textContent = "Open this page from a listing card so we can load details."
} else {
  loadProperty(propertyId)
}
