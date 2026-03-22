import express from "express"
import {
  addPropertyAmenity,
  createProperty,
  createUnit,
  createUnitType,
  getLandlordProperties,
  getPropertyDetails,
  listAmenityCatalog,
  listMapProperties,
  listPropertyAmenities,
  listShopListings,
  listVerifiedProperties,
  removePropertyAmenity,
  setPropertyAmenities,
  mockPropertyPhoto,
  mockPropertyDocument
} from "../controllers/propertyController.js"
import {
  requireActiveUser,
  requireAuth,
  optionalAuth,
  requireLandlordProfile,
  requireVerifiedLandlord
} from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/property/create", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, createProperty)
router.post("/unit-type/create", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, createUnitType)
router.post("/unit/create", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, createUnit)

router.get("/property-amenities/catalog", listAmenityCatalog)
router.get("/property/:id/amenities", listPropertyAmenities)
router.post("/property/:id/amenities", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, addPropertyAmenity)
router.put("/property/:id/amenities", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, setPropertyAmenities)
router.delete("/property/:id/amenities/:amenityKey", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, removePropertyAmenity)

router.get("/properties", listVerifiedProperties)
router.get("/my-properties", requireAuth, requireActiveUser, requireLandlordProfile, getLandlordProperties)
router.get("/properties/map", listMapProperties)
router.get("/shops", listShopListings)
router.get("/property/:id", optionalAuth, getPropertyDetails)

// Mock endpoints for layout testing
router.post("/property-photo/mock", requireAuth, requireActiveUser, requireLandlordProfile, mockPropertyPhoto)
router.post("/property-document/mock", requireAuth, requireActiveUser, requireLandlordProfile, mockPropertyDocument)

export default router
