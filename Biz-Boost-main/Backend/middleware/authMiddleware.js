const jwt = require("jsonwebtoken");
const User = require("../models/User");

// --- Middleware to verify token ---
exports.protect = async (req, res, next) => {
  let token;

  // 1️⃣ Extract token from Authorization header
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
      message: "JWT secret is not set in environment variables",
    });
  }

  try {
    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Fetch user and explicitly select necessary fields
    req.user = await User.findById(decoded.id).select("name businessName role email -password");

    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        message: "User not found for this token",
      });
    }

    // Optional: debug log
    // console.log("Authenticated user:", req.user);

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

// --- Middleware to restrict access to specific roles ---
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
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
};
