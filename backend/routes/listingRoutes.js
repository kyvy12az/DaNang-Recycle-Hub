const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const authController = require("../controllers/authController");

// api lấy danh sách bài thu gom rác 
router.get("/", listingController.getListings);

// api chi tiết bài thu gom rác theo id
router.get("/:id", listingController.getListingById);

// api lấy các bài viết của người dùng
router.get("/user/my-listings", authController.authMiddleware, listingController.getMyListings);

// tạo bài viết mới
router.post("/", authController.authMiddleware, listingController.createListing);

module.exports = router;
