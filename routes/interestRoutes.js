import express from "express"
import {
  createInterest,
  getTenantInterests,
  getLandlordInterests,
  respondToInterest
} from "../controllers/interestController.js"
import {
  requireActiveUser,
  requireAuth,
  requireTenantProfile,
  requireLandlordProfile
} from "../middleware/authMiddleware.js"

const router = express.Router()

// Tenant routes
router.post("/interest/create", requireAuth, requireActiveUser, requireTenantProfile, createInterest)
router.get("/interest/my", requireAuth, requireActiveUser, requireTenantProfile, getTenantInterests)

// Landlord routes  
router.get("/interest/landlord", requireAuth, requireActiveUser, requireLandlordProfile, getLandlordInterests)
router.post("/interest/respond", requireAuth, requireActiveUser, requireLandlordProfile, respondToInterest)

export default router
