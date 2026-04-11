const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

const createToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

const normalizeUser = (user, provider = user.provider || "email") => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider,
  createdAt: user.createdAt,
});

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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