import express from "express";
import {
  searchUsers,
  sendConnectionRequest,
  respondToConnectionRequest,
  getConnectionRequests,
  getContacts,
} from "../controllers/connectionController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/search", searchUsers);

router.post("/request", sendConnectionRequest);
router.post("/respond", respondToConnectionRequest);
router.get("/requests", getConnectionRequests);

router.get("/contacts", getContacts);

export default router;
