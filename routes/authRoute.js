import { Router } from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

export default router;
