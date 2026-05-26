const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdraw", "sale", "purchase", "redeem", "bonus"],
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index(
  { userId: 1, orderId: 1, type: 1 },
  { unique: true, partialFilterExpression: { orderId: { $type: "objectId" } } }
);

module.exports = mongoose.model("Transaction", transactionSchema);
