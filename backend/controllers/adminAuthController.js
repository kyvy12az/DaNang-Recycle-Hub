const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const JWT_SECRET = process.env.JWT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET là bắt buộc");
}

// hàm này sẽ đọc biến môi trường ADMIN_ALLOWED_EMAILS và trả về một mảng các email đã được phép, 
// sau khi đã loại bỏ khoảng trắng và chuyển về chữ thường
const parseAllowedEmails = () => {
  const raw = process.env.ADMIN_ALLOWED_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

// hàm này tạo một JWT token cho admin đã đăng nhập, chứa thông tin id, email, role và type
const createAdminToken = (admin) =>
  jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      type: "admin",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

const normalizeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  avatar: admin.avatar,
  role: admin.role,
  isActive: admin.isActive,
  createdAt: admin.createdAt,
  lastLoginAt: admin.lastLoginAt,
});

// hàm này sẽ gửi một yêu cầu POST đến GitHub để đổi code lấy được từ client thành access token
const exchangeCodeForToken = async ({ code, redirectUri }) => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("Không thể lấy GitHub access token");
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(data.error_description || "GitHub access token không hợp lệ");
  }

  return data.access_token;
};

// hàm lấy thông tin hồ sơ người dùng từ GitHub bằng access token, bao gồm cả email đã xác minh nếu có
const fetchGithubProfile = async (accessToken) => {
  const [userResponse, emailsResponse] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }),
    fetch("https://api.github.com/user/emails", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }),
  ]);

  if (!userResponse.ok) {
    throw new Error("Không thể lấy hồ sơ GitHub");
  }

  const user = await userResponse.json();
  let email = user.email || null;

  if (!email && emailsResponse.ok) {
    const emails = await emailsResponse.json();
    const primaryEmail = emails.find((item) => item.primary && item.verified) || emails.find((item) => item.verified);
    email = primaryEmail?.email || null;
  }

  if (!email) {
    throw new Error("Tài khoản GitHub chưa có email đã xác minh");
  }

  return {
    githubId: String(user.id),
    name: String(user.name || user.login || "GitHub Admin").trim(),
    avatar: user.avatar_url || null,
    email: String(email).trim().toLowerCase(),
  };
};

exports.githubLogin = async (req, res) => {
  try {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return res.status(500).json({ message: "Thiếu cấu hình GitHub OAuth cho backend" });
    }

    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ message: "Thiếu code hoặc redirectUri" });
    }

    const accessToken = await exchangeCodeForToken({ code, redirectUri });
    const profile = await fetchGithubProfile(accessToken);
    const allowedEmails = parseAllowedEmails();

    let admin = await Admin.findOne({
      $or: [{ githubId: profile.githubId }, { email: profile.email }],
    });

    if (!admin) {
      const canAutoCreate = allowedEmails.includes(profile.email);
      if (!canAutoCreate) {
        return res.status(403).json({
          message: "Tài khoản của bạn chưa được cấp quyền admin",
        });
      }

      admin = await Admin.create({
        name: profile.name,
        email: profile.email,
        githubId: profile.githubId,
        avatar: profile.avatar,
        role: "admin",
        isActive: true,
        lastLoginAt: new Date(),
      });
    } else {
      if (!admin.isActive) {
        return res.status(403).json({ message: "Tài khoản admin đã bị vô hiệu hóa" });
      }

      admin.name = profile.name || admin.name;
      admin.avatar = profile.avatar || admin.avatar;
      admin.githubId = admin.githubId || profile.githubId;
      admin.email = profile.email;
      admin.lastLoginAt = new Date();
      await admin.save();
    }

    const token = createAdminToken(admin);

    return res.status(200).json({
      message: "Admin login success",
      token,
      admin: normalizeAdmin(admin),
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: error.message || "Đăng nhập GitHub thất bại" });
  }
};

exports.me = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Phiên đăng nhập không còn hợp lệ" });
    }

    return res.status(200).json({ admin: normalizeAdmin(admin) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Không thể lấy thông tin admin" });
  }
};