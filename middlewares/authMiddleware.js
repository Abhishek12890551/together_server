import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authMiddleware = async (req, res, next) => {
  //   console.log("Inside authMiddleware");
  //   console.log("Request headers:", req.headers); // Log the request headers for debugging
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // Verify the token (this is a placeholder, implement your own verification logic)
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Find the user in the database (this is a placeholder, implement your own logic)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    // Attach the user to the request object for use in the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in authMiddleware:", error); // Log the error for debugging
    return res.status(500).json({ message: "Server error" });
  }
};
