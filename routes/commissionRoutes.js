import express from "express"
import {
  generateMonthlyCommission,
  getLandlordCommissionSummary,
  listAdminCommissionLedger,
  listLandlordCommissionLedger,
  markCommissionPaid
} from "../controllers/commissionController.js"
import {
  requireActiveUser,
  requireAdminRole,
  requireAuth,
  requireLandlordProfile,
  requireVerifiedLandlord
} from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/admin/commission/generate", requireAuth, requireAdminRole(["admin", "master_admin"]), generateMonthlyCommission)
router.get("/admin/commission/ledger", requireAuth, requireAdminRole(["admin", "master_admin"]), listAdminCommissionLedger)
router.post("/admin/commission/mark-paid", requireAuth, requireAdminRole(["admin", "master_admin"]), markCommissionPaid)

router.get("/landlord/me/commission/ledger", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, listLandlordCommissionLedger)
router.get("/landlord/me/commission/summary", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, getLandlordCommissionSummary)

export default router
