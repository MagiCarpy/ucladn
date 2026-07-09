import { Request } from "../models/request.model.js";
import { Message } from "../models/message.model.js";
import { validateImgFile } from "../middleware/imgFileValidator.js";
import { User } from "../models/user.model.js";
import { PUBLIC_PATH, UPLOADS_PATH } from "../config/paths.js";
import fs from "fs/promises";
import asyncHandler from "express-async-handler";
import path from "path";

const RequestController = {
  // CREATE REQUEST
  create: asyncHandler(async (req, res) => {
    const {
      item,
      description,
      pickupLocation,
      dropoffLocation,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    } = req.body;

    if (!req.user.id)
      return res.status(401).json({ message: "Not authenticated" });

    if (!item || !pickupLocation || !dropoffLocation)
      return res.status(400).json({ message: "Missing fields" });

    if (item.length > 50)
      return res.status(422).json({ message: "Invalid item length" });

    if (description && description.length > 150)
      return res.status(422).json({ message: "Description too long" });

    const newReq = await Request.create({
      userId: req.user.id,
      item,
      description,
      pickupLocation,
      dropoffLocation,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    });

    // Add request poster user info to the request
    const fullReq = await Request.findByPk(newReq.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["username", "image"],
        },
      ],
    });

    req.io.emit("request:created", fullReq);

    res.status(201).json({ message: "Request created", request: newReq });
  }),

  // LIST
  list: asyncHandler(async (req, res) => {
    const requests = await Request.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["username", "image"],
        },
        {
          model: User,
          as: "helper",
          attributes: ["username", "image"],
        },
      ],
    });
    res.status(200).json({ requests });
  }),

  // GET ONE
  getOne: asyncHandler(async (req, res) => {
    const id = req.params.id;
    const reqData = await Request.findOne({ where: { id }, paranoid: false });

    if (!reqData) return res.status(404).json({ message: "Request not found" });

    res.status(200).json({ request: reqData });
  }),

  // ACCEPT
  accept: asyncHandler(async (req, res) => {
    if (!req.user.id)
      return res.status(401).json({ message: "Not authenticated" });

    const id = req.params.id;
    const helperId = req.user.id;

    // Prevent multiple active deliveries
    const active = await Request.findOne({
      where: { helperId, status: "accepted" },
    });
    if (active) {
      return res.status(400).json({
        message: "You already have an active delivery.",
        activeRequestId: active.id,
      });
    }

    const reqData = await Request.findByPk(id);
    if (!reqData) return res.status(404).json({ message: "Request not found" });

    if (reqData.userId === helperId) {
      return res
        .status(400)
        .json({ message: "You can't accept your own request." });
    }

    if (reqData.status !== "open")
      return res.status(400).json({ message: "Already accepted or closed" });

    reqData.helperId = helperId;
    reqData.status = "accepted";
    await reqData.save();

    // Add user and helper info to the request
    const updatedReq = await Request.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["username", "image"] },
        { model: User, as: "helper", attributes: ["username", "image"] },
      ],
    });

    // update Map
    req.io.emit("request:updated", updatedReq);

    // join room
    req.io.emit("join_chat", reqData.id);

    res.status(200).json({ message: "Request accepted", request: reqData });
  }),

  // UPLOAD PHOTO
  uploadPhoto: asyncHandler(async (req, res) => {
    if (!req.user.id)
      return res.status(401).json({ message: "Not authenticated" });

    const id = req.params.id;
    const reqData = await Request.findByPk(id);

    if (!reqData) return res.status(404).json({ message: "Request not found" });

    if (reqData.helperId !== req.user.id)
      return res.status(403).json({ message: "Not your delivery." });

    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });

    const checkValidImg = await validateImgFile(req.file.buffer);

    if (!checkValidImg.valid) {
      return res.status(400).json({ message: checkValidImg.message });
    }

    // Rename for added security
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `msg-${
      reqData.id
    }-${Date.now()}-${crypto.randomUUID()}${ext}`;
    const uploadPath = path.join(UPLOADS_PATH, filename);

    // Save file to filepath (private secure)
    await fs.writeFile(uploadPath, req.file.buffer);
    reqData.deliveryPhotoUrl = filename;
    await reqData.save();

    const updatedReq = await Request.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["username", "image"] },
        { model: User, as: "helper", attributes: ["username", "image"] },
      ],
    });
    req.io.emit("request:updated", updatedReq);

    res.json({
      message: "Photo uploaded successfully",
      url: reqData.deliveryPhotoUrl,
    });
  }),

  // GET PHOTO (secure authenticated download)
  getPhoto: asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id;
    let reqData = await Request.findByPk(id, { paranoid: false });

    if (!reqData) {
      return res.sendFile(path.join(PUBLIC_PATH, "default.jpg"));
    }

    if (reqData.userId !== req.user.id && reqData.helperId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this photo" });
    }

    let filePath = path.join(PUBLIC_PATH, "default.jpg");

    if (reqData.deliveryPhotoUrl) {
      const targetPath = path.join(UPLOADS_PATH, reqData.deliveryPhotoUrl);
      try {
        await fs.access(targetPath);
        filePath = targetPath;
      } catch (err) {
        // File does not exist on disk, fallback to default.jpg
      }
    }

    res.sendFile(filePath);
  }),

  // COMPLETE DELIVERY (helper)
  completeDelivery: asyncHandler(async (req, res) => {
    const id = req.params.id;
    const reqData = await Request.findByPk(id);

    if (!reqData) return res.status(404).json({ message: "Request not found" });

    if (reqData.helperId !== req.user.id)
      return res.status(403).json({ message: "Not your delivery." });

    if (!reqData.deliveryPhotoUrl)
      return res
        .status(400)
        .json({ message: "Upload a delivery photo first." });

    const message = await Message.create({
      requestId: reqData.id,
      senderId: reqData.helperId,
      content: ">-Confirm-Delivery-<",
      attachment: reqData.deliveryPhotoUrl,
    });

    reqData.status = "completed";
    await reqData.save();

    // Add user and helper info to the request
    const updatedReq = await Request.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["username", "image"] },
        { model: User, as: "helper", attributes: ["username", "image"] },
      ],
    });
    req.io.emit("request:updated", updatedReq);

    const message_data = {
      ...message.toJSON(),
      senderName: updatedReq.helper.username,
      senderPic: updatedReq.helper.image,
      attachment: message.attachment || null,
    };

    req.io.emit("message:sent", message_data);

    res.json({ message: "Delivery completed", request: reqData });
  }),

  // HELPER CANCELS DELIVERY
  cancelDelivery: asyncHandler(async (req, res) => {
    const id = req.params.id;
    const reqData = await Request.findByPk(id);

    if (!reqData) return res.status(404).json({ message: "Request not found" });

    if (reqData.helperId !== req.user.id)
      return res
        .status(403)
        .json({ message: "You are not the helper for this request." });

    if (reqData.status !== "accepted")
      return res.status(400).json({
        message: "Cannot cancel — request is not currently accepted.",
      });

    reqData.status = "open";
    reqData.helperId = null;
    reqData.deliveryPhotoUrl = null;
    reqData.receiverConfirmed = "pending";

    await reqData.save();

    // Add user and helper info to the request
    const updatedReq = await Request.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["username", "image"] },
        { model: User, as: "helper", attributes: ["username", "image"] },
      ],
    });
    req.io.emit("request:updated", updatedReq);

    res.json({
      message: "Delivery canceled and request reopened",
      request: reqData,
    });
  }),

  // RECEIVER CONFIRMS RECEIVED
  confirmReceived: asyncHandler(async (req, res) => {
    const id = req.params.id;
    const reqData = await Request.findByPk(id);

    if (!reqData) return res.status(404).json({ message: "Request not found" });

    if (reqData.userId !== req.user.id)
      return res.status(403).json({ message: "Not your request." });

    reqData.status = "completed";
    reqData.receiverConfirmed = "received";
    await reqData.save();
    // Delete associated messages so they aren't orphaned in the database
    await Message.destroy({ where: { request_id: id } });

    await reqData.destroy();
    req.io.emit("request:deleted", { id });

    res.json({ message: "Request completed and archived" });
  }),

  // RECEIVER CONFIRMS NOT RECEIVED
  confirmNotReceived: asyncHandler(async (req, res) => {
    const id = req.params.id;
    const reqData = await Request.findByPk(id);

    if (!reqData) return res.status(404).json({ message: "Request not found" });

    if (reqData.userId !== req.user.id)
      return res.status(403).json({ message: "Not your request." });

    reqData.status = "open";
    reqData.helperId = null;
    reqData.deliveryPhotoUrl = null;
    reqData.receiverConfirmed = "pending";

    await reqData.save();

    //
    const updatedReq = await Request.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["username", "image"] },
        { model: User, as: "helper", attributes: ["username", "image"] },
      ],
    });

    // FIXME: handle multiple chats (if accept or cancel)

    req.io.emit("request:updated", updatedReq);

    res.json({
      message: "Request reopened for others to accept",
      request: reqData,
    });
  }),

  // DELETE
  delete: asyncHandler(async (req, res) => {
    const id = req.params.id;

    const reqData = await Request.findByPk(id);
    if (!reqData) return res.status(404).json({ message: "Request not found" });

    if (reqData.userId !== req.user.id)
      return res.status(403).json({ message: "Not allowed" });

    await reqData.destroy();

    req.io.emit("request:deleted", { id });

    res.json({ message: "Request deleted" });
  }),

  // GET USER STATS
  getUserStats: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const currentAsRequester = await Request.findAll({ where: { userId } });
    const currentAsCourier = await Request.findAll({
      where: { helperId: userId },
    });
    const activeAsRequester = await Request.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    const activeAsCourier = await Request.findAll({
      where: { helperId: userId },
      order: [["createdAt", "DESC"]],
    });

    const archivedAsRequester = await Request.findAll({
      where: { userId, status: "completed" },
      paranoid: false,
      order: [["createdAt", "DESC"]],
    });

    const archivedAsCourier = await Request.findAll({
      where: { helperId: userId, status: "completed" },
      paranoid: false,
      order: [["createdAt", "DESC"]],
    });

    const completedDeliveries = archivedAsCourier;
    const completedRequests = archivedAsRequester;

    const received = archivedAsRequester.filter(
      (req) => req.receiverConfirmed === "received"
    );

    // Compute simple weekly activity
    const now = new Date();
    const days = [...Array(14)].map((_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (13 - i));
      return day.toISOString().split("T")[0]; // YYYY-MM-DD
    });

    const deliveriesPerDay = days.map(
      (day) =>
        completedDeliveries.filter((req) =>
          req.updatedAt.toISOString().startsWith(day)
        ).length
    );

    const requestsPerDay = days.map(
      (day) =>
        completedRequests.filter((req) =>
          req.updatedAt.toISOString().startsWith(day)
        ).length
    );

    res.json({
      asRequester: [...activeAsRequester, ...archivedAsRequester],
      asCourier: [...activeAsCourier, ...archivedAsCourier],

      counts: {
        deliveriesCompleted: completedDeliveries.length,
        requestsActive: activeAsRequester.filter(
          (req) => req.status === "pending"
        ).length,

        requestsMade: activeAsRequester.length,
        requestsCompleted: completedRequests.length,
        requestsReceived: received.length,
      },
      chart: {
        days,
        deliveriesPerDay,
        requestsPerDay,
      },
    });
  }),
};

export default RequestController;
