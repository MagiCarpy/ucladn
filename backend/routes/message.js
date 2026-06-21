import express from "express";
import MessageController from "../controllers/messageController.js";
import requireAuth from "../middleware/auth.js";
import { upload } from "../middleware/imgFileValidator.js";

const router = express.Router();

router.post(
  "/:requestId",
  requireAuth,
  upload.single("attachment"),
  MessageController.sendMessage
);
router.get("/attachment/:filename", requireAuth, MessageController.getAttachment);
router.get("/:requestId", requireAuth, MessageController.getMessages);

export default router;
