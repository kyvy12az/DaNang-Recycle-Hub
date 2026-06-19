const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");

// Get order by ID
router.get("/:id", orderController.getOrderById);

// Create new order
router.post("/", authController.authMiddleware, orderController.createOrder);

// Update order status
router.put("/:id/status", authController.authMiddleware, orderController.updateOrderStatus);

// Get current user's orders (buyer)
router.get("/user/my-orders", authController.authMiddleware, orderController.getMyOrders);

// Get seller's orders
router.get("/seller/orders", authController.authMiddleware, orderController.getSellerOrders);

// Accept order
router.post("/:id/accept", authController.authMiddleware, orderController.acceptOrder);

// Seller confirms buyer's order (realtime navigate buyer to tracking)
router.put("/:id/seller-confirm", authController.authMiddleware, orderController.sellerConfirmOrder);

// Seller rejects buyer's order
router.put("/:id/seller-reject", authController.authMiddleware, orderController.sellerRejectOrder);

// Add GPS coordinate
router.post("/:id/gps", orderController.addGPSCoordinate);

module.exports = router;
