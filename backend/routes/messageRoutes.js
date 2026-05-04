const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const authController = require("../controllers/authController");

// Lấy trạng thái online của user
router.get("/status/:userId", authController.authMiddleware, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.params.userId).select("isOnline lastSeen");
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json({ isOnline: user.isOnline, lastSeen: user.lastSeen });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API 1: Lấy danh sách người nhắn tin theo listingId
router.get("/listing/:listingId", authController.authMiddleware, async (req, res) => {
  try {
    const myId = req.userId;
    const { listingId } = req.params;
    const User = require("../models/User");

    const messages = await Message.find({
      listingId,
      $or: [{ senderId: myId }, { receiverId: myId }],
    }).sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      const otherId = msg.senderId.toString() === myId.toString()
        ? msg.receiverId.toString()
        : msg.senderId.toString();

      if (!seen.has(otherId)) {
        seen.add(otherId);

        const otherUser = await User.findById(otherId).select("name avatar");
        if (otherUser) {
          const unreadCount = await Message.countDocuments({
            listingId,
            senderId: otherId,
            receiverId: myId,
            isRead: false,
          });

          conversations.push({
            userId: otherId,
            name: otherUser.name,
            avatar: otherUser.avatar,
            lastMessage: msg.senderId.toString() === myId.toString()
              ? `Bạn: ${msg.text}`
              : msg.text,
            lastTime: msg.createdAt,
            unreadCount,
          });
        }
      }
    }

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Đánh dấu đã đọc
router.put("/read/:listingId/:senderId", authController.authMiddleware, async (req, res) => {
  try {
    const { listingId, senderId } = req.params;
    const receiverId = req.userId;

    await Message.updateMany(
      { listingId, senderId, receiverId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API 2: Lấy lịch sử chat giữa 2 người theo listingId
router.get("/:listingId/:receiverId", authController.authMiddleware, async (req, res) => {
  try {
    const { listingId, receiverId } = req.params;
    const senderId = req.userId;

    // ✅ Tự đánh dấu đã đọc khi mở chat
    await Message.updateMany(
      { listingId, senderId: receiverId, receiverId: senderId, isRead: false },
      { isRead: true }
    );

    const messages = await Message.find({
      listingId,
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;