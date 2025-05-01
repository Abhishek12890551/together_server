import Todo from "../models/todoModel.js";

export const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, count: todos.length, data: todos });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error" });
    console.error(error);
  }
};

export const createTodo = async (req, res) => {
  try {
    console.log("Inside createTodo controller");
    console.log("Request body:", req.body);
    const { title, items } = req.body;

    if (!title || !items) {
      return res
        .status(400)
        .json({ success: false, error: "Please add all fields" });
    }

    const todo = await Todo.create({
      title,
      items,
      user: req.user._id,
    });

    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, error: messages });
    } else {
      res.status(500).json({ success: false, error: "Server Error" });
      console.error(error);
    }
  }
};

export const updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ success: false, error: "Todo not found" });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updatedTodo });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid ID format" });
    } else if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, error: messages });
    } else {
      res.status(500).json({ success: false, error: "Server Error" });
      console.error(error);
    }
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ success: false, error: "Todo not found" });
    }

    await todo.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid ID format" });
    } else {
      res.status(500).json({ success: false, error: "Server Error" });
      console.error(error);
    }
  }
};

export const updateTodoItem = async (req, res) => {
  try {
    console.log("Inside updateTodoItem controller");
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ success: false, error: "Todo not found" });
    }

    const itemId = req.params.itemId;
    const completed = req.body.completed;

    const itemIndex = todo.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    todo.items[itemIndex].completed = completed;
    const f = todo.items.some((item) => item.completed !== true);

    todo.completed = !f;
    await todo.save();

    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid ID format" });
    } else {
      res.status(500).json({ success: false, error: "Server Error" });
      console.error(error);
    }
  }
};

export const getTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ success: false, error: "Todo not found" });
    }

    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid ID format" });
    } else {
      res.status(500).json({ success: false, error: "Server Error" });
      console.error(error);
    }
  }
};
