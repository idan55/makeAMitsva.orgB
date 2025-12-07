import Chat from "../models/chatModel.js";
import { Request } from "../models/requestModel.js";
import { v2 as cloudinaryV2 } from "cloudinary";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
export const chatUploadMiddleware = upload.single("file");

export const getMessagesByChatId = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate("messages.sender");
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    // Ensure messages from deleted users still render with a placeholder
    const sanitizedMessages = chat.messages.map((m) => {
      if (m.sender) return m;
      return {
        ...m.toObject(),
        sender: { _id: "deleted", name: "Deleted user" },
      };
    });

    res.json({ messages: sanitizedMessages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const postMessageToChat = async (req, res) => {
  try {
    const { text = "", attachments = [] } = req.body;
    const trimmed = text.trim();
    const parsedAttachments = Array.isArray(attachments)
      ? attachments
          .map((a) => ({
            url: a.url,
            type: a.type || "file",
            publicId: a.publicId,
            originalName: a.originalName,
          }))
          .filter((a) => a.url)
      : [];

    if (!trimmed && parsedAttachments.length === 0) {
      return res.status(400).json({ error: "Message must have text or attachment" });
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const message = {
      sender: req.user.id,
      text: trimmed,
      attachments: parsedAttachments,
      createdAt: new Date(),
    };

    chat.messages.push(message);
    await chat.save();

    // populate AFTER save, BEFORE sending
    await chat.populate("messages.sender");
    const lastMessage = chat.messages[chat.messages.length - 1];

    return res.status(201).json({
      message: lastMessage,
      messages: chat.messages,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const uploadChatMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinaryV2.uploader.upload_stream(
        { folder: "chat-media", resource_type: "auto" },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const type =
      uploadResult.resource_type === "video"
        ? "video"
        : uploadResult.format?.match(/(jpg|jpeg|png|gif|webp)/i)
        ? "image"
        : "file";

    return res.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      type,
      originalName: req.file.originalname,
    });
  } catch (err) {
    console.error("uploadChatMedia error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const startChat = async (req, res) => {
  try {
    const { otherUserId, requestId } = req.body;
    const currentUserId = req.user.id;

    if (!otherUserId) return res.status(400).json({ error: "otherUserId is required" });
    if (!requestId) return res.status(400).json({ error: "requestId is required" });

    if (otherUserId === currentUserId) {
      return res.status(400).json({ error: "Cannot start chat with yourself" });
    }

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const participants = [currentUserId, otherUserId].sort();

    let chat = await Chat.findOne({
      participants: { $all: participants, $size: participants.length },
      request: requestId,
    });

    if (!chat) {
      chat = await Chat.create({ participants, request: requestId, messages: [] });
    }

    return res.json({ chatId: chat._id, chat });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const listMyChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate("participants", "name email profileImage")
      .populate("request", "title createdBy completedBy");

    const formatted = chats.map((chat) => {
      const lastMessageRaw = chat.messages[chat.messages.length - 1] || null;
      const lastMessage =
        lastMessageRaw && !lastMessageRaw.sender
          ? { ...lastMessageRaw.toObject(), sender: { _id: "deleted", name: "Deleted user" } }
          : lastMessageRaw;

      const safeParticipants = (chat.participants || []).map((p) => {
        if (p) return p;
        return { _id: "deleted", name: "Deleted user" };
      });

      return {
        id: chat._id,
        requestId: chat.request?._id || null,
        requestTitle: chat.request?.title || "Request",
        participants: safeParticipants,
        lastMessage,
        updatedAt: chat.updatedAt,
      };
    });

    res.json({ chats: formatted });
  } catch (err) {
    console.error("listMyChats error:", err);
    res.status(500).json({ error: err.message });
  }
};
