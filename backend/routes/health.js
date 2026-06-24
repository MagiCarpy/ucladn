import express from "express";
import { sequelize } from "../config/db.js";
import asyncHandler from "express-async-handler";
const router = express.Router();

/* 
Server and host services health check logic 

Routes to check if connections to dependent systems, such as the database, are working.
*/

// Make sure server is alive lol
router.get("/", asyncHandler(async (req, res) => {
  res.redirect("/api/health/server");
}));

router.get("/server", asyncHandler(async (req, res) => {
  res
    .status(200)
    .json({ ok: true, message: "Server is running", ts: Date.now() });
}));

router.get("/db", asyncHandler(async (req, res) => {
  try {
    await sequelize.authenticate();
    console.log("Database connection successful.");

    await sequelize.sync(); // Creates tables if they don't exist
    // await sequelize.sync({ force: true }); // WARNING: Will drop existing tables and recreate them

    console.log("Models created and synchronized.");

    return res.status(200).send("Database active and running.");
  } catch (error) {
    console.error("Error connecting to database or syncing tables.", error);
    return res.status(503).send("Database inactive and down.");
  }
}));

export default router;
