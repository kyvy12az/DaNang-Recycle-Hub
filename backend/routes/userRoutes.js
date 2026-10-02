const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController"); 
const notificationController = require("../controllers/notificationController");

const User = require("../models/User");
const Transaction = require("../models/Transaction");

// api cập nhật url avatar của người dùng
router.put(
  "/avatar",
  userController.verifyToken,
  userController.updateAvatarUrl
);

// api cập nhật trạng thái online/offline
router.put('/status', authController.authMiddleware, async (req, res) => {
  try {
    const { isOnline, lastSeen } = req.body;
    await User.findByIdAndUpdate(req.userId, { isOnline, lastSeen });
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// api lấy lịch sử giao dịch điểm xanh/ví tiền
router.get('/transactions', authController.authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      transactions: transactions.map((transaction) => ({
        id: transaction._id.toString(),
        orderId: transaction.orderId?.toString() || null,
        type: transaction.type,
        amount: transaction.amount || 0,
        points: transaction.points || 0,
        description: transaction.description || "",
        status: transaction.status,
        timestamp: transaction.createdAt,
        metadata: transaction.metadata || {},
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// api lấy số điện thoại và tên của user cụ thể
router.get('/:userId/phone', authController.authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('phone name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ phone: user.phone, name: user.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// api lấy danh sách thông báo của user
router.get("/notifications", authController.authMiddleware, notificationController.getUserNotifications);
// api đánh dấu thông báo là đã đọc
router.put("/notifications/:id/read", authController.authMiddleware, notificationController.markAsRead);
// api xóa tất cả thông báo
router.delete("/notifications/clear", authController.authMiddleware, notificationController.clearAllNotifications);

module.exports = router;