const User = require("../models/User");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
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

    return res.status(200).json({
      message: "Cập nhật avatar thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Lỗi máy chủ nội bộ" });
  }
};
