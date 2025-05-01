import express from "express";
import {
  getEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(authMiddleware, getEvents)
  .post(authMiddleware, createEvent);

router.route("/:id").get(getEventById).put(updateEvent).delete(deleteEvent);

export default router;
