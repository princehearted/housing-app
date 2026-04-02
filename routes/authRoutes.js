import express from "express"
import multer from "multer"
import { activateLandlord, login, me, register, updateProfile, changePassword, requestDeletion } from "../controllers/authController.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post("/register", register)
router.post("/register-with-docs", upload.fields([
  { name: "id_front", maxCount: 1 },
  { name: "id_back", maxCount: 1 }
]), register)
router.post("/login", login)
router.post("/request-deletion", requireAuth, requestDeletion)
router.get("/me", requireAuth, me)
router.post("/activate-landlord", requireAuth, activateLandlord)
router.put("/update-profile", requireAuth, updateProfile)
router.put("/change-password", requireAuth, changePassword)

export default router
