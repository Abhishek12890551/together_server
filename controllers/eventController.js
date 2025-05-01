import Event from "../models/eventModel.js";

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id }).sort({
      startDate: 1,
    });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error" });
    console.error(error);
  }
};

export const createEvent = async (req, res) => {
  console.log("Creating event with body:", req.body);
  const userId = req.user._id; // Assuming you have user authentication and can get the user ID from the request
  try {
    const { title, description, startDate, endDate, location } = req.body;

    if (!title || !startDate) {
      return res
        .status(400)
        .json({ success: false, error: "Title and Start Date are required" });
    }

    const event = await Event.create({
      title,
      description,
      startDate,
      endDate,
      location,
      user: userId,
    });
    res.status(201).json({ success: true, data: event });
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

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    res.status(200).json({ success: true, data: event });
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

export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: event });
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

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    await event.deleteOne();

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
