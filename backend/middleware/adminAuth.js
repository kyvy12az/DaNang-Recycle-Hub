const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET là bắt buộc");
}

module.exports = (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Thiếu token xác thực" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== "admin") {
      return res.status(403).json({ message: "Token không hợp lệ cho admin" });
    }

    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token hết hạn hoặc không hợp lệ" });
  }
};