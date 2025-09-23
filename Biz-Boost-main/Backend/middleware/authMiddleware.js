const jwt = require("jsonwebtoken");
const User = require("../models/User");

// --- Middleware to verify token ---
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ status: "fail", message: "Not authorized, no token" });
  }

  try {
    // ✅ Use the same secret key you used in authController
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (excluding password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ status: "fail", message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Not authorized, token failed", error: error.message });
  }
};

// --- Middleware to restrict to specific roles ---
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "Forbidden: Insufficient role permissions",
      });
    }
    next();
  };
};
