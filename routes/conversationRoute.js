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
import {upload} from "../middlewares/multer.js"



const router = express.Router();

router.use(protect);

router.route("/").get(getConversations);

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
