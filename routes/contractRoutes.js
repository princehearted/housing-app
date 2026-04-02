import express from "express"
import {
  createContract,
  getContractDetails,
  landlordSignContract,
  listLandlordContracts,
  listTenantContracts,
  tenantSignContract
} from "../controllers/contractController.js"
import {
  requireActiveUser,
  requireAuth,
  requireLandlordProfile,
  requireTenantProfile,
  requireVerifiedLandlord,
  requireVerifiedTenant
} from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/contract/create", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, createContract)
router.post("/contract/sign/tenant", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, tenantSignContract)
router.post("/contract/sign/landlord", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, landlordSignContract)
router.get("/contract/:id", requireAuth, requireActiveUser, getContractDetails)
router.get("/contracts/me/tenant", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, listTenantContracts)
router.get("/contracts/me/landlord", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, listLandlordContracts)

export default router
