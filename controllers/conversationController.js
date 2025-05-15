import Conversation from "../models/conversationModel.js";
import User from "../models/userModel.js";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.userId })
      .populate("participants", "name email profileImageUrl")
      .populate({
        path: "lastMessage.senderId",
        select: "name profileImageUrl",
      })
      .sort({ "lastMessage.timestamp": -1, updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error(
      "ConversationController: Error fetching conversations:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error fetching conversations.",
    });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log(
      `ConversationController: Fetching conversation with ID: ${conversationId} for user: ${req.userId}`
    );

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.userId,
    }).populate("participants", "name email profileImageUrl");

    console.log(
      `ConversationController: Found conversation: ${
        conversation ? "Yes" : "No"
      }`
    );
    if (conversation) {
      console.log(
        `ConversationController: Conversation details - Group: ${conversation.isGroupChat}, Participants: ${conversation.participants.length}`
      );
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant.",
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error(
      "ConversationController: Error fetching conversation:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error fetching conversation.",
    });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 30, beforeMessageId } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant.",
      });
    }

    await Conversation.populate(conversation, [
      { path: "messages.senderId", select: "name email profileImageUrl" },
      { path: "messages.readBy", select: "name _id" },
    ]);

    let messagesToReturn = [...conversation.messages].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (beforeMessageId) {
      const cursorMessageIndex = messagesToReturn.findIndex(
        (msg) => msg._id.toString() === beforeMessageId
      );
      if (cursorMessageIndex > -1) {
        messagesToReturn = messagesToReturn.slice(cursorMessageIndex + 1);
      }
    }

    messagesToReturn = messagesToReturn.slice(0, parseInt(String(limit)));

    const formattedMessages = messagesToReturn
      .map((msg) => ({
        _id: msg._id.toString(),
        content: msg.content,
        timestamp: msg.timestamp,
        sender: msg.senderId
          ? {
              _id: msg.senderId._id.toString(),
              name: msg.senderId.name,
              email: msg.senderId.email,
              profileImageUrl: msg.senderId.profileImageUrl,
            }
          : null,
        readBy: msg.readBy ? msg.readBy.map((user) => user._id.toString()) : [],
        conversationId: conversation._id.toString(),
      }))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    res.status(200).json({
      success: true,
      messages: formattedMessages,
      conversationId: conversation._id.toString(),
    });
  } catch (error) {
    console.error("ConversationController: Error fetching messages:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching messages." });
  }
};

export const createGroupConversation = async (req, res) => {
  const { participantIds, groupName } = req.body;
  const adminId = req.userId;

  if (
    !participantIds ||
    !Array.isArray(participantIds) ||
    participantIds.length < 1 ||
    !groupName
  ) {
    return res.status(400).json({
      success: false,
      message: "Participant IDs (as an array) and group name are required.",
    });
  }

  const allParticipantStrings = [
    ...new Set([
      ...participantIds.map((id) => id.toString()),
      adminId.toString(),
    ]),
  ];

  if (allParticipantStrings.length < 2) {
    return res.status(400).json({
      success: false,
      message: "A group chat must have at least two unique participants.",
    });
  }

  try {
    const existingUsersCount = await User.countDocuments({
      _id: { $in: allParticipantStrings },
    });
    if (existingUsersCount !== allParticipantStrings.length) {
      return res.status(400).json({
        success: false,
        message:
          "One or more specified participant IDs are invalid or do not exist.",
      });
    }

    const newGroup = new Conversation({
      participants: allParticipantStrings,
      isGroupChat: true,
      groupName: groupName.trim(),
      groupAdmin: adminId,
      messages: [],
      lastMessage: null,
    });

    await newGroup.save();

    const populatedGroup = await Conversation.findById(newGroup._id)
      .populate("participants", "name email profileImageUrl")
      .populate("groupAdmin", "name email profileImageUrl");

    const io = req.io;
    if (io) {
      const participantUsers = await User.find({
        _id: { $in: allParticipantStrings },
        socketID: { $exists: true, $ne: null },
      });

      participantUsers.forEach((participantUser) => {
        if (participantUser.socketID) {
          io.to(participantUser.socketID).emit(
            "newGroupConversation",
            populatedGroup
          );
        }
      });
    }

    res.status(201).json({
      success: true,
      data: populatedGroup,
      message: "Group created successfully",
    });
  } catch (error) {
    console.error("ConversationController: Error creating group:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating group conversation.",
    });
  }
};

