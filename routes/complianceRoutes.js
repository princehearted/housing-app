import express from "express"
import {
  createAppUserComplianceCase,
  createLandlordComplianceCase,
  createTenantComplianceCase,
  listAdminAppUserComplianceCases,
  listAdminLandlordComplianceCases,
  listAdminTenantComplianceCases,
  listLandlordComplianceCases,
  listLandlordWarnings,
  listMyAppUserComplianceCases,
  listMyAppUserWarnings,
  listTenantComplianceCases,
  listTenantWarnings,
  sendAppUserWarning,
  sendLandlordWarning,
  sendTenantWarning,
  updateAppUserComplianceCaseStatus,
  updateLandlordComplianceCaseStatus,
  updateTenantComplianceCaseStatus
} from "../controllers/complianceController.js"
import {
  requireActiveUser,
  requireAdminRole,
  requireAuth,
  requireLandlordProfile,
  requireTenantProfile,
  requireVerifiedLandlord,
  requireVerifiedTenant
} from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/admin/compliance/landlord/case/create", requireAuth, requireAdminRole(["admin", "master_admin"]), createLandlordComplianceCase)
router.post("/admin/compliance/landlord/case/update-status", requireAuth, requireAdminRole(["admin", "master_admin"]), updateLandlordComplianceCaseStatus)
router.post("/admin/compliance/landlord/warning/send", requireAuth, requireAdminRole(["admin", "master_admin"]), sendLandlordWarning)
router.get("/admin/compliance/landlord/cases", requireAuth, requireAdminRole(["admin", "master_admin"]), listAdminLandlordComplianceCases)

router.post("/admin/compliance/tenant/case/create", requireAuth, requireAdminRole(["admin", "master_admin"]), createTenantComplianceCase)
router.post("/admin/compliance/tenant/case/update-status", requireAuth, requireAdminRole(["admin", "master_admin"]), updateTenantComplianceCaseStatus)
router.post("/admin/compliance/tenant/warning/send", requireAuth, requireAdminRole(["admin", "master_admin"]), sendTenantWarning)
router.get("/admin/compliance/tenant/cases", requireAuth, requireAdminRole(["admin", "master_admin"]), listAdminTenantComplianceCases)

router.post("/admin/compliance/app-user/case/create", requireAuth, requireAdminRole(["admin", "master_admin"]), createAppUserComplianceCase)
router.post("/admin/compliance/app-user/case/update-status", requireAuth, requireAdminRole(["admin", "master_admin"]), updateAppUserComplianceCaseStatus)
router.post("/admin/compliance/app-user/warning/send", requireAuth, requireAdminRole(["admin", "master_admin"]), sendAppUserWarning)
router.get("/admin/compliance/app-user/cases", requireAuth, requireAdminRole(["admin", "master_admin"]), listAdminAppUserComplianceCases)

router.get("/landlord/me/compliance/cases", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, listLandlordComplianceCases)
router.get("/landlord/me/compliance/warnings", requireAuth, requireActiveUser, requireLandlordProfile, requireVerifiedLandlord, listLandlordWarnings)

router.get("/tenant/me/compliance/cases", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, listTenantComplianceCases)
router.get("/tenant/me/compliance/warnings", requireAuth, requireActiveUser, requireTenantProfile, requireVerifiedTenant, listTenantWarnings)

router.get("/compliance/me/app-user/cases", requireAuth, requireActiveUser, listMyAppUserComplianceCases)
router.get("/compliance/me/app-user/warnings", requireAuth, requireActiveUser, listMyAppUserWarnings)

export default router
