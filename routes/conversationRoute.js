import express from "express";
import {
  getConversations,
  getConversationMessages,
  getConversationById,
  createGroupConversation,
  addMemberToGroup,
  removeMemberFromGroup,
  leaveGroup,
  deleteGroupConversation,
  updateGroupImage,
} from "../controllers/conversationController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";
import Conversation from "../models/conversationModel.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getConversations);

router.get("/find/:otherUserId", protect, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.otherUserId;

    const users = [currentUserId, otherUserId].sort();

    const conversation = await Conversation.findOne({
      isGroupChat: false,
      participants: { $all: users },
    });

    if (conversation) {
      res.status(200).json({ success: true, conversationId: conversation._id });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
  } catch (error) {
    console.error("Error finding conversation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.route("/group").post(createGroupConversation);

router.route("/:conversationId").get(getConversationById);
router.route("/:id").delete(deleteGroupConversation);

router.route("/:conversationId/messages").get(getConversationMessages);

router.route("/add-member").post(addMemberToGroup);
router.route("/remove-member").post(removeMemberFromGroup);
router.route("/leave-group").post(leaveGroup);

router
  .route("/update-group-image")
  .post(protect, upload.single("groupImage"), updateGroupImage);

export default router;
