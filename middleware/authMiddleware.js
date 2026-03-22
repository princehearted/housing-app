import jwt from "jsonwebtoken"
import supabase from "../config/supabaseClient.js"

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-env"

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || ""

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Bearer token" })
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.auth = payload
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || ""

  if (!authHeader.startsWith("Bearer ")) {
    return next()
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.auth = payload
    next()
  } catch (error) {
    // If token is invalid, we don't error out, just proceed without req.auth
    next()
  }
}

export const requireActiveUser = async (req, res, next) => {
  const appUserId = req.auth?.sub

  const { data, error } = await supabase
    .from("app_users")
    .select("id, is_active")
    .eq("id", appUserId)
    .maybeSingle()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  if (!data || data.is_active !== true) {
    return res.status(403).json({ error: "Account is not active" })
  }

  next()
}

export const requireTenantProfile = (req, res, next) => {
  if (!req.auth?.tenant_id) {
    return res.status(403).json({ error: "Tenant profile required" })
  }

  next()
}

export const requireVerifiedTenant = async (req, res, next) => {
  const tenantId = req.auth?.tenant_id

  const { data, error } = await supabase
    .from("tenants")
    .select("id, verified")
    .eq("id", tenantId)
    .maybeSingle()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  if (!data || data.verified !== true) {
    return res.status(403).json({ error: "Tenant verification required" })
  }

  next()
}

export const requireLandlordProfile = (req, res, next) => {
  if (!req.auth?.landlord_id) {
    return res.status(403).json({ error: "Landlord profile required" })
  }

  next()
}

export const requireVerifiedLandlord = async (req, res, next) => {
  const landlordId = req.auth?.landlord_id

  const { data, error } = await supabase
    .from("landlords")
    .select("id, verified")
    .eq("id", landlordId)
    .maybeSingle()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  if (!data || data.verified !== true) {
    return res.status(403).json({ error: "Landlord verification required" })
  }

  next()
}

export const requireAdminRole = (allowedRoles = ["admin", "master_admin"]) => {
  return (req, res, next) => {
    const adminRole = req.auth?.admin_role

    if (!adminRole || !allowedRoles.includes(adminRole)) {
      return res.status(403).json({ error: "Admin permission required" })
    }

    next()
  }
}
