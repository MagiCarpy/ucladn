import express from "express";
import RequestController from "../controllers/requestController.js";
import requireAuth from "../middleware/auth.js";
import { upload } from "../middleware/imgFileValidator.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.post("/", requireAuth, RequestController.create);
router.get("/", RequestController.list);
router.get("/user/stats", requireAuth, RequestController.getUserStats);
router.get("/:id", RequestController.getOne);
router.post("/:id/accept", requireAuth, RequestController.accept);

router.post(
  "/:id/upload-photo",
  requireAuth,
  upload.single("photo"),
  RequestController.uploadPhoto
);

router.get(
  "/:id/photo",
  requireAuth,
  RequestController.getPhoto
);

router.post(
  "/:id/complete-delivery",
  requireAuth,
  RequestController.completeDelivery
);
router.post(
  "/:id/confirm-received",
  requireAuth,
  RequestController.confirmReceived
);
router.post(
  "/:id/confirm-not-received",
  requireAuth,
  RequestController.confirmNotReceived
);
router.post(
  "/:id/cancel-delivery",
  requireAuth,
  RequestController.cancelDelivery
);
router.delete("/:id", requireAuth, RequestController.delete);

router.post("/seed/archive", requireAuth, async (req, res) => {
  try {
    const { ArchivedRequest } = await import(
      "../models/archivedRequest.model.js"
    );

    console.log("REQ USER:", req.user); // LOG AUTH
    console.log("ARCHIVED MODEL LOADED"); // LOG MODEL

    const userId = req.user?.id;
    if (!userId) {
      throw new Error("No userId found — authentication failed?");
    }

    const sample = [];

    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      sample.push({
        userId,
        requesterId: 9999,
        originalRequestId: uuidv4(),
        userId,
        item: "Potato",
        pickupLocation: "De Neve Plaza",
        dropoffLocation: "Rieber Hall",
        status: "completed",
        asCourier: true,
        asRequester: false,
        archivedAt: date,
        createdAt: date,
        updatedAt: date,
      });
    }

    const results = await ArchivedRequest.bulkCreate(sample);

    res.json({
      message: "Seeded archived courier history!",
      count: results.length,
    });
  } catch (err) {
    console.error("SEED ERROR DETAILS:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
