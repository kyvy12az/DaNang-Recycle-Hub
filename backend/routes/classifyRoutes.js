const express = require("express");
const router = express.Router();
const multer = require("multer");
const { handleClassification } = require("../controllers/classifyController");

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// api nhận diện rác
router.post("/classify", upload.single("image"), handleClassification);

module.exports = router;