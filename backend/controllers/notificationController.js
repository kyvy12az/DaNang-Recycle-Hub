const Notification = require("../models/Notification");

const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId }) 
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({ message: "Không thể lấy thông báo" });
  }
};

// Đánh dấu đã đọc theo req.userId
const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, 
      { isRead: true }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi xử lý" });
  }
};

// Xóa sạch thông báo theo req.userId
const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.userId }); 
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi xóa" });
  }
};

module.exports = { getUserNotifications, markAsRead, clearAllNotifications };