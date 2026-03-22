import express from "express"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getMissingFields } from "../utils/validators.js"
import supabase from "../config/supabaseClient.js"

export const createInterest = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id
  const { property_id, unit_type_id, unit_id, tenant_message } = req.body

  if (!tenantId) {
    return res.status(403).json({ error: "Please login to express interest" })
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("verified")
    .eq("id", tenantId)
    .maybeSingle()

  if (!tenant || tenant.verified !== true) {
    return res.status(403).json({ error: "Please verify your account before expressing interest" })
  }

  if (!property_id || !unit_type_id || !unit_id) {
    return res.status(400).json({ error: "Property, unit type, and unit are required" })
  }

  // Check if already expressed interest
  const { data: existing } = await supabase
    .from("interests")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("property_id", property_id)
    .eq("unit_id", unit_id)
    .in("status", ["pending", "accepted"])
    .maybeSingle()

  if (existing) {
    return res.status(409).json({ error: "You've already expressed interest in this unit" })
  }

  // Get tenant info
  const { data: tenantInfo } = await supabase
    .from("tenants")
    .select("full_name, email, phone")
    .eq("id", tenantId)
    .maybeSingle()

  // Get property owner (landlord)
  const { data: property } = await supabase
    .from("properties")
    .select("id, owner_id, title")
    .eq("id", property_id)
    .maybeSingle()

  if (!property) {
    return res.status(404).json({ error: "Property not found" })
  }

  // Get landlord contact info
  const { data: landlord } = await supabase
    .from("landlords")
    .select("full_name, email, phone")
    .eq("id", property.owner_id)
    .maybeSingle()

  // Create interest record
  const { data: interest, error } = await supabase
    .from("interests")
    .insert([
      {
        tenant_id: tenantId,
        property_id,
        unit_type_id,
        unit_id,
        tenant_name: tenantInfo?.full_name || "Unknown",
        tenant_email: tenantInfo?.email || "",
        tenant_phone: tenantInfo?.phone || "",
        tenant_message: tenant_message || "",
        landlord_id: property.owner_id,
        status: "booked"
      }
    ])
    .select()
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Booking successful!",
    interest,
    landlord_contact: {
      name: landlord?.full_name || "Landlord",
      email: landlord?.email || "",
      phone: landlord?.phone || ""
    }
  })
})

export const getTenantInterests = asyncHandler(async (req, res) => {
  const tenantId = req.auth?.tenant_id

  if (!tenantId) {
    return res.status(403).json({ error: "Login required" })
  }

  const { data: interests, error } = await supabase
    .from("interests")
    .select(`
      *,
      property:properties(title, city, area),
      unit:units(unit_number)
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ interests: interests || [] })
})

export const getLandlordInterests = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id

  if (!landlordId) {
    return res.status(403).json({ error: "Landlord profile required" })
  }

  const { data: interests, error } = await supabase
    .from("interests")
    .select(`
      *,
      property:properties(title, city, area),
      unit:units(unit_number)
    `)
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({ interests: interests || [] })
})

export const respondToInterest = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { interest_id, action, response_message } = req.body

  if (!landlordId) {
    return res.status(403).json({ error: "Landlord profile required" })
  }

  if (!interest_id || !action) {
    return res.status(400).json({ error: "Interest ID and action required" })
  }

  if (!["complete", "cancel"].includes(action)) {
    return res.status(400).json({ error: "Action must be complete or cancel" })
  }

  const { data: interest, error: fetchError } = await supabase
    .from("interests")
    .select("*")
    .eq("id", interest_id)
    .eq("landlord_id", landlordId)
    .maybeSingle()

  if (fetchError) {
    return res.status(400).json({ error: fetchError.message })
  }

  if (!interest) {
    return res.status(404).json({ error: "Interest not found" })
  }

  const { data: updated, error } = await supabase
    .from("interests")
    .update({
      status: action === "complete" ? "completed" : "cancelled",
      landlord_response: response_message || "",
      responded_at: new Date().toISOString()
    })
    .eq("id", interest_id)
    .select()
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  const message = action === "complete" 
    ? "Booking completed!"
    : "Booking cancelled."

  res.json({ message, interest: updated })
})
