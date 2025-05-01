import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^\d{1,2}\.\d{2}$/, "Start time must be in HH.MM format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^\d{1,2}\.\d{2}$/, "End time must be in HH.MM format"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Hangout",
        "Meeting",
        "Cooking",
        "Party",
        "Family",
        "Appointment",
        "Birthday",
        "Exercise",
        "Study",
        "Shopping",
        "Weekend",
        "Other",
      ],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot be more than 500 characters"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);
export default Schedule;
