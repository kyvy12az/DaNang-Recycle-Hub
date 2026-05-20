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
const messageRoutes = require("./routes/messageRoutes");
const listingController = require("./controllers/listingController");


const app = express();

const allowedOrigins = [
  process.env.ADMIN_WEB_ORIGIN,
  "http://localhost:8080", // Admin chạy local
  "https://your-admin-web-deployed.vercel.app" // Admin chạy trên domain thực tế
];

app.use(
  cors({
    origin: '*', // Cho phép tất cả mọi nơi truy cập
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
app.use("/api/messages", messageRoutes);

// route kiểm tra trạng thái server (Health Check)
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Socket.io

const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const User = require("./models/User"); 

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 10000,  
  pingInterval: 5000,
});

// Initialize listing controller with IO instance
listingController.setIO(io);

io.on("connection", (socket) => {
  console.log("User kết nối:", socket.id);

  let currentUserId = null;

  socket.on("register", async (userId) => {
    currentUserId = userId;
    socket.join(userId);
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: null,
    });
    console.log("User online:", userId);
  });

  socket.on("send_message", async (data) => {
    try {
      await Message.create({
        senderId: data.senderId,
        receiverId: data.receiverId,
        listingId: data.listingId,
        text: data.text,
      });

      // Gửi cho người nhận
      io.to(data.receiverId).emit("receive_message", data);
      
      // Gửi cho các thiết bị khác của người gửi (đồng bộ)
      socket.to(data.senderId).emit("receive_message", data);
      
      // Thông báo cập nhật hội thoại cho người gửi
      io.to(data.senderId).emit("conversation_updated", data);

    } catch (err) {
      console.error("Lỗi lưu tin nhắn:", err.message);
    }
  });
  
  socket.on("typing_start", (data) => {
    socket.to(data.receiverId).emit("typing_start", data);
  });

  socket.on("typing_stop", (data) => {
    socket.to(data.receiverId).emit("typing_stop", data);
  });

  socket.on("heartbeat", async (userId) => {
  if (userId) {
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    }
  });

  socket.on("disconnect", async () => {
    if (currentUserId) {
      await User.findByIdAndUpdate(currentUserId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      console.log("User offline:", currentUserId);
    }
  });
});



const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});