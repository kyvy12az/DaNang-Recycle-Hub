const mongoose = require("mongoose");

const wasteItemSchema = new mongoose.Schema({
  wasteTypeId: { type: String, required: true },
  wasteTypeName: { type: String, required: true },
  wasteTypeCategory: { type: String },
  wasteTypeColor: { type: String },
  pricePerKg: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 0 },
  estimatedPrice: { type: Number, required: true },
});

const listingSchema = new mongoose.Schema(
  {
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    sellerName: { 
        type: String, 
        required: true 
    },

    sellerAvatar: { 
        type: String, 
        default: null 
    },

    items: [wasteItemSchema],

    totalPrice: { 
        type: Number, 
        required: true, 
        min: 0 
    },

    totalWeight: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    greenPoints: { 
        type: Number, 
        default: 0 
    },

    address: { 
        type: String, 
        required: true 
    },

    district: { 
        type: String, 
        default: "" 
    },

    note: { 
        type: String, 
        default: "" 
    },

    pickupTime: { 
        type: String, 
        required: true 
    },

    imageUrl: { 
        type: String, 
        default: null 
    },

    status: {
      type: String,
      enum: ["available", "pending", "completed", "cancelled"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);