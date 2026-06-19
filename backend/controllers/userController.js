const User = require("../models/User");
const Listing = require("../models/Listing");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET là bắt buộc");
}

// Middleware để xác minh mã thông báo JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Không có token nào được cung cấp" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

exports.verifyToken = verifyToken;

exports.updateAvatarUrl = async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    const userId = req.userId;

    if (!avatarUrl) {
      return res.status(400).json({ message: "Avatar URL là bắt buộc" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { returnDocument: 'after' }
    );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    // Cập nhật avatar trong các bài đăng của người dùng (Listing)
    await Listing.updateMany(
      { sellerId: userId },
      { $set: { sellerAvatar: avatarUrl } }
    );

    return res.status(200).json({
      message: "Cập nhật avatar thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        greenPoints: user.greenPoints ?? 0,
        walletBalance: user.walletBalance ?? 50000,
        totalWeight: user.totalWeight ?? 0,
        totalTransactions: user.totalTransactions ?? 0,
        createdAt: user.createdAt,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Lỗi máy chủ nội bộ" });
  }
};