export const addMemberToGroup = async (req, res) => {
  const { conversationId, userId } = req.body;
  const requestingUserId = req.userId;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group conversation",
      });
    }

    if (conversation.groupAdmin.toString() !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: "Only group admin can add members",
      });
    }

    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (conversation.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this group",
      });
    }

    conversation.participants.push(userId);
    await conversation.save();

    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "name email profileImageUrl")
      .populate("groupAdmin", "name email profileImageUrl");

    const io = req.io;
    if (io) {
      conversation.participants.forEach((participantId) => {
        io.to(`user-${participantId}`).emit(
          "groupUpdated",
          updatedConversation
        );
      });

      io.to(`user-${userId}`).emit("addedToGroup", updatedConversation);
    }

    res.status(200).json({
      success: true,
      data: updatedConversation,
      message: "Member added to group successfully",
    });
  } catch (error) {
    console.error("Error adding member to group:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding member to group",
    });
  }
};

export const removeMemberFromGroup = async (req, res) => {
  const { conversationId, userId } = req.body;
  const requestingUserId = req.userId;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group conversation",
      });
    }

    if (conversation.groupAdmin.toString() !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: "Only group admin can remove members",
      });
    }

    if (userId === conversation.groupAdmin.toString()) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot be removed from the group",
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== userId
    );
    await conversation.save();

    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "name email profileImageUrl")
      .populate("groupAdmin", "name email profileImageUrl");

    const io = req.io;
    if (io) {
      conversation.participants.forEach((participantId) => {
        io.to(`user-${participantId}`).emit(
          "groupUpdated",
          updatedConversation
        );
      });

      io.to(`user-${userId}`).emit("removedFromGroup", { conversationId });
    }

    res.status(200).json({
      success: true,
      data: updatedConversation,
      message: "Member removed from group successfully",
    });
  } catch (error) {
    console.error("Error removing member from group:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing member from group",
    });
  }
};

export const leaveGroup = async (req, res) => {
  const { conversationId } = req.body;
  const userId = req.userId;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group conversation",
      });
    }

    if (
      !conversation.participants.map((id) => id.toString()).includes(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    if (conversation.groupAdmin.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "As the admin, you should delete the group instead of leaving",
      });
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== userId
    );
    await conversation.save();

    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "name email profileImageUrl")
      .populate("groupAdmin", "name email profileImageUrl");

    const io = req.io;
    if (io) {
      conversation.participants.forEach((participantId) => {
        io.to(`user-${participantId}`).emit(
          "groupUpdated",
          updatedConversation
        );
      });

      io.to(`user-${userId}`).emit("leftGroup", { conversationId });
    }

    res.status(200).json({
      success: true,
      message: "You have left the group successfully",
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({
      success: false,
      message: "Server error while leaving group",
    });
  }
};

export const deleteGroupConversation = async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.userId;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: "This is not a group conversation",
      });
    }

    if (conversation.groupAdmin.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only group admin can delete the group",
      });
    }

    const participantIds = [...conversation.participants];

    await Conversation.findByIdAndDelete(conversationId);

    const io = req.io;
    if (io) {
      participantIds.forEach((participantId) => {
        io.to(`user-${participantId}`).emit("groupDeleted", { conversationId });
      });
    }

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting group",
    });
  }
};

export const updateGroupImage = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!conversation.isGroupChat) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "This is not a group conversation",
      });
    }

    if (conversation.groupAdmin.toString() !== userId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: "Only group admin can update group image",
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "upload",
      resource_type: "image",
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto" },
      ],
    });

    fs.unlinkSync(req.file.path);

    conversation.groupImageUrl = result.secure_url;
    await conversation.save();

    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "name email profileImageUrl")
      .populate("groupAdmin", "name email profileImageUrl");

    const io = req.io;
    if (io) {
      conversation.participants.forEach((participantId) => {
        io.to(`user-${participantId}`).emit(
          "groupUpdated",
          updatedConversation
        );
      });
    }

    res.status(200).json({
      success: true,
      groupImageUrl: result.secure_url,
      conversation: updatedConversation,
      message: "Group image updated successfully",
    });
  } catch (error) {
    console.error("Error updating group image:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Server error updating group image",
    });
  }
};
