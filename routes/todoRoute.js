import express from "express";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  updateTodoItem,
  getTodo,
} from "../controllers/todoController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getTodos).post(protect, createTodo);

router
  .route("/:id")
  .get(protect, getTodo)
  .put(protect, updateTodo)
  .delete(protect, deleteTodo);

router.route("/:id/items/:itemId").put(protect, updateTodoItem);

export default router;
