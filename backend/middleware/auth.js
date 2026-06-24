import { User } from "../models/user.model.js";
import { ROOT_ENV_PATH } from "../config/paths.js";
import redisClient from "../config/redisDb.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

dotenv.config({ path: ROOT_ENV_PATH });

// JWT Token Config
export const REFRESH_EXP_TIME = 60 * 60 * 12; //  12 hours
export const ACCESS_EXP_TIME = 60 * 15; // 15 mins

// FIXME: Change secure and maybe sameSite for production
export const JWTCookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

//FIXME: for invalid, maybe also redirect to logout
const requireAuth = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies.accessToken || null;
  const refreshToken = req.cookies.refreshToken || null;

  if (!accessToken && !refreshToken) {
    return deauth(res);
  }

  let user;
  try {
    const decodedAccess = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    user = await User.findByPk(decodedAccess.userId);
  } catch (err) {
    if (!refreshToken) {
      return deauth(res);
    }

    // refresh the access token
    try {
      const decodedRefresh = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const verifyRefreshToken = await redisClient.get(decodedRefresh.userId);

      if (!verifyRefreshToken) return deauth(res);

      if (refreshToken !== verifyRefreshToken)
        return res.status(401).json({ error: "Bad refresh token" });

      // if valid refresh token, assign new accessToken
      const newAccessToken = jwt.sign(
        { userId: decodedRefresh.userId },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: ACCESS_EXP_TIME,
        }
      );

      res.cookie("accessToken", newAccessToken, {
        ...JWTCookieConfig,
        maxAge: ACCESS_EXP_TIME * 1000,
      });

      user = await User.findByPk(decodedRefresh.userId);
    } catch (error) {
      return res.status(400).json({ error: "Auth failed" });
    }
  }

  if (!user) return res.status(404).json({ error: "User not found" });

  req.user = user;
  next();
});

function deauth(res) {
  res.clearCookie("accessToken", {
    ...JWTCookieConfig,
  });

  res.clearCookie("refreshToken", {
    ...JWTCookieConfig,
  });

  return res.status(401).json({ error: "Unauthorized" });
}

export default requireAuth;
