import { Message } from "../models/message.model.js";
import { Request } from "../models/request.model.js";
import { User } from "../models/user.model.js";
import { PUBLIC_PATH, UPLOADS_PATH } from "../config/paths.js";
import { validateImgFile } from "../middleware/imgFileValidator.js";
import asyncHandler from "express-async-handler";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const MessageController = {
  sendMessage: asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Verify user has access to this request (requester or helper)
    const request = await Request.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.userId !== userId && request.helperId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to chat in this request" });
    }

    let attachmentUrl = null;

    // Handle file upload if present
    if (req.file) {
      try {
        const checkValidImg = await validateImgFile(req.file.buffer);
        if (!checkValidImg.valid) {
          return res.status(400).json({ message: checkValidImg.message });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `msg-${requestId}-${Date.now()}-${crypto.randomUUID()}${ext}`;
        const uploadPath = path.join(UPLOADS_PATH, filename);

        // Save file to filepath (private secure)
        await fs.writeFile(uploadPath, req.file.buffer);
        attachmentUrl = filename;
      } catch (err) {
        console.error("Message file upload error:", err);
        return res.status(500).json({ message: "Failed to upload attachment" });
      }
    }

    const message = await Message.create({
      requestId,
      senderId: userId,
      content,
      attachment: attachmentUrl,
    });

    // Fetch sender info to return with message
    const sender = await User.findByPk(userId, {
      attributes: ["username", "image"],
    });

    const message_data = {
      ...message.toJSON(),
      senderName: sender.username,
      senderPic: sender?.image ? sender.image : "default.jpg",
      attachment: message.attachment || null,
    };

    req.io.to(requestId.toString()).emit("message:sent", message_data);

    return res.status(201).json({
      message: "Message sent",
      data: message_data,
    });
  }),

  getMessages: asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Verify user has access
    const request = await Request.findByPk(requestId, { paranoid: false });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.userId !== userId && request.helperId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these messages" });
    }

    const messages = await Message.findAll({
      where: { requestId },
      include: [{ model: User, as: "sender", attributes: ["id", "username"] }],
      order: [["createdAt", "ASC"]],
      paranoid: false,
    });

    // Enrich messages with sender names (could be optimized with join)
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await User.findByPk(msg.senderId, {
          attributes: ["username", "image"],
        });
        return {
          ...msg.toJSON(),
          senderName: sender ? sender.username : "Unknown",
          senderPic: sender.image,
          attachment: msg.attachment || null,
        };
      }),
    );

    return res.status(200).json({ messages: enrichedMessages });
  }),

  getAttachment: asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { filename } = req.params;

    // Find the message that holds this attachment
    const message = await Message.findOne({ where: { attachment: filename } });
    if (!message) {
      return res.sendFile(path.join(PUBLIC_PATH, "default.jpg"));
    }

    // Find the request associated with the message
    let request = await Request.findByPk(message.requestId, {
      paranoid: false,
    });

    if (!request) {
      return res.sendFile(path.join(PUBLIC_PATH, "default.jpg"));
    }

    // Verify authorization: Only requester or helper
    if (request.userId !== req.user.id && request.helperId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this attachment" });
    }

    let filePath = path.join(PUBLIC_PATH, "default.jpg");
    const targetPath = path.join(UPLOADS_PATH, filename);
    try {
      await fs.access(targetPath);
      filePath = targetPath;
    } catch (err) {
      // File does not exist on disk, fallback to default.jpg
    }
    res.sendFile(filePath);
  }),
};

export default MessageController;
