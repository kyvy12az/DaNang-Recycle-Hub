const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// PUT route to update avatar URL
router.put(
  "/avatar",
  userController.verifyToken,
  userController.updateAvatarUrl
);

module.exports = router;
