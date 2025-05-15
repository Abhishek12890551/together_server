import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import { io } from "../index.js";

export const getContactProfile = asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const currentUser = req.user._id;

  if (!contactId) {
    res.status(400);
    throw new Error("Contact ID is required");
  }

  try {
    const contact = await User.findById(contactId).select("-password");

    if (!contact) {
      res.status(404);
      throw new Error("Contact not found");
    }

    const isContact = await User.findOne({
      _id: currentUser,
      contacts: { $in: [contactId] },
    });

    if (!isContact) {
      res.status(403);
      throw new Error("You don't have permission to view this contact");
    }

    const contactData = {
      _id: contact._id,
      name: contact.name,
      email: contact.email,
      profileImageUrl: contact.profileImageUrl,
      joinDate: contact.createdAt,
      isOnline: false,
    };

    const connectedSockets = io.sockets.adapter.rooms.get(
      contact._id.toString()
    );
    if (connectedSockets && connectedSockets.size > 0) {
      contactData.isOnline = true;
    } else if (contact.lastOnline) {
      contactData.lastOnline = contact.lastOnline;
    }

    res.status(200).json({
      success: true,
      data: contactData,
    });
  } catch (error) {
    console.error("Error in getContactProfile:", error);
    res.status(500);
    throw new Error(error.message || "Server error retrieving contact profile");
  }
});
