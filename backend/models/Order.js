const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerName: {
      type: String,
      default: null,
    },
    estimatedWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedGreenPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualWeight: {
      type: Number,
      default: null,
    },
    actualPrice: {
      type: Number,
      default: null,
    },
    actualGreenPoints: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "arriving", "arrived", "measured", "completed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["momo", "cash", "pending"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    gpsCoordinates: [
      {
        latitude: Number,
        longitude: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    confirmedBySellerAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    paymentSettledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
