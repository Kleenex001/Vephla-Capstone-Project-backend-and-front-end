const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify token
exports.protect = async (req, res, next) => {
  let token;

  // 1️⃣ Get token from headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: "fail",
      message: "Not authorized, no token provided",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      status: "error",
      message: "JWT secret is not set",
    });
  }

  try {
    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Attach user to request, exclude password
    req.user = await User.findById(decoded.id).select("name businessName role");

    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        message: "User not found for this token",
      });
    }

    next();
  } catch (error) {
    let message = "Not authorized, token failed";
    if (error.name === "TokenExpiredError") message = "Token expired, please log in again";
    else if (error.name === "JsonWebTokenError") message = "Invalid token";

    return res.status(401).json({
      status: "error",
      message,
      error: error.message,
    });
  }
};

// Restrict roles
exports.authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: "fail",
      message: "User not attached to request",
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      status: "fail",
      message: "Forbidden: insufficient role permissions",
    });
  }

  next();
};
