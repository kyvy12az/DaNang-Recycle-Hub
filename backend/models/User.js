const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: ["email", "google", "zalo"],
      default: "email",
    },
    googleId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("User", userSchema);