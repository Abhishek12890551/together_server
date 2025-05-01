import express from "express";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  updateTodoItem,
  getTodo,
} from "../controllers/todoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(authMiddleware, getTodos)
  .post(authMiddleware, createTodo);

router
  .route("/:id")
  .get(authMiddleware, getTodo)
  .put(authMiddleware, updateTodo)
  .delete(authMiddleware, deleteTodo);

router.route("/:id/items/:itemId").put(authMiddleware, updateTodoItem);

export default router;
