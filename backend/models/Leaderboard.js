const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rankPosition: {
      type: Number,
      required: true,
      min: 1,
    },
    totalWeightScrapped: {
      type: Number,
      default: 0,
      min: 0,
    },
    accumulatedPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    periodType: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      required: true,
      index: true,
    },
    snapshotDate: {
      type: Date,
      required: true,
      index: true,
    },
    rewardStatus: {
      type: String,
      enum: ["pending", "distributed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);

// Create composite index for unique leaderboard entries per period
leaderboardSchema.index(
  { userId: 1, periodType: 1, snapshotDate: 1 },
  { unique: true }
);

// Index for quick leaderboard lookups
leaderboardSchema.index({ periodType: 1, snapshotDate: 1, rankPosition: 1 });

// Index for user's leaderboard history
leaderboardSchema.index({ userId: 1, periodType: 1 });

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
