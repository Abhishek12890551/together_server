import Schedule from "../models/scheduleModel.js";

export const getSchedules = async (req, res) => {
  try {
    const queryConditions = { userId: req.user._id };
    let isDateSpecificQuery = false; // Flag to check if it's a date-specific query

    if (req.query.date) {
      isDateSpecificQuery = true;
      // req.query.date is expected to be in "YYYY-MM-DD" format
      const requestedDateString = req.query.date;
      const requestedDate = new Date(requestedDateString);

      // Validate the date string
      if (isNaN(requestedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format provided. Please use YYYY-MM-DD.",
        });
      }

      // Construct date range for the given day in UTC
      // new Date("YYYY-MM-DD") parses as UTC midnight
      const year = requestedDate.getUTCFullYear();
      const month = requestedDate.getUTCMonth(); // 0-indexed
      const day = requestedDate.getUTCDate();

      const startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

      queryConditions.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const schedules = await Schedule.find(queryConditions).sort({
      startTime: 1,
    }); // Optional: sort by start time

    if (isDateSpecificQuery) {
      // If it's a date-specific query (e.g., from home page), wrap in 'data'
      res.status(200).json({ data: schedules });
    } else {
      // Otherwise (e.g., from schedule page fetching all), return array directly
      res.status(200).json(schedules);
    }
  } catch (error) {
    console.error("Error in getSchedules:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch schedules: " + error.message });
  }
};

export const createSchedule = async (req, res) => {
  console.log("Inside createSchedule controller");
  console.log("Request body:", req.body);
  const userId = req.user._id;
  const { date, startTime, endTime, category, note } = req.body;
  try {
    const newSchedule = new Schedule({
      date,
      startTime,
      endTime,
      category,
      note,
      userId,
    });
    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime, category, note } = req.body;
  try {
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      { date, startTime, endTime, category, note },
      { new: true }
    );
    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json(updatedSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedSchedule = await Schedule.findByIdAndDelete(id);
    if (!deletedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
