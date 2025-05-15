import Event from "../models/eventModel.js";

export const getEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    let queryConditions = { user: userId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);

      queryConditions.startDate = {
        $gte: start,
        $lte: end,
      };
      console.log(
        `EventController: Fetching events for user ${userId} between ${start.toISOString()} and ${end.toISOString()}`
      );
    } else {
      console.log(
        `EventController: Fetching ALL events for user ${userId} (no date range specified).`
      );
    }

    const events = await Event.find(queryConditions).sort({
      startDate: 1,
    });

    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error("EventController: Server Error in getEvents:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error retrieving events" });
  }
};

export const createEvent = async (req, res) => {
  const userId = req.user._id;
  try {
    const { title, description, startDate, endDate, location, category } =
      req.body;

    if (!title || !startDate) {
      return res
        .status(400)
        .json({ success: false, message: "Title and Start Date are required" });
    }

    const event = await Event.create({
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      location,
      user: userId,
      category,
    });
    console.log("EventController: Event created successfully:", event._id);
    res.status(201).json({
      success: true,
      data: event,
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("EventController: Server Error in createEvent:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Server Error creating event" });
    }
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!event) {
      console.log(
        `EventController: Event not found or not authorized for ID: ${req.params.id}, User: ${req.user._id}`
      );
      return res
        .status(404)
        .json({ success: false, message: "Event not found or not authorized" });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error("EventController: Server Error in getEventById:", error);
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Event ID format" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Server Error retrieving event" });
    }
  }
};

export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findOne({ _id: req.params.id, user: req.user._id });

    if (!event) {
      console.log(
        `EventController: Event not found or not authorized for update. ID: ${req.params.id}, User: ${req.user._id}`
      );
      return res
        .status(404)
        .json({ success: false, message: "Event not found or not authorized" });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedEvent) {
      console.log(
        `EventController: Event ${req.params.id} found by findOne but not by findByIdAndUpdate.`
      );
      return res
        .status(404)
        .json({ success: false, message: "Event update failed unexpectedly." });
    }

    console.log(
      "EventController: Event updated successfully:",
      updatedEvent._id
    );
    res.status(200).json({
      success: true,
      data: updatedEvent,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("EventController: Server Error in updateEvent:", error);
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Event ID format" });
    } else if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Server Error updating event" });
    }
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!event) {
      console.log(
        `EventController: Event not found or not authorized for delete. ID: ${req.params.id}, User: ${req.user._id}`
      );
      return res
        .status(404)
        .json({ success: false, message: "Event not found or not authorized" });
    }

    console.log("EventController: Event deleted successfully:", req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("EventController: Server Error in deleteEvent:", error);
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Event ID format" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Server Error deleting event" });
    }
  }
};
