const mongoose = require("mongoose");
const Order = require("../models/Order");
const Listing = require("../models/Listing");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { settleCompletedOrder } = require("../services/orderSettlementService");

let io = null;

exports.setIO = (ioInstance) => {
  io = ioInstance;
};

exports.getOrderById = async (req, res) => {
  try {
    let orderId = req.params.id;
    let order = null;

    if (orderId && typeof orderId === "string" && orderId.startsWith("ORDER_")) {
      const listingId = orderId.substring(6);
      if (mongoose.Types.ObjectId.isValid(listingId)) {
        order = await Order.findOne({ listingId })
          .populate("buyerId", "name phone avatar")
          .populate("sellerId", "name phone avatar")
          .populate("listingId");
      }
    } else if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId)
        .populate("buyerId", "name phone avatar")
        .populate("sellerId", "name phone avatar")
        .populate("listingId");
    } else {
      return res.status(400).json({ message: "Định dạng mã đơn hàng không hợp lệ" });
    }

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Lỗi lấy order:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { listingId, estimatedWeight, estimatedPrice, estimatedGreenPoints, status } = req.body;

    // Get listing to find seller
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    const order = await Order.create({
      listingId,
      buyerId: req.userId,
      sellerId: listing.sellerId,
      estimatedWeight,
      estimatedPrice,
      estimatedGreenPoints,
      status: status || "pending",
    });

    listing.status = "pending_confirmation";
    await listing.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("buyerId", "name phone avatar")
      .populate("sellerId", "name phone avatar")
      .populate("listingId");

    if (io && populatedOrder?.sellerId?._id) {
      const buyer = populatedOrder.buyerId || {};
      const sellerId = populatedOrder.sellerId._id.toString();
      const buyerName = buyer.name || "Người mua";

      // Lưu thông báo vào DB cho seller
      try {
        const dbNotif = await Notification.create({
          userId: sellerId,
          type: "order_created",
          listingId: listing._id,
          orderId: populatedOrder._id,
          title: `Có người đã nhận đơn thu gom rác của bạn! 🎉`,
          message: `Người mua ${buyerName} đã nhận đơn thu gom rác của bạn.`,
          status: "pending",
          isRead: false,
        });

        // Emit socket notification:new cho seller (realtime vào trang thông báo)
        io.to(sellerId).emit("notification:new", {
          id: dbNotif._id.toString(),
          type: "order_created",
          listingId: listing._id.toString(),
          orderId: populatedOrder._id.toString(),
          title: dbNotif.title,
          message: dbNotif.message,
          status: "pending",
          isRead: false,
          timestamp: dbNotif.createdAt,
        });
      } catch (notifErr) {
        console.error("[Order] Lỗi lưu notification:", notifErr);
      }

      // Emit order:notification cho seller (toast in app)
      io.to(sellerId).emit("order:notification", {
        orderId: populatedOrder._id.toString(),
        listingId: listing._id.toString(),
        type: "order:created",
        buyerId: buyer._id?.toString() || req.userId,
        buyerName,
        buyerPhone: buyer.phone || "",
        buyerAvatar: buyer.avatar || "",
        message: `Người mua ${buyerName} đã nhận đơn thu gom rác của bạn.`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("Lỗi tạo order:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      paymentMethod,
      paymentStatus,
      actualWeight,
      actualPrice,
      actualGreenPoints,
    } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }
    const previousPaymentStatus = order.paymentStatus;

    if (status) order.status = status;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (actualWeight !== undefined) order.actualWeight = actualWeight;
    if (actualPrice !== undefined) order.actualPrice = actualPrice;
    if (actualGreenPoints !== undefined) order.actualGreenPoints = actualGreenPoints;

    if (status === "completed") {
      order.completedAt = new Date();
      await Listing.findByIdAndUpdate(order.listingId, { status: "completed" });
    }

    await order.save();

    if (order.paymentStatus === "completed" && previousPaymentStatus !== "completed") {
      await settleCompletedOrder(order._id);

      try {
        const sellerIdStr = order.sellerId?.toString();
        const priceStr = (order.actualPrice || 0).toLocaleString('vi-VN') + 'đ';
        const dbNotif = await Notification.create({
          userId: sellerIdStr,
          type: "order_status",
          listingId: order.listingId,
          orderId: order._id,
          title: `Thanh toán thành công! 💰`,
          message: `Người thu gom đã thanh toán thành công số tiền ${priceStr} cho đơn rác.`,
          status: "completed",
          isRead: false,
        });

        if (io && sellerIdStr) {
          io.to(sellerIdStr).emit("notification:new", {
            id: dbNotif._id.toString(),
            type: "order_status",
            listingId: String(order.listingId),
            orderId: String(order._id),
            title: dbNotif.title,
            message: dbNotif.message,
            status: "completed",
            isRead: false,
            timestamp: dbNotif.createdAt,
          });
        }
      } catch (err) {
        console.error("Lỗi tạo thông báo thanh toán:", err);
      }
    }

    const updatedOrder = await Order.findById(id)
      .populate("buyerId", "name phone avatar")
      .populate("sellerId", "name phone avatar")
      .populate("listingId");

    if (io && updatedOrder) {
      const payload = {
        orderId: updatedOrder._id.toString(),
        status: updatedOrder.status,
        actualWeight: updatedOrder.actualWeight,
        actualPrice: updatedOrder.actualPrice,
        actualGreenPoints: updatedOrder.actualGreenPoints,
        paymentMethod: updatedOrder.paymentMethod,
        paymentStatus: updatedOrder.paymentStatus,
        updatedAt: updatedOrder.updatedAt,
      };

      const buyerId = updatedOrder.buyerId?._id?.toString();
      const sellerId = updatedOrder.sellerId?._id?.toString();
      if (buyerId) io.to(buyerId).emit("order:status_updated", payload);
      if (sellerId) io.to(sellerId).emit("order:status_updated", payload);
    }

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Lỗi cập nhật order:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.userId })
      .populate("sellerId", "name phone avatar")
      .populate("listingId")
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi lấy my orders:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.userId })
      .populate("buyerId", "name phone avatar")
      .populate("listingId")
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi lấy seller orders:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    order.status = "accepted";
    order.buyerName = req.body.buyerName || order.buyerName;

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("buyerId", "name phone avatar")
      .populate("sellerId", "name phone avatar")
      .populate("listingId");

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Lỗi accept order:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.addGPSCoordinate = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $push: {
          gpsCoordinates: {
            latitude,
            longitude,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    return res.status(200).json(order);
  } catch (error) {
    console.error("Lỗi add GPS:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Seller xác nhận đơn hàng (chấp nhận người mua)
exports.sellerConfirmOrder = async (req, res) => {
  try {
    const { id } = req.params; // orderId

    const order = await Order.findById(id)
      .populate("buyerId", "name phone avatar")
      .populate("sellerId", "name phone avatar");

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    // Kiểm tra seller là người đang request
    if (String(order.sellerId?._id || order.sellerId) !== String(req.userId)) {
      return res.status(403).json({ message: "Bạn không có quyền xác nhận đơn này" });
    }

    order.status = "accepted";
    await order.save();
    
    await Listing.findByIdAndUpdate(order.listingId, { status: "pending" });

    const buyerId = order.buyerId?._id?.toString() || order.buyerId?.toString();

    if (io && buyerId) {
      // Emit cho buyer để chuyển sang tracking page realtime
      io.to(buyerId).emit("order:seller_confirmed", {
        orderId: id,
        listingId: String(order.listingId),
        status: "accepted",
        message: "Người bán đã xác nhận đơn hàng của bạn!",
        timestamp: new Date().toISOString(),
      });

      // Lưu thông báo vào DB cho buyer
      try {
        const dbNotif = await Notification.create({
          userId: buyerId,
          type: "order_accepted",
          listingId: order.listingId,
          orderId: order._id,
          title: `Đơn hàng đã được xác nhận! ✅`,
          message: `Người bán đã đồng ý giao dịch.`,
          status: "accepted",
          isRead: false,
        });

        io.to(buyerId).emit("notification:new", {
          id: dbNotif._id.toString(),
          type: "order_accepted",
          listingId: String(order.listingId),
          orderId: String(order._id),
          title: dbNotif.title,
          message: dbNotif.message,
          status: "accepted",
          isRead: false,
          timestamp: dbNotif.createdAt,
        });
      } catch (notifErr) {
        console.error("[Order] Lỗi lưu notification khi seller xác nhận:", notifErr);
      }
    }

    return res.status(200).json({ success: true, orderId: id, status: "accepted" });
  } catch (error) {
    console.error("Lỗi seller confirm order:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Seller hủy đơn hàng
exports.sellerRejectOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("buyerId", "name phone avatar")
      .populate("sellerId", "name phone avatar");

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (String(order.sellerId?._id || order.sellerId) !== String(req.userId)) {
      return res.status(403).json({ message: "Bạn không có quyền hủy đơn này" });
    }

    const listingId = order.listingId?.toString();
    const buyerId = order.buyerId?._id?.toString() || order.buyerId?.toString();

    // Xóa order và khôi phục listing về approved
    await order.deleteOne();
    await Listing.findByIdAndUpdate(listingId, { status: "approved" });

    if (io && buyerId) {
      io.to(buyerId).emit("order:seller_rejected", {
        listingId,
        message: "Người bán đã từ chối đơn hàng của bạn.",
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({ success: true, message: "Đã hủy đơn thành công" });
  } catch (error) {
    console.error("Lỗi seller reject order:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
