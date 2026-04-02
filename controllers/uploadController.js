import supabase from "../config/supabaseClient.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadPublicFiles } from "../services/storageService.js"

const allowedDocumentTypes = ["national_id", "passport", "driving_license"]

const ensureFiles = (files, res) => {
  if (!files || files.length === 0) {
    res.status(400).json({ error: "No files uploaded" })
    return false
  }
  return true
}

const buildPrivateFilePath = (prefix, entityId, originalName) => {
  const safeName = originalName.replace(/\s+/g, "-")
  return `${prefix}/${entityId}/${Date.now()}-${safeName}`
}

const uploadSinglePrivateFile = async ({ bucket, filePath, file }) => {
  const { error } = await supabase
    .storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    })

  return error
}

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

const ensureLandlordOwnsUnitType = async (landlordId, unitTypeId) => {
  const { data, error } = await supabase
    .from("unit_types")
    .select("id, property_id")
    .eq("id", unitTypeId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return false
  }

  return ensureLandlordOwnsProperty(landlordId, data.property_id)
}

export const uploadUnitPhotos = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { unit_type_id } = req.body

  if (!unit_type_id) {
    return res.status(400).json({ error: "unit_type_id required" })
  }

  if (!ensureFiles(req.files, res)) {
    return
  }

  const hasAccess = await ensureLandlordOwnsUnitType(landlordId, unit_type_id)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only upload photos for your own unit types" })
  }

  const uploadedUrls = await uploadPublicFiles({
    bucket: "unit_photos",
    folderId: unit_type_id,
    files: req.files
  })

  const { error } = await supabase
    .from("unit_type_photos")
    .insert(uploadedUrls.map((url) => ({ unit_type_id, photo_url: url })))

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Unit photos uploaded",
    photos: uploadedUrls
  })
})

export const uploadPropertyPhotos = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { property_id } = req.body

  if (!property_id) {
    return res.status(400).json({ error: "property_id required" })
  }

  if (!ensureFiles(req.files, res)) {
    return
  }

  const hasAccess = await ensureLandlordOwnsProperty(landlordId, property_id)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only upload photos for your own properties" })
  }

  const uploadedUrls = await uploadPublicFiles({
    bucket: "property_photos",
    folderId: property_id,
    files: req.files
  })

  const { error } = await supabase
    .from("property_photos")
    .insert(uploadedUrls.map((url) => ({ property_id, photo_url: url })))

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.json({
    message: "Property photos uploaded",
    photos: uploadedUrls
  })
})

export const uploadLandlordVerificationDoc = asyncHandler(async (req, res) => {
  const landlord_id = req.auth?.landlord_id
  const { document_type } = req.body

  if (!landlord_id) {
    return res.status(403).json({ error: "Landlord profile required" })
  }

  if (!document_type) {
    return res.status(400).json({ error: "document_type required" })
  }

  if (!allowedDocumentTypes.includes(document_type)) {
    return res.status(400).json({
      error: "document_type must be one of: national_id, passport, driving_license"
    })
  }

  if (!req.file) {
    return res.status(400).json({ error: "document file is required" })
  }

  const { data: landlord, error: landlordError } = await supabase
    .from("landlords")
    .select("id")
    .eq("id", landlord_id)
    .maybeSingle()

  if (landlordError) {
    return res.status(400).json({ error: landlordError.message })
  }

  if (!landlord) {
    return res.status(404).json({ error: "Landlord not found" })
  }

  const filePath = buildPrivateFilePath("landlord", landlord_id, req.file.originalname)

  const uploadError = await uploadSinglePrivateFile({
    bucket: "verification_documents",
    filePath,
    file: req.file
  })

  if (uploadError) {
    return res.status(400).json({ error: uploadError.message })
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("landlord_verification_documents")
    .insert([
      {
        landlord_id,
        document_type,
        document_url: filePath,
        verification_status: "pending"
      }
    ])
    .select()

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  res.json({
    message: "Verification document uploaded",
    data: insertedRows?.[0] || null
  })
})

export const uploadTenantDocument = asyncHandler(async (req, res) => {
  const tenant_id = req.auth?.tenant_id
  const { document_type } = req.body

  if (!tenant_id) {
    return res.status(403).json({ error: "Tenant profile required" })
  }

  if (!document_type) {
    return res.status(400).json({ error: "document_type required" })
  }

  if (!req.file) {
    return res.status(400).json({ error: "document file is required" })
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenant_id)
    .maybeSingle()

  if (tenantError) {
    return res.status(400).json({ error: tenantError.message })
  }

  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found" })
  }

  const filePath = buildPrivateFilePath("tenant", tenant_id, req.file.originalname)

  const uploadError = await uploadSinglePrivateFile({
    bucket: "user_documents",
    filePath,
    file: req.file
  })

  if (uploadError) {
    return res.status(400).json({ error: uploadError.message })
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("tenant_documents")
    .insert([
      {
        tenant_id,
        document_type,
        file_url: filePath
      }
    ])
    .select()

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  res.json({
    message: "Tenant document uploaded",
    data: insertedRows?.[0] || null
  })
})

export const uploadPropertyDocument = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { property_id, document_type } = req.body

  if (!property_id) {
    return res.status(400).json({ error: "property_id required" })
  }

  if (!document_type) {
    return res.status(400).json({ error: "document_type required" })
  }

  if (!req.file) {
    return res.status(400).json({ error: "document file is required" })
  }

  const hasAccess = await ensureLandlordOwnsProperty(landlordId, property_id)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only upload documents for your own properties" })
  }

  const filePath = buildPrivateFilePath("property", property_id, req.file.originalname)

  const uploadError = await uploadSinglePrivateFile({
    bucket: "property-documents",
    filePath,
    file: req.file
  })

  if (uploadError) {
    return res.status(400).json({ error: uploadError.message })
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("property_documents_db")
    .insert([
      {
        property_id,
        document_type,
        file_url: filePath
      }
    ])
    .select()

  if (insertError) {
    return res.status(400).json({ error: insertError.message })
  }

  res.json({
    message: "Property document uploaded",
    data: insertedRows?.[0] || null
  })
})

