import express from "express"
import { createBooking, respondToBooking, createRental } from "../controllers/bookingController.js"
import {
  requireActiveUser,
  requireAuth,
  requireLandlordProfile,
  requireTenantProfile,
  requireVerifiedLandlord,
  requireVerifiedTenant
} from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/booking/create", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, createBooking)
router.post("/booking/respond", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, respondToBooking)
router.post("/rental/create", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, createRental)

export default router
