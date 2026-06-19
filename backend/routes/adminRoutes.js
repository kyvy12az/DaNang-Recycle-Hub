const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.get("/users", adminAuth, adminController.getAllUsers);
router.put("/users/:userId/toggle-lock", adminAuth, adminController.toggleLockUser);

// Phân hệ quản lý Đơn rác 
router.get("/listings", adminAuth, adminController.getAllListings);
router.put("/listings/:id/status", adminAuth, adminController.updateListingStatus);

// Phân hệ quản lý Điểm xanh/Giao dịch 
// router.get("/transactions", adminAuth, adminController.getPointTransactions);

module.exports = router;