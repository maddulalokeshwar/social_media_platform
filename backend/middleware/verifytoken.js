import jwt from "jsonwebtoken";
import { userModel } from "../Model/userModel.js";
const {verify} =jwt
import {config} from "dotenv"
config();

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "AUTHENTICATION FAILED: NO TOKEN PROVIDED",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(403).json({
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "User is blocked",
      });
    }

    if (user.isDeactivated) {
      return res.status(403).json({
        message: "User is not active",
      });
    }

    req.user = user; // attach user
    next();
  } catch (err) {
    next(err);
  }
};

export const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({
        message: "Access denied: Admin only",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};


export const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: err.message
    });
  }

  // Invalid MongoDB ID
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format"
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token"
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired"
    });
  }

  // Normal error
  res.status(500).json({
    message: err.message || "Internal Server Error"
  });
};