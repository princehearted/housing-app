import express from "express"
import { upload, uploadDocument } from "../middleware/uploadMiddleware.js"
import {
  requireActiveUser,
  requireAdminRole,
  requireAuth,
  requireLandlordProfile,
  requireTenantProfile,
  requireVerifiedLandlord,
  requireVerifiedTenant
} from "../middleware/authMiddleware.js"
import {
  uploadLandlordVerificationDoc,
  uploadPlatformContractDocument,
  uploadPropertyDocument,
  uploadPropertyPhotos,
  uploadTenantDocument,
  uploadUnitPhotos,
  uploadUnitTypeFloorPlan
} from "../controllers/uploadController.js"

const router = express.Router()

router.post("/unit-photos", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, upload.array("photos", 10), uploadUnitPhotos)
router.post("/property-photos", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, upload.array("photos", 10), uploadPropertyPhotos)
router.post("/unit-type-floor-plan", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, uploadDocument.single("floor_plan"), uploadUnitTypeFloorPlan)
router.post("/landlord-verification-doc", requireAuth, requireActiveUser, requireLandlordProfile, uploadDocument.single("document"), uploadLandlordVerificationDoc)
router.post("/tenant-document", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, uploadDocument.single("document"), uploadTenantDocument)
router.post("/property-document", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, uploadDocument.single("document"), uploadPropertyDocument)
router.post("/platform-contract-document", requireAuth, requireAdminRole(["admin", "master_admin"]), uploadDocument.single("document"), uploadPlatformContractDocument)

export default router
