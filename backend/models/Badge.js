const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    badgeType: {
      type: String,
      enum: [
        "weekly_top1",
        "weekly_top2",
        "weekly_top3",
        "monthly_top1",
        "monthly_top2",
        "monthly_top3",
        "yearly_top1",
        "yearly_top2",
        "yearly_top3",
      ],
      required: true,
    },
    earnedDate: {
      type: Date,
      required: true,
      index: true,
    },
    periodEndDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Prevent duplicate badges
badgeSchema.index(
  { userId: 1, badgeType: 1, earnedDate: 1 },
  { unique: true }
);

// Index for quick badge retrieval
badgeSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Badge", badgeSchema);
