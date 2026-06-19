const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminRoutes = require("./routes/adminRoutes");
const classifyRoutes = require("./routes/classifyRoutes");
const messageRoutes = require("./routes/messageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const listingRoutes = require("./routes/listingRoutes");
const orderRoutes = require("./routes/orderRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const listingController = require("./controllers/listingController");
const orderController = require("./controllers/orderController");
const orderSettlementService = require("./services/orderSettlementService");
const { initializeLeaderboardJobs } = require("./services/leaderboardScheduler");


const app = express();

const allowedOrigins = [
  process.env.ADMIN_WEB_ORIGIN,
  "http://localhost:8080", // Admin chạy local
  "http://192.168.1.211:8080/",
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
    // Initialize leaderboard scheduled jobs
    initializeLeaderboardJobs();
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
app.use("/api/payment", paymentRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/admin/management", adminRoutes); 

// route kiểm tra trạng thái server (Health Check)
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Socket.io

const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const User = require("./models/User"); 
const Order = require("./models/Order");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 10000,  
  pingInterval: 5000,
});

global.io = io;

// Initialize listing controller with IO instance
listingController.setIO(io);
orderController.setIO(io);
orderSettlementService.setIO(io);

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
        mediaUrl: data.mediaUrl,   
        mediaType: data.mediaType,
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

  socket.on("mark_read", async ({ senderId, readerId, listingId }) => {
  try {
    await Message.updateMany(
      { senderId, receiverId: readerId, listingId, isRead: false },
      { isRead: true }
    );
    io.to(senderId).emit("message_read");
  } catch (err) {
    console.error("Lỗi mark_read:", err.message);
  }
});

  socket.on("order:accept", async ({ orderId, buyerId, buyerName }) => {
    try {
      const order = await Order.findById(orderId)
        .populate("buyerId", "name phone avatar")
        .populate("sellerId", "name phone avatar")
        .populate("listingId");

      if (!order) {
        socket.emit("order:error", { message: "Đơn hàng không tồn tại" });
        return;
      }

      if (buyerId && String(order.buyerId?._id || order.buyerId) !== String(buyerId)) {
        socket.emit("order:error", { message: "Người mua không khớp với đơn hàng" });
        return;
      }

      order.status = order.status || "accepted";
      await order.save();

      const sellerId = String(order.sellerId?._id || order.sellerId);
      const buyer = order.buyerId || {};
      const listing = order.listingId || {};
      const resolvedBuyerName = buyerName || buyer.name || "Người mua";

      io.to(sellerId).emit("order:notification", {
        orderId: String(order._id),
        listingId: String(listing._id || listing),
        type: "order:accepted",
        buyerId: String(buyer._id || buyerId || ""),
        buyerName: resolvedBuyerName,
        buyerPhone: buyer.phone || "",
        buyerAvatar: buyer.avatar || "",
        message: `${resolvedBuyerName} đã nhận đơn rác của bạn.`,
        timestamp: new Date().toISOString(),
      });

      io.to(sellerId).emit("order:status_updated", {
        orderId: String(order._id),
        status: order.status,
      });
    } catch (err) {
      console.error("Lỗi gửi thông báo nhận đơn:", err.message);
      socket.emit("order:error", { message: "Không thể gửi thông báo nhận đơn" });
    }
  });

  socket.on("gps:update", async (data) => {
    try {
      const order = await Order.findById(data.orderId).select("sellerId");
      if (!order) return;

      io.to(String(order.sellerId)).emit("gps:update", {
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    } catch (err) {
      console.error("Lỗi gửi GPS update:", err.message);
    }
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
