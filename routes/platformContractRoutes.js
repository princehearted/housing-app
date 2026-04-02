import express from "express"
import {
  activatePropertyListingFromContract,
  createPlatformContract,
  listLandlordPlatformContracts,
  listPlatformContractsAdmin,
  updatePlatformContractStatus
} from "../controllers/platformContractController.js"
import {
  requireActiveUser,
  requireAdminRole,
  requireAuth,
  requireLandlordProfile,
  requireVerifiedLandlord
} from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/admin/platform-contract/create", requireAuth, requireAdminRole(["admin", "master_admin"]), createPlatformContract)
router.get("/admin/platform-contracts", requireAuth, requireAdminRole(["admin", "master_admin"]), listPlatformContractsAdmin)
router.post("/admin/platform-contract/update-status", requireAuth, requireAdminRole(["admin", "master_admin"]), updatePlatformContractStatus)
router.post("/admin/platform-contract/activate-listing", requireAuth, requireAdminRole(["admin", "master_admin"]), activatePropertyListingFromContract)

router.get("/landlord/me/platform-contracts", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, listLandlordPlatformContracts)

export default router
