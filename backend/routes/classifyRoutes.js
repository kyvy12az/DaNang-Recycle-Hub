const express = require("express");
const router = express.Router();
const multer = require("multer");
const { handleClassification } = require("../controllers/classifyController");

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

// Định nghĩa endpoint POST /api/ai/classify
router.post("/classify", upload.single("image"), handleClassification);

module.exports = router;