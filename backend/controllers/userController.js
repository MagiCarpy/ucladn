import { User } from "../models/user.model.js";
import { validateImgFile } from "../middleware/imgFileValidator.js";
import { PUBLIC_PATH, ROOT_ENV_PATH } from "../config/paths.js";
import { ValidationError } from "sequelize";
import {
  ACCESS_EXP_TIME,
  REFRESH_EXP_TIME,
  JWTCookieConfig,
} from "../middleware/auth.js";
import redisClient from "../config/redisDb.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";
import asyncHandler from "express-async-handler"; // allows for easy error routing (less try and catch)
import fs from "fs/promises";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Add the all the database user table interactions to be used in the user routes
// ex. create user, delete user, get all users, etc

// security!!! should probably add security features (ex. not everyone should be able to access someone else's profile)

// FIXME: Add messages to each json as popup alert for users

await fs.mkdir(PUBLIC_PATH, { recursive: true }).catch(() => {}); // FIXME: deal with all file creations functions

dotenv.config({ path: ROOT_ENV_PATH });

const UserController = {
  register: asyncHandler(async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
      const user = await User.create({
        username: username,
        email: email,
        password: password,
      });

      return res.status(200).json({
        message: "User registered successfully",
        user: {
          username: username,
          email: email,
        },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        const messages = error.errors.map((err) => err.message);
        // show only first error message
        return res.status(400).json({
          message: messages[0],
        });
      }

      next(error);
    }
  }),
  login: asyncHandler(async (req, res) => {
    // FIXME: assumes login form has email and password (can add username later if needed)
    const { email, password } = req.body;

    const ip = req.ip;
    const ipKey = `failed_logins:ip:${ip}`;
    const emailKey = email ? `failed_logins:email:${email}` : null;

    // Helper for log failure rate limit tracking (per IP and per email)
    const handleLoginFailure = async (message) => {
      const ipFailures = await redisClient.incr(ipKey);
      await redisClient.expire(ipKey, 3600);

      let emailFailures = 0;
      if (emailKey) {
        emailFailures = await redisClient.incr(emailKey);
        await redisClient.expire(emailKey, 3600);
      }

      const failures = Math.max(ipFailures, emailFailures);
      const delay = Math.min(16, Math.pow(2, failures - 1)) * 1000; // Exponential backoff (1, 2, 4, ..., 16 secs)

      console.warn(
        `Failed login attempt from IP: ${ip}, Email: ${email || "N/A"}. Failures: ${failures}. Delaying response by ${delay}ms.`,
      ); // FIXME: delete later after testing (security through obscurity)

      await new Promise((resolve) => setTimeout(resolve, delay));

      return res.status(401).json({ message });
    };

    if (!email || !password)
      return await handleLoginFailure("User login failed. Invalid inputs.");

    const user = await User.findOne({ where: { email: email } });

    if (!user)
      return await handleLoginFailure("User login failed. No user found.");

    const isValidUser = bcrypt.compareSync(password, user.password);

    if (!isValidUser)
      return await handleLoginFailure("User login failed. Bad credentials.");

    // Clear failed login counters in Redis on successful login
    await redisClient.del(ipKey);
    if (emailKey) {
      await redisClient.del(emailKey);
    }

    // Create jwt tokens and save refresh to redis
    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    await redisClient.set(`session:${user.id}`, refreshToken, {
      EX: REFRESH_EXP_TIME,
    });

    res.cookie("accessToken", accessToken, {
      ...JWTCookieConfig,
      maxAge: ACCESS_EXP_TIME * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...JWTCookieConfig,
      maxAge: REFRESH_EXP_TIME * 1000,
    });

    return res.status(200).json({ message: "User logged in." });
  }),
  logout: asyncHandler(async (req, res) => {
    try {
      const decodedRefresh = jwt.verify(
        req.cookies.refreshToken || null,
        process.env.REFRESH_TOKEN_SECRET,
      );
      await redisClient.del(`session:${decodedRefresh.userId}`);
    } catch (error) {
      console.error("No refresh token");
    }

    // Match options of cookie creation to clearing
    res.clearCookie("accessToken", {
      ...JWTCookieConfig,
    });

    res.clearCookie("refreshToken", {
      ...JWTCookieConfig,
    });

    return res.status(200).json({ message: "User logged out." });
  }),
  auth: asyncHandler(async (req, res) => {
    return res.json({
      user: {
        userId: req.user.id,
        username: req.user.username,
        email: req.user.email,
        profileImg: req.user.image,
      },
    });
  }),
  getUser: asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id)
      return res.status(400).json({ message: "Id parameter is required." });

    try {
      const user = await User.findOne({ where: { id: id } });

      if (!user) throw new Error("User id not found.");

      return res.status(200).json({
        message: `User found with id: ${id}`,
        user: {
          userId: user.id,
          username: user.username,
          email: user.email,
          profileImg: user.image,
        },
      });
    } catch (error) {
      return res.status(404).json({ message: "User id not found." });
    }
  }),
  deleteUser: asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id)
      return res.status(400).json({ message: "Id parameter is required." });

    try {
      const user = await User.destroy({ where: { id: id } });

      if (user === 0) throw new Error("User id not found.");

      return res.status(200).json({ message: `User ${id}, deleted.` });
    } catch (error) {
      return res.status(404).json({
        message: "User id not found.",
      });
    }
  }),
  uploadPfp: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const checkValidImg = await validateImgFile(req.file.buffer);

    if (!checkValidImg.valid) {
      return res.status(400).json({ message: checkValidImg.message });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Rename file to prevent file traversal
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `${req.user.id}-${crypto.randomUUID()}${ext}`;
    const uploadPath = path.join(PUBLIC_PATH, filename);

    // Save file to filepath (public static)
    // Profile pictures don't need to be private
    await fs.writeFile(uploadPath, req.file.buffer);

    // Reassign user image value and save to database
    user.image = filename;
    await user.save();

    res.status(201).json({
      message: "Profile picture uploaded",
      imageUrl: filename,
    });
  }),
};

// FIXME: make code cleaner for auth and login
function createAccessToken(userId) {
  return jwt.sign({ userId: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_EXP_TIME,
  });
}

function createRefreshToken(userId) {
  return jwt.sign({ userId: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXP_TIME,
  });
}

export default UserController;
