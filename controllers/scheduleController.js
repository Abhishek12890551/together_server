import Schedule from "../models/scheduleModel.js";

export const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: req.user._id });
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
