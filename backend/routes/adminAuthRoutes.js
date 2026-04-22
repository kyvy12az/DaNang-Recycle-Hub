const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const adminAuthController = require("../controllers/adminAuthController");

const router = express.Router();

router.post("/auth/github", adminAuthController.githubLogin);
router.get("/auth/me", adminAuth, adminAuthController.me);

module.exports = router;