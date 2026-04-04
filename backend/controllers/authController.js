const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// TRONG FILE userController.js
  exports.register = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email này đã được đăng ký!" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword });
      await user.save();

      const token = jwt.sign({ id: user._id }, "secretkey", { expiresIn: "7d" });

      return res.status(201).json({ 
        message: "Register success", 
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
          provider: 'email'
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || "Lỗi Server nội bộ" });
    }
  };

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Tài khoản không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu,vui lòng thử lại" });
    }

    const token = jwt.sign(
      { id: user._id },
      "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login success",
      token,
      user: { 
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        provider: 'email'
      }
    });

  } catch (err) {
    res.status(500).json(err);
  }
};