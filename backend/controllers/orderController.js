const mongoose = require("mongoose");
const Order = require("../models/Order");
const Listing = require("../models/Listing");
const User = require("../models/User");
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
      status: status || "accepted",
    });

    listing.status = "pending";
    await listing.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("buyerId", "name phone avatar")
      .populate("sellerId", "name phone avatar")
      .populate("listingId");

    if (io && populatedOrder?.sellerId?._id) {
      const buyer = populatedOrder.buyerId || {};
      const sellerId = populatedOrder.sellerId._id.toString();
      const buyerName = buyer.name || "Người mua";

      io.to(sellerId).emit("order:notification", {
        orderId: populatedOrder._id.toString(),
        listingId: listing._id.toString(),
        type: "order:accepted",
        buyerId: buyer._id?.toString() || req.userId,
        buyerName,
        buyerPhone: buyer.phone || "",
        buyerAvatar: buyer.avatar || "",
        message: `${buyerName} đã nhận đơn rác của bạn.`,
        timestamp: new Date().toISOString(),
      });

      io.to(sellerId).emit("order:status_updated", {
        orderId: populatedOrder._id.toString(),
        status: populatedOrder.status,
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

    if (order.paymentStatus === "completed") {
      await settleCompletedOrder(order._id);
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
