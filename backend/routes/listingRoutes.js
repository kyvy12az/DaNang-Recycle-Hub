const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const authController = require("../controllers/authController");

// Get all listings with filters
router.get("/", listingController.getListings);

// Get single listing by ID
router.get("/:id", listingController.getListingById);

// Get current user's listings
router.get("/user/my-listings", authController.authMiddleware, listingController.getMyListings);

// Create new listing
router.post("/", authController.authMiddleware, listingController.createListing);

module.exports = router;
