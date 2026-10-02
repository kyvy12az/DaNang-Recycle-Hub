const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Listing = require("../models/Listing");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET là bắt buộc");
}

// hàm tạo một JWT token cho user đã đăng nhập, chứa thông tin id
const createToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

const normalizeUser = (user, provider = user.provider || "email") => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider,
  phone: user.phone ?? null,
  address: user.address ?? null,
  greenPoints: user.greenPoints ?? 0,
  walletBalance: user.walletBalance ?? 50000,
  totalWeight: user.totalWeight ?? 0,
  totalTransactions: user.totalTransactions ?? 0,
  createdAt: user.createdAt,
});

// đăng ký tài khoản mới
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được đăng ký!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
      provider: "email",
      emailVerified: false,
    });

    const token = createToken(user._id);

    return res.status(201).json({
      message: "Register success",
      token,
      user: normalizeUser(user, "email"),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Lỗi Server nội bộ" });
  }
};

// đăng nhập tài khoản
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Tài khoản không tồn tại" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Tài khoản này cần đăng nhập bằng Google" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu, vui lòng thử lại" });
    }

    const token = createToken(user._id);

    return res.json({
      message: "Login success",
      token,
      user: normalizeUser(user, user.provider || "email"),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Lỗi Server nội bộ" });
  }
};

// xác minh token google api
const verifyGoogleIdToken = async (idToken) => {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);

  if (!response.ok) {
    throw new Error("Google token không hợp lệ");
  }

  const payload = await response.json();
  if (!payload.email || String(payload.email_verified) !== "true") {
    throw new Error("Google email chưa được xác minh");
  }

  return payload;
};

// đăng nhập tài khoản bằng google
exports.googleLogin = async (req, res) => {
  try {
    const { idToken, profile } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Thiếu Google idToken" });
    }

    const googlePayload = await verifyGoogleIdToken(idToken);
    const email = String(googlePayload.email || profile?.email || "").trim().toLowerCase();
    const name = String(googlePayload.name || profile?.name || profile?.given_name || "Google User").trim();
    const avatar = googlePayload.picture || profile?.avatar || null;
    const googleId = googlePayload.sub;

    if (!email) {
      return res.status(400).json({ message: "Google không trả về email hợp lệ" });
    }

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      user.name = user.name || name;
      user.email = email;
      user.googleId = user.googleId || googleId;
      user.provider = "google";
      user.emailVerified = true;
      user.avatar = user.avatar || avatar;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password: null,
        provider: "google",
        googleId,
        emailVerified: true,
        avatar,
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      message: "Google login success",
      token,
      user: normalizeUser(user, "google"),
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: err.message || "Đăng nhập Google thất bại" });
  }
};

// middleware xác thực JWT
exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token xác thực" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id || decoded._id || decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

// cập nhật profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ message: "Tên không được để trống" });
    }
    if (phone && !/^[0-9]{9,11}$/.test(phone.trim())) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }

    const updateFields = {};
    if (name !== undefined)    updateFields.name    = name.trim();
    if (address !== undefined) updateFields.address = address.trim();
    if (phone !== undefined)   updateFields.phone   = phone.trim();

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "Không có thông tin nào để cập nhật" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // cập nhật tên trong các bài đăng của người dùng (Listing) nếu tên thay đổi
    if (name !== undefined) {
      await Listing.updateMany(
        { sellerId: req.userId },
        { $set: { sellerName: name.trim() } }
      );
    }

    return res.status(200).json({
      message: "Cập nhật thông tin thành công",
      user: normalizeUser(updatedUser),
    });
  } catch (error) {
    console.error("Lỗi cập nhật profile:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// lấy profile hiện tại
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.status(200).json({
      user: normalizeUser(user, user.provider || "email"),
    });
  } catch (error) {
    console.error("Lỗi lấy profile:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// xác minh token zalo api
const verifyZaloAccessToken = async (accessToken) => {
  const response = await fetch(`https://graph.zalo.me/v2.0/me?fields=id,name,picture,email`, {
    headers: {
      access_token: accessToken,
    },
  });

  if (!response.ok) {
    throw new Error("Zalo access token không hợp lệ");
  }

  const payload = await response.json();
  return payload;
};

// đăng nhập tài khoản bằng zalo (OAuth 2.0 PKCE)
exports.zaloLogin = async (req, res) => {
  try {
    const { code, codeVerifier } = req.body;

    if (!code || !codeVerifier) {
      return res.status(400).json({ message: "Thiếu Zalo authorization code hoặc codeVerifier" });
    }

    const zaloAppId = process.env.ZALO_APP_ID || "830326267110984004";
    const zaloAppSecret = process.env.ZALO_APP_SECRET;

    if (!zaloAppSecret) {
      return res.status(500).json({ message: "Chưa cấu hình ZALO_APP_SECRET trong file .env của Backend" });
    }

    // 1. Đổi code lấy access token
    const tokenResponse = await fetch("https://oauth.zalo.me/v2.0/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        secret_key: zaloAppSecret,
      },
      body: new URLSearchParams({
        code,
        app_id: zaloAppId,
        code_verifier: codeVerifier,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Lỗi đổi token Zalo:", tokenData);
      return res.status(400).json({ message: tokenData.error_description || "Không thể lấy Zalo access token từ code" });
    }

    const accessToken = tokenData.access_token;

    // 2. Lấy thông tin user bằng access token
    const zaloPayload = await verifyZaloAccessToken(accessToken);
    const zaloId = zaloPayload.id;
    const name = zaloPayload.name || "Zalo User";
    const avatar = zaloPayload.picture?.data?.url || null;
    
    let email = zaloPayload.email || "";
    email = email.trim().toLowerCase();

    if (!zaloId) {
      return res.status(400).json({ message: "Không lấy được Zalo ID" });
    }

    let user = await User.findOne({ zaloId });

    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        user.zaloId = zaloId;
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save();
      }
    }

    if (!user) {
      const finalEmail = email || `zalo_${zaloId}@danangrecyclehub.vn`;
      user = await User.create({
        name,
        email: finalEmail,
        zaloId,
        provider: "zalo",
        avatar,
        emailVerified: !!email,
      });
    }

    const token = createToken(user._id);

    return res.json({
      message: "Login success",
      token,
      user: normalizeUser(user, "zalo"),
    });
  } catch (err) {
    console.error("Lỗi Zalo Login BE:", err);
    res.status(500).json({ message: err.message || "Lỗi Server nội bộ" });
  }
};
