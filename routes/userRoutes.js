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
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

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
