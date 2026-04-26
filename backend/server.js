const path = require("path");
// Railway tự động đặt biến môi trường từ file .env ở thư mục gốc, 
// nhưng khi chạy local thì cần chỉ rõ đường dẫn đến file .env
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const classifyRoutes = require("./routes/classifyRoutes");

const app = express();

const allowedOrigins = [
  process.env.ADMIN_WEB_ORIGIN,
  "http://localhost:8080", // Admin chạy local
  "https://your-admin-web-deployed.vercel.app" // Admin chạy trên domain thực tế
];

app.use(
  cors({
    origin: function (origin, callback) {
      // cho phép request không có origin (như mobile app hoặc curl) 
      // hoặc origin nằm trong danh sách được phép
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// --- Kết nối MongoDB Atlas ---
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/recycleDB";

mongoose.connect(mongoURI)
  .then(() => {
    console.log("MongoDB kết nối thành công");
  })
  .catch((err) => {
    console.error("MongoDB kết nối lỗi: ", err.message);
  });

// --- Định nghĩa route kiểm tra trạng thái server --- dùng để ping mỗi lần server bị ngủ 
app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is awake!",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", authRoutes);
app.use("/api/user", userRoutes); 
app.use("/api/admin", adminAuthRoutes);
app.use("/api/ai", classifyRoutes);

// route kiểm tra trạng thái server (Health Check)
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// cấu hình PORT từ biến môi trường, nếu không có thì mặc định là 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});