export const uploadUnitTypeFloorPlan = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { unit_type_id } = req.body

  if (!unit_type_id) {
    return res.status(400).json({ error: "unit_type_id required" })
  }

  if (!req.file) {
    return res.status(400).json({ error: "floor_plan file is required" })
  }

  const hasAccess = await ensureLandlordOwnsUnitType(landlordId, unit_type_id)
  if (!hasAccess) {
    return res.status(403).json({ error: "You can only upload floor plans for your own unit types" })
  }

  const safeName = req.file.originalname.replace(/\s+/g, "-")
  const filePath = `${unit_type_id}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase
    .storage
    .from("unit-type-floor-plans")
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true
    })

  if (uploadError) {
    return res.status(400).json({ error: uploadError.message })
  }

  const { data: publicData } = supabase
    .storage
    .from("unit-type-floor-plans")
    .getPublicUrl(filePath)

  const { data: updatedRows, error: updateError } = await supabase
    .from("unit_types")
    .update({ floor_plan_image_url: publicData.publicUrl })
    .eq("id", unit_type_id)
    .select()

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  res.json({
    message: "Floor plan uploaded",
    floor_plan_url: publicData.publicUrl,
    unit_type: updatedRows?.[0] || null
  })
})

export const uploadContractDocument = asyncHandler(async (req, res) => {
  const landlordId = req.auth?.landlord_id
  const { contract_id } = req.body

  if (!contract_id) {
    return res.status(400).json({ error: "contract_id required" })
  }

  if (!req.file) {
    return res.status(400).json({ error: "document file is required" })
  }

  const { data: contract, error: contractError } = await supabase
    .from("rental_contracts")
    .select("id, landlord_id")
    .eq("id", contract_id)
    .maybeSingle()

  if (contractError) {
    return res.status(400).json({ error: contractError.message })
  }

  if (!contract) {
    return res.status(404).json({ error: "Contract not found" })
  }

  if (contract.landlord_id !== landlordId) {
    return res.status(403).json({ error: "You can only upload documents for your own contracts" })
  }

  const filePath = buildPrivateFilePath("contract", contract_id, req.file.originalname)

  const uploadError = await uploadSinglePrivateFile({
    bucket: "property-documents",
    filePath,
    file: req.file
  })

  if (uploadError) {
    return res.status(400).json({ error: uploadError.message })
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("rental_contracts")
    .update({ signed_document_url: filePath })
    .eq("id", contract_id)
    .select("id, contract_status, signed_document_url")

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  res.json({
    message: "Contract document uploaded",
    data: updatedRows?.[0] || null
  })
})

export const uploadPlatformContractDocument = asyncHandler(async (req, res) => {
  const adminUserId = req.auth?.admin_user_id
  const { contract_id } = req.body

  if (!adminUserId) {
    return res.status(403).json({ error: "Admin permission required" })
  }

  if (!contract_id) {
    return res.status(400).json({ error: "contract_id required" })
  }

  if (!req.file) {
    return res.status(400).json({ error: "document file is required" })
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id, is_active")
    .eq("id", adminUserId)
    .maybeSingle()

  if (adminError) {
    return res.status(400).json({ error: adminError.message })
  }

  if (!adminUser || adminUser.is_active !== true) {
    return res.status(403).json({ error: "Invalid or inactive admin user" })
  }

  const { data: contract, error: contractError } = await supabase
    .from("landlord_platform_contracts")
    .select("id")
    .eq("id", contract_id)
    .maybeSingle()

  if (contractError) {
    return res.status(400).json({ error: contractError.message })
  }

  if (!contract) {
    return res.status(404).json({ error: "Platform contract not found" })
  }

  const filePath = buildPrivateFilePath("platform-contract", contract_id, req.file.originalname)

  const uploadError = await uploadSinglePrivateFile({
    bucket: "property-documents",
    filePath,
    file: req.file
  })

  if (uploadError) {
    return res.status(400).json({ error: uploadError.message })
  }

  const signedAt = new Date().toISOString()

  const { data: updatedRows, error: updateError } = await supabase
    .from("landlord_platform_contracts")
    .update({
      signed_document_url: filePath,
      signed_at: signedAt
    })
    .eq("id", contract_id)
    .select("id, status, signed_document_url, signed_at")

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  res.json({
    message: "Platform contract document uploaded",
    data: updatedRows?.[0] || null
  })
})
