import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.userId = decoded.id;
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error("Authorization Error in Middleware:", error.message);
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token failed (invalid)",
        });
      }
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ success: false, message: "Not authorized, token expired" });
      }
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
};
