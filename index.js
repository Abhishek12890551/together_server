import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

import connectDB from "./config/db.js";

import eventRoutes from "./routes/eventRoute.js";
import todoRoutes from "./routes/todoRoute.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import authRoutes from "./routes/authRoute.js";
import conversationRoutes from "./routes/conversationRoute.js";
import userRoutes from "./routes/userRoutes.js";
import connectionRoutes from "./routes/connectionRoute.js";

import User from "./models/userModel.js";
import Conversation from "./models/conversationModel.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

export { io };

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

await connectDB();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error("Authentication error: Invalid token"));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.userId = user._id;
    socket.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
    };

    user.socketID = socket.id;
    user.isOnline = true;
    await user.save();

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Authentication error: " + error.message));
  }
});

io.on("connection", (socket) => {
  console.log(
    `A user connected: ${socket.id}, UserID: ${socket.userId}, Name: ${socket.user?.name}`
  );

  (async () => {
    try {
      const userConversations = await Conversation.find({
        participants: socket.userId,
      }).select("_id participants");

      if (userConversations && userConversations.length > 0) {
        console.log(
          `Notifying ${userConversations.length} conversations about user coming online`
        );

        userConversations.forEach((conversation) => {
          socket.join(conversation._id.toString());
          console.log(
            `Socket ${
              socket.id
            } joined conversation ${conversation._id.toString()}`
          );

          io.to(conversation._id.toString()).emit("userOnline", {
            userId: socket.userId,
            userName: socket.user?.name,
            timestamp: new Date().toISOString(),
          });
        });
      }
    } catch (error) {
      console.error("Error sending online notification:", error);
    }
  })();

  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });

  socket.on("joinConversation", async (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);

    socket.emit("joinedConversation", {
      conversationId,
      joined: true,
      timestamp: new Date().toISOString(),
    });

    socket.to(conversationId).emit("userJoined", {
      userId: socket.userId,
      userName: socket.user?.name,
      timestamp: new Date().toISOString(),
    });

    try {
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        const participantIds = conversation.participants.map((p) =>
          p.toString()
        );
        const onlineUsers = await User.find({
          _id: { $in: participantIds },
          isOnline: true,
          socketID: { $exists: true, $ne: null },
        }).select("_id name");

        socket.emit("conversationParticipantsStatus", {
          conversationId,
          onlineParticipants: onlineUsers.map((user) => ({
            userId: user._id,
            userName: user.name,
          })),
        });
      }
    } catch (err) {
      console.error("Error sending participants status:", err);
    }
  });
  socket.on("leaveConversation", (conversationId) => {
    socket.leave(conversationId);
    socket.emit("leftConversation", conversationId);
    socket.to(conversationId).emit("userLeft", {
      userId: socket.userId,
      userName: socket.user?.name,
    });
  });
  socket.on("sendMessage", async (data) => {
    try {
      console.log(`Message received from ${socket.userId}:`, data);
      const { content, conversationId, recipientId } = data;
      let actualConversationId = conversationId;
      let isNewConversation = false;

      if (!conversationId && recipientId) {
        const existingConversation = await Conversation.findOne({
          isGroupChat: false,
          participants: {
            $size: 2,
            $all: [socket.userId, recipientId],
          },
        });

        if (existingConversation) {
          console.log(
            `Using existing conversation with ID: ${existingConversation._id}`
          );
          actualConversationId = existingConversation._id;

          await Conversation.findByIdAndUpdate(actualConversationId, {
            $push: {
              messages: {
                senderId: socket.userId,
                content: content,
                timestamp: new Date(),
              },
            },
            $set: {
              lastMessage: {
                senderId: socket.userId,
                content: content,
                timestamp: new Date(),
              },
            },
          });
        } else {
          isNewConversation = true;

          const newConversation = new Conversation({
            participants: [socket.userId, recipientId],
            messages: [
              {
                senderId: socket.userId,
                content: content,
                timestamp: new Date(),
              },
            ],
            lastMessage: {
              senderId: socket.userId,
              content: content,
              timestamp: new Date(),
            },
          });

          await newConversation.save();
          actualConversationId = newConversation._id;
          console.log(
            `New conversation created with ID: ${actualConversationId}`
          );
        }
        const recipientUser = await User.findById(recipientId);
        if (recipientUser && recipientUser.socketID) {
          const populatedConversation = await Conversation.findById(
            actualConversationId
          )
            .populate("participants", "name email profileImageUrl")
            .populate("lastMessage.senderId", "name profileImageUrl");

          io.to(recipientUser.socketID).emit(
            "newConversationCreated",
            populatedConversation
          );
        }
      } else {
        const conversation = await Conversation.findByIdAndUpdate(
          actualConversationId,
          {
            $push: {
              messages: {
                senderId: socket.userId,
                content: content,
                timestamp: new Date(),
              },
            },
            $set: {
              lastMessage: {
                senderId: socket.userId,
                content: content,
                timestamp: new Date(),
              },
            },
          },
          { new: true }
        );

        if (!conversation) {
          throw new Error("Conversation not found");
        }
      }

      if (!conversationId) {
        const populatedConversation = await Conversation.findById(
          actualConversationId
        )
          .populate("participants", "name email profileImageUrl")
          .populate("lastMessage.senderId", "name profileImageUrl");

        socket.emit("newConversationCreated", populatedConversation);
      }

      const messageToSend = {
        _id: new Date().getTime().toString(),
        content: content,
        timestamp: new Date().toISOString(),
        sender: {
          _id: socket.userId,
          name: socket.user.name,
          profileImageUrl: socket.user.profileImageUrl,
        },
        conversationId: actualConversationId,
        readBy: [socket.userId],
      };

      io.to(actualConversationId).emit("newMessage", messageToSend);
      console.log(
        `Message broadcast to conversation room: ${actualConversationId}`
      );
    } catch (error) {
      console.error("Error in sendMessage:", error);
      socket.emit("messageError", { error: error.message });
    }
  });
  socket.on("messageRead", async (data) => {
    try {
      const { conversationId, messageId } = data;
      console.log(
        `Marking message as read. ConversationID: ${conversationId}, MessageID: ${messageId}`
      );

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        console.error(`Conversation not found: ${conversationId}`);
        return;
      }

      let messageFound = false;
      conversation.messages = conversation.messages.map((message) => {
        if (message._id.toString() === messageId || message._id === messageId) {
          messageFound = true;
          if (!message.readBy.includes(socket.userId)) {
            message.readBy.push(socket.userId);
            message.isRead = true;
          }
        }
        return message;
      });

      if (!messageFound) {
        console.warn(
          `Message ID ${messageId} not found in conversation ${conversationId}`
        );
        return;
      }

      await conversation.save();

      const updatedConversation = await Conversation.findById(conversationId)
        .populate("participants", "name email profileImageUrl")
        .populate("lastMessage.senderId", "name profileImageUrl");

      socket.to(conversationId).emit("messageRead", updatedConversation);
      socket.emit("messageRead", updatedConversation);

      const participants = updatedConversation.participants.filter(
        (participant) => participant._id.toString() !== socket.userId
      );
      participants.forEach((participant) => {
        if (participant.socketId) {
          socket
            .to(participant.socketId)
            .emit("messageRead", updatedConversation);
        }
      });
    } catch (error) {
      console.error("Error in messageRead handler:", error);
      socket.emit("error", { message: "Failed to mark message as read" });
    }
  });
  socket.on("typing", ({ conversationId, isTyping }) => {
    try {
      if (!conversationId) {
        return console.error("No conversationId provided for typing event");
      }

      socket.to(conversationId).emit("userTyping", {
        userId: socket.userId,
        userName: socket.user?.name,
        conversationId,
        isTyping,
      });

      console.log(
        `User ${socket.user?.name} ${
          isTyping ? "started" : "stopped"
        } typing in conversation ${conversationId}`
      );
    } catch (error) {
      console.error("Error in typing event:", error);
    }
  });

  socket.on(
    "getParticipantStatus",
    async ({ targetUserId, conversationId }) => {
      try {
        if (!targetUserId || !conversationId) {
          return console.error(
            "Missing targetUserId or conversationId in getParticipantStatus event"
          );
        }

        console.log(
          `Socket ${socket.id} requested status for user ${targetUserId} in conversation ${conversationId}`
        );
        const targetUser = await User.findById(targetUserId).select(
          "socketID isOnline name lastOnline"
        );

        if (!targetUser) {
          console.error(
            `User ${targetUserId} not found in getParticipantStatus request`
          );
          return;
        }

        const isOnline = targetUser.isOnline === true;

        socket.emit("participantStatus", {
          userId: targetUser._id,
          userName: targetUser.name,
          isOnline: isOnline,
          conversationId: conversationId,
        });

        console.log(
          `Emitted participantStatus for user ${targetUser._id} (${targetUser.name}): ${isOnline}`
        );
      } catch (error) {
        console.error("Error in getParticipantStatus handler:", error);
      }
    }
  );

  socket.on("userOnlineStatus", async ({ isOnline }) => {
    try {
      if (!socket.userId) {
        console.error("No user ID found for socket in userOnlineStatus event");
        return;
      }

      console.log(
        `User ${socket.userId} (${socket.user?.name}) is now ${
          isOnline ? "online" : "offline"
        }`
      );

      const user = await User.findById(socket.userId);
      if (!user) {
        return console.error(`User ${socket.userId} not found in database`);
      }

      user.isOnline = isOnline;

      if (!isOnline) {
        user.lastOnline = new Date();
      }

      await user.save();

      const userConversations = await Conversation.find({
        participants: socket.userId,
      }).select("_id participants");

      if (userConversations && userConversations.length > 0) {
        console.log(
          `Notifying ${userConversations.length} conversations about user ${
            isOnline ? "coming online" : "going offline"
          }`
        );

        const eventName = isOnline ? "userOnline" : "userOffline";
        const timestamp = new Date().toISOString();

        userConversations.forEach((conversation) => {
          io.to(conversation._id.toString()).emit(eventName, {
            userId: socket.userId,
            userName: socket.user?.name,
            timestamp: timestamp,
          });
        });
      }
    } catch (error) {
      console.error("Error in userOnlineStatus handler:", error);
    }
  });
  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.id}`);
    try {
      const user = await User.findById(socket.userId);
      if (user) {
        user.socketID = null;
        user.isOnline = false;
        user.lastOnline = new Date();
        await user.save();

        const userConversations = await Conversation.find({
          participants: socket.userId,
        }).select("_id participants");

        if (userConversations && userConversations.length > 0) {
          console.log(
            `Notifying ${userConversations.length} conversations about user going offline`
          );

          userConversations.forEach((conversation) => {
            io.to(conversation._id.toString()).emit("userOffline", {
              userId: socket.userId,
              userName: socket.user?.name,
              timestamp: new Date().toISOString(),
            });
          });
        }
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });

  socket.on("notifyGroupCreation", async (data) => {
    try {
      const { conversationId, participantIds } = data;

      if (
        !conversationId ||
        !participantIds ||
        !Array.isArray(participantIds)
      ) {
        return console.error("Invalid data for notifyGroupCreation event");
      }

      console.log(
        `Socket ${socket.id} is notifying about group creation ${conversationId}`
      );

      const onlineUsers = await User.find({
        _id: { $in: participantIds },
        isOnline: true,
        socketID: { $exists: true, $ne: null },
      });

      const conversation = await Conversation.findById(conversationId)
        .populate("participants", "name email profileImageUrl")
        .populate("groupAdmin", "name email profileImageUrl");

      if (!conversation) {
        return console.error(`Conversation ${conversationId} not found`);
      }

      onlineUsers.forEach((user) => {
        if (user.socketID && user._id.toString() !== socket.userId.toString()) {
          console.log(
            `Notifying ${user.name} (${user._id}) about group creation`
          );
          io.to(user.socketID).emit("newGroupConversation", conversation);
        }
      });
    } catch (err) {
      console.error("Error in notifyGroupCreation:", err);
    }
  });
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount,
  });
});

app.use("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Together API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/connections", connectionRoutes);

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  console.error("Stack trace:", err.stack);

  const isProduction = process.env.NODE_ENV === "production";

  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? "Internal Server Error" : err.message,
    stack: isProduction ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
