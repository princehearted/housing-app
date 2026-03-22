import express from "express"
import { uploadIdImages } from "../middleware/uploadMiddleware.js"
import {
  requireActiveUser,
  requireAuth,
  requireTenantProfile,
  requireVerifiedTenant
} from "../middleware/authMiddleware.js"
import {
  addTenantFavorite,
  getTenantBookings,
  getTenantFavorites,
  registerTenant,
  registerTenantWithDocuments,
  removeTenantFavorite
} from "../controllers/tenantController.js"

const router = express.Router()

router.post("/register", registerTenant)
router.post(
  "/register-with-docs",
  uploadIdImages.fields([
    { name: "id_front", maxCount: 1 },
    { name: "id_back", maxCount: 1 }
  ]),
  registerTenantWithDocuments
)

router.post("/favorites/add", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, addTenantFavorite)
router.delete("/favorites/remove", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, removeTenantFavorite)

router.get("/me/favorites", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, getTenantFavorites)
router.get("/me/bookings", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, getTenantBookings)

router.get("/:tenant_id/favorites", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, getTenantFavorites)
router.get("/:tenant_id/bookings", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, getTenantBookings)

export default router

