const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["listing_status", "order_status", "general", "order_accepted", "order_created"],
      default: "general",
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String, // 'approved', 'rejected', v.v.
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model("Notification", NotificationSchema);