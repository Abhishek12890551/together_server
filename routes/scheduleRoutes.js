import express from "express";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(authMiddleware, getSchedules)
  .post(authMiddleware, createSchedule);

router.route("/:id").put(updateSchedule).delete(deleteSchedule);

export default router;
