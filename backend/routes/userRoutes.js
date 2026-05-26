const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController"); 
const User = require("../models/User");
const Transaction = require("../models/Transaction");

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

  router.get('/:userId/phone', authController.authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('phone name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ phone: user.phone, name: user.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
