const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

// 2. File filter logic 
const fileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|gif|pdf|mp4|mov/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1); // remove the "."
  const mime = file.mimetype;

  if (allowedExt.test(ext) && (
      mime.startsWith("image/") ||
      mime.startsWith("video/") ||
      mime === "application/pdf"
    )) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

// 3. Multer upload setup
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter,
});

module.exports = upload;
