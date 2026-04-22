const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// API đăng ký
router.post("/register", authController.register);

// API đăng nhập
router.post("/login", authController.login);

// API đăng nhập Google
router.post("/auth/google", authController.googleLogin);

router.put("/users/profile", authController.authMiddleware, authController.updateProfile);

module.exports = router;