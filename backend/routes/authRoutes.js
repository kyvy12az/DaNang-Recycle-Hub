const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// API đăng ký
router.post("/register", authController.register);

// API đăng nhập
router.post("/login", authController.login);

module.exports = router;