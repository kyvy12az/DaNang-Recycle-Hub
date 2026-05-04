const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController"); 
const User = require("../models/User");

// route để cập nhật URL avatar của người dùng, yêu cầu xác thực bằng JWT
router.put(
  "/avatar",
  userController.verifyToken,
  userController.updateAvatarUrl
);


router.put('/status', authController.authMiddleware, async (req, res) => {
  try {
    const { isOnline, lastSeen } = req.body;
    await User.findByIdAndUpdate(req.userId, { isOnline, lastSeen });
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
  });

module.exports = router;
