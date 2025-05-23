import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  uploadProfileImage,
  getUserProfile,
  updateUserProfile,
  markUserOnline,
  markUserOffline,
  getUserOnlineStatus,
} from "../controllers/userController.js";
import { getContactProfile } from "../controllers/contactController.js";
import {upload} from "../middlewares/multer.js"

const router = express.Router();

router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router
  .route("/upload-profile-image")
  .post(protect, upload.single("profileImage"), uploadProfileImage);

router.route("/contact/:contactId").get(protect, getContactProfile);

// Online status routes
router.route("/online").post(protect, markUserOnline);
router.route("/offline").post(protect, markUserOffline);
router.route("/status/:userId").get(protect, getUserOnlineStatus);

export default router;
