const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// route để cập nhật URL avatar của người dùng, yêu cầu xác thực bằng JWT
router.put(
  "/avatar",
  userController.verifyToken,
  userController.updateAvatarUrl
);

module.exports = router;
