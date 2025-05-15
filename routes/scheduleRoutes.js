import express from "express";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getSchedules).post(protect, createSchedule);

router.route("/:id").put(updateSchedule).delete(deleteSchedule);

export default router;
