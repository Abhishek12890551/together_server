import asyncHandler from "express-async-handler";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/userModel.js";

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profileImageUrl: updatedUser.profileImageUrl,
      joinDate: updatedUser.createdAt,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const uploadProfileImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No image file provided");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      fs.unlinkSync(req.file.path);
      res.status(404);
      throw new Error("User not found");
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "together_app/profiles",
      resource_type: "image",
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto" },
      ],
    });

    fs.unlinkSync(req.file.path);

    user.profileImageUrl = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      profileImageUrl: result.secure_url,
      message: "Profile image uploaded successfully",
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(error.statusCode || 500);
    throw new Error(error.message || "Error uploading profile image");
  }
});

const markUserOnline = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isOnline: true,
        socketID: req.body && req.body.socketId ? req.body.socketId : null,
      },
      { new: true }
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json({
      success: true,
      message: "User marked as online",
      data: {
        isOnline: user.isOnline,
        lastOnline: user.lastOnline,
      },
    });
  } catch (error) {
    console.error("Error marking user online:", error);
    res.status(500);
    throw new Error("Server error when marking user online");
  }
});

const markUserOffline = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const currentTime = new Date();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isOnline: false,
        lastOnline: currentTime,
        socketID: null,
      },
      { new: true }
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json({
      success: true,
      message: "User marked as offline",
      data: {
        isOnline: user.isOnline,
        lastOnline: user.lastOnline,
      },
    });
  } catch (error) {
    console.error("Error marking user offline:", error);
    res.status(500);
    throw new Error("Server error when marking user offline");
  }
});

const getUserOnlineStatus = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("isOnline lastOnline name");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        isOnline: user.isOnline,
        lastOnline: user.lastOnline,
      },
    });
  } catch (error) {
    console.error("Error getting user status:", error);
    res.status(500);
    throw new Error("Server error when getting user status");
  }
});

export {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  markUserOnline,
  markUserOffline,
  getUserOnlineStatus,
};
