import mongoose from "mongoose";

const TodoItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add item text"],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true, timestamps: true }
);

const TodoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add list title"],
      trim: true,
    },
    items: [TodoItemSchema],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Todo = mongoose.model("Todo", TodoSchema);
export default Todo;
