import User from "../models/userModel.js";

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 3 characters",
      });
    }

    const users = await User.find({
      email: { $regex: query, $options: "i" },
      _id: { $ne: req.user._id },
    }).select("name email profileImageUrl");

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sendConnectionRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required",
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingRequest = recipient.connectionRequests.find(
      (request) => request.from.toString() === senderId.toString()
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Connection request already sent",
      });
    }

    if (recipient.contacts.includes(senderId)) {
      return res.status(400).json({
        success: false,
        message: "You are already connected with this user",
      });
    }

    recipient.connectionRequests.push({ from: senderId });
    await recipient.save();

    if (recipient.socketID) {
      req.io.to(recipient.socketID).emit("connectionRequest", {
        from: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          profileImageUrl: req.user.profileImageUrl,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Connection request sent successfully",
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const respondToConnectionRequest = async (req, res) => {
  try {
    const { senderId, action } = req.body;
    const userId = req.user._id;

    if (!senderId || !action) {
      return res.status(400).json({
        success: false,
        message: "Sender ID and action are required",
      });
    }

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'accept' or 'reject'",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const requestIndex = user.connectionRequests.findIndex(
      (request) => request.from.toString() === senderId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    if (action === "accept") {
      user.contacts.push(senderId);
      sender.contacts.push(userId);

      user.connectionRequests = user.connectionRequests.filter(
        (request) => request.from.toString() !== senderId
      );

      await Promise.all([user.save(), sender.save()]);

      if (sender.socketID) {
        req.io.to(sender.socketID).emit("connectionAccepted", {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: "Connection request accepted",
        contact: {
          _id: sender._id,
          name: sender.name,
          email: sender.email,
          profileImageUrl: sender.profileImageUrl,
        },
      });
    } else {
      user.connectionRequests = user.connectionRequests.filter(
        (request) => request.from.toString() !== senderId
      );

      await user.save();

      if (sender.socketID) {
        req.io.to(sender.socketID).emit("connectionRejected", {
          userId: user._id,
        });
      }

      res.status(200).json({
        success: true,
        message: "Connection request rejected",
      });
    }
  } catch (error) {
    console.error("Error responding to connection request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getConnectionRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "connectionRequests.from",
      "name email profileImageUrl"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user.connectionRequests,
    });
  } catch (error) {
    console.error("Error getting connection requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getContacts = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "contacts",
      "name email profileImageUrl"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user.contacts,
    });
  } catch (error) {
    console.error("Error getting contacts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
