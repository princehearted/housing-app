import express from "express"
import { getLandlordBookings, registerLandlord } from "../controllers/landlordController.js"
import {
  requireActiveUser,
  requireAuth,
  requireLandlordProfile,
  requireVerifiedLandlord
} from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/register", registerLandlord)
router.get("/me/bookings", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, getLandlordBookings)
router.get("/:landlord_id/bookings", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, getLandlordBookings)

export default router
