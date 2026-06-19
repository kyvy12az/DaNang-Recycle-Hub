const User = require("../models/User");
const Listing = require("../models/Listing");
const Notification = require("../models/Notification");

// Lấy toàn bộ danh sách người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("-password");

    const normalizedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      greenPoints: user.greenPoints || 0,
      walletBalance: user.walletBalance !== undefined ? user.walletBalance : 50000,
      totalWeight: user.totalWeight || 0,
      totalTransactions: user.totalTransactions || 0,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen,
      isLocked: user.isLocked || false,
      createdAt: user.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: normalizedUsers.length,
      users: normalizedUsers
    });
  } catch (error) {
    console.error("Error in admin getAllUsers:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách người dùng" });
  }
};

// Khóa / Mở khóa tài khoản người dùng
exports.toggleLockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng này" });
    }

    user.isLocked = !user.isLocked;
    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isLocked ? "Đã khóa tài khoản thành công" : "Đã mở khóa tài khoản thành công",
      isLocked: user.isLocked
    });
  } catch (error) {
    console.error("Error in admin toggleLockUser:", error);
    return res.status(500).json({ message: "Không thể cập nhật trạng thái tài khoản" });
  }
};

exports.getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find({}).sort({ createdAt: -1 });

    const normalizedListings = listings.map(item => ({
      id: item._id.toString(),
      userName: item.sellerName,
      sellerAvatar: item.sellerAvatar,
      wasteType: item.items && item.items.length > 0
        ? item.items.map(i => i.wasteTypeName).join(", ")
        : "Chưa phân loại",
      weight: item.totalWeight || 0,
      estimatedPrice: item.totalPrice || 0,
      greenPoints: item.greenPoints || 0,
      address: item.address,
      district: item.district || "Chưa xác định",
      pickupTime: item.pickupTime,
      notes: item.note || "",
      status: item.status || "available",
      images: item.imageUrl ? [item.imageUrl] : [],
      itemsDetail: item.items || [],
      createdAt: item.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: normalizedListings.length,
      listings: normalizedListings
    });
  } catch (error) {
    console.error("Lỗi admin lấy danh sách bài đăng:", error);
    return res.status(500).json({ message: "Không thể tải danh sách bài đăng rác" });
  }
};

// cập nhật bài đăng rác
exports.updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Các trạng thái: 'available', 'approved', 'collected', 'rejected'

    const validStatuses = ['available', 'approved', 'collected', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái phê duyệt không hợp lệ" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng rác thải" });
    }

    const oldStatus = listing.status;
    listing.status = status;
    await listing.save();

    try {
      const io = global.io;
      if (io) {
        let title = "Cập nhật bài đăng";
        let msg = `Bài đăng mã #${listing._id} của bạn đã thay đổi trạng thái.`;

        if (status === 'approved') {
          title = "Bài đăng được phê duyệt 🎉";
          msg = `Chúc mừng! Bài đăng thu gom rác của bạn đã được admin phê duyệt và sẵn sàng để thu gom.`;
        } else if (status === 'rejected') {
          title = "Bài đăng bị từ chối ❌";
          msg = `Bài đăng thu gom rác của bạn đã bị từ chối phê duyệt do không đáp ứng quy chuẩn.`;
        }

        const dbNotification = await Notification.create({
          userId: listing.sellerId, 
          type: "listing_status",
          listingId: listing._id,
          title: title,
          message: msg,
          status: status,
          isRead: false
        });

        console.log("[Admin] Đã lưu thông báo thành công vào DB:", dbNotification._id);

        const targetRoom = String(listing.sellerId);

        io.to(targetRoom).emit("notification:new", {
          id: String(dbNotification._id),
          type: dbNotification.type,
          listingId: String(dbNotification.listingId),
          status: dbNotification.status,
          title: dbNotification.title,
          message: dbNotification.message,
          isRead: dbNotification.isRead,
          timestamp: dbNotification.createdAt || new Date().toISOString(),
        });

        io.to(targetRoom).emit("order:status_updated", {
          listingId: String(listing._id),
          status: status,
        });
      }
    } catch (socketErr) {
      console.error("❌ Lỗi xử lý lưu DB hoặc bắn socket thông báo:", socketErr);
    }

    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái bài đăng sang [${status}] thành công.`,
      listing
    });
  } catch (error) {
    console.error("Lỗi admin cập nhật trạng thái bài đăng:", error);
    return res.status(500).json({ message: "Không thể cập nhật trạng thái bài đăng" });
  }
};