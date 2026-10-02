const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");

// api lấy order theo id
router.get("/:id", orderController.getOrderById);

// api tạo order mới
router.post("/", authController.authMiddleware, orderController.createOrder);

// api cập nhật trạng thái order
router.put("/:id/status", authController.authMiddleware, orderController.updateOrderStatus);

// api lấy danh sách order của user hiện tại
router.get("/user/my-orders", authController.authMiddleware, orderController.getMyOrders);

// api lấy danh sách order của seller
router.get("/seller/orders", authController.authMiddleware, orderController.getSellerOrders);

// api chấp nhận order
router.post("/:id/accept", authController.authMiddleware, orderController.acceptOrder);

// api xác nhận order của buyer
router.put("/:id/seller-confirm", authController.authMiddleware, orderController.sellerConfirmOrder);

// api từ chối order của buyer
router.put("/:id/seller-reject", authController.authMiddleware, orderController.sellerRejectOrder);

// api thêm tọa độ GPS
router.post("/:id/gps", orderController.addGPSCoordinate);

module.exports = router;
