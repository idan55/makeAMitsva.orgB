import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  startChat,
  getMessagesByChatId,
  postMessageToChat,
  uploadChatMedia,
  chatUploadMiddleware,
  listMyChats,
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/start", authenticateToken, startChat);
router.get("/my", authenticateToken, listMyChats);

router.post("/:chatId/messages", authenticateToken, postMessageToChat);
router.post("/:chatId/attachments", authenticateToken, chatUploadMiddleware, uploadChatMedia);

router.get("/:chatId/messages", authenticateToken, getMessagesByChatId);
export default router;
