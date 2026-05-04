const express = require("express");
const router = express.Router();


const authController = require("../controllers/authController");
const listingController = require("../controllers/listingController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/auth/google", authController.googleLogin);
router.put("/users/profile", authController.authMiddleware, authController.updateProfile);

// router cho listing các bài đăng mua bán rác
router.post("/listings", authController.authMiddleware, listingController.createListing);
router.get("/listings/my", authController.authMiddleware, listingController.getMyListings); 
router.get("/listings/:id", listingController.getListingById);
router.get("/listings", listingController.getListings);

module.exports = router;