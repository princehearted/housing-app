import express from "express"
import {
  approveDeletion,
  getAdminQueue,
  getAdmins,
  listDeletionRequests,
  masterOverrideProperty,
  promoteUserToAdmin,
  reviewLandlordDocument,
  reviewPropertyDocument,
  searchUsers,
  toggleAdminStatus,
  verifyProperty,
  verifyTenant
} from "../controllers/adminController.js"
import { requireAdminRole, requireAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/queue", requireAuth, requireAdminRole(["admin", "master_admin"]), getAdminQueue)
router.get("/deletion-requests", requireAuth, requireAdminRole(["admin", "master_admin"]), listDeletionRequests)
router.post("/approve-deletion", requireAuth, requireAdminRole(["admin", "master_admin"]), approveDeletion)
router.get("/admins", requireAuth, requireAdminRole(["master_admin"]), getAdmins)
router.get("/search-users", requireAuth, requireAdminRole(["master_admin"]), searchUsers)
router.post("/toggle-status", requireAuth, requireAdminRole(["master_admin"]), toggleAdminStatus)
router.post("/promote-user", requireAuth, requireAdminRole(["master_admin"]), promoteUserToAdmin)
router.post("/verify-property", requireAuth, requireAdminRole(["admin", "master_admin"]), verifyProperty)
router.post("/verify-tenant", requireAuth, requireAdminRole(["admin", "master_admin"]), verifyTenant)
router.post("/review-landlord-document", requireAuth, requireAdminRole(["admin", "master_admin"]), reviewLandlordDocument)
router.post("/review-property-document", requireAuth, requireAdminRole(["admin", "master_admin"]), reviewPropertyDocument)
router.post("/master-override-property", requireAuth, requireAdminRole(["master_admin"]), masterOverrideProperty)

export default router

