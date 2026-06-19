const Leaderboard = require("../models/Leaderboard");
const Badge = require("../models/Badge");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Order = require("../models/Order");

// Reward configuration by period
const REWARDS_CONFIG = {
  weekly: {
    top1: { points: 100, badge: "top1" },
    top2: { points: 50, badge: "top2" },
    top3: { points: 25, badge: "top3" },
  },
  monthly: {
    top1: { points: 300, badge: "top1" },
    top2: { points: 150, badge: "top2" },
    top3: { points: 75, badge: "top3" },
  },
  yearly: {
    top1: { points: 1000, badge: "top1" },
    top2: { points: 500, badge: "top2" },
    top3: { points: 250, badge: "top3" },
  },
};

// Helper function to get rewards by period
function getRewards(periodType) {
  return REWARDS_CONFIG[periodType] || REWARDS_CONFIG.weekly;
}

class LeaderboardService {
  /**
   * Calculate leaderboard for a specific period
   * @param {Date} startDate - Period start date
   * @param {Date} endDate - Period end date
   * @param {String} periodType - 'weekly', 'monthly', 'yearly'
   * @returns {Array} Sorted leaderboard entries
   */
  async calculateLeaderboard(startDate, endDate, periodType) {
    try {
      const Listing = require("../models/Listing");

      // Aggregate listings completed trong khoảng thời gian, group theo sellerId
      const pipeline = [
        {
          $match: {
            status: "completed",
            updatedAt: { $gte: startDate, $lte: endDate },
            totalWeight: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: "$sellerId",
            sellerName: { $last: "$sellerName" },
            periodWeight: { $sum: "$totalWeight" },
          },
        },
        { $sort: { periodWeight: -1 } },
      ];

      const aggregated = await Listing.aggregate(pipeline);

      console.log(`[Leaderboard] Found ${aggregated.length} users with completed listings in period`);

      // Build leaderboard data with ranks
      const leaderboardData = aggregated.map((entry, index) => ({
        userId: entry._id,
        userName: entry.sellerName || "Unknown User",
        rankPosition: index + 1,
        totalWeightScrapped: entry.periodWeight || 0,
        accumulatedPoints: 0, // Will be filled after reward distribution
        periodType,
        snapshotDate: new Date(endDate),
        rewardStatus: "pending",
      }));

      console.log(`[Leaderboard] Calculated ${leaderboardData.length} leaderboard entries for ${periodType}`);

      return leaderboardData;
    } catch (error) {
      console.error("Error calculating leaderboard:", error);
      throw error;
    }
  }

  /**
   * Finalize leaderboard and distribute rewards
   * @param {Array} leaderboardData - Leaderboard entries
   * @param {String} periodType - 'weekly', 'monthly', 'yearly'
   * @returns {Object} Finalization result
   */
  async finalizeAndReward(leaderboardData, periodType = "weekly") {
    const session = await Leaderboard.startSession();
    session.startTransaction();

    try {
      const rewards = getRewards(periodType);
      const results = {
        distributed: 0,
        failed: 0,
        details: [],
      };

      // Award top 3
      for (let i = 0; i < Math.min(3, leaderboardData.length); i++) {
        const entry = leaderboardData[i];
        const position = i + 1;
        const rewardKey = `top${position}`;
        const reward = rewards[rewardKey];

        try {
          // Update user with green points
          await User.findByIdAndUpdate(
            entry.userId,
            {
              $inc: { greenPoints: reward.points },
              $inc: { "leaderboardStats.totalBadges": 1 },
            },
            { session }
          );

          // Create badge
          const badge = new Badge({
            userId: entry.userId,
            badgeType: `${entry.periodType}_${rewardKey}`,
            earnedDate: new Date(),
            periodEndDate: entry.snapshotDate,
            status: "active",
          });
          await badge.save({ session });

          // Update user's badges array
          await User.findByIdAndUpdate(
            entry.userId,
            { $push: { badges: badge._id } },
            { session }
          );

          // Update leaderboard entry
          entry.accumulatedPoints = reward.points;
          entry.rewardStatus = "distributed";

          results.distributed++;
          results.details.push({
            rank: position,
            userId: entry.userId,
            userName: entry.userName,
            pointsAwarded: reward.points,
            badgeType: badge.badgeType,
            success: true,
          });
        } catch (error) {
          console.error(`Error rewarding user at rank ${position}:`, error);
          results.failed++;
          results.details.push({
            rank: position,
            userId: entry.userId,
            userName: entry.userName,
            success: false,
            error: error.message,
          });
        }
      }

      // Save leaderboard entries
      for (let i = 3; i < leaderboardData.length; i++) {
        leaderboardData[i].rewardStatus = "pending";
      }

      await Leaderboard.insertMany(leaderboardData, { session });

      await session.commitTransaction();
      return results;
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction error in finalizeAndReward:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Finalize weekly leaderboard (runs on Sunday 23:59:59)
   */
  async finalizeWeeklyLeaderboard() {
    try {
      console.log("[Leaderboard] Starting weekly finalization...");
      const now = new Date();
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      // Calculate start of week (Monday)
      const startDate = new Date(now);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);

      const leaderboardData = await this.calculateLeaderboard(
        startDate,
        endDate,
        "weekly"
      );
      const result = await this.finalizeAndReward(leaderboardData, "weekly");

      console.log("[Leaderboard] Weekly finalization completed:", result);
      return result;
    } catch (error) {
      console.error("Error finalizing weekly leaderboard:", error);
      throw error;
    }
  }

  /**
   * Finalize monthly leaderboard (runs on last day of month)
   */
  async finalizeMonthlyLeaderboard() {
    try {
      console.log("[Leaderboard] Starting monthly finalization...");
      const now = new Date();
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      // First day of current month
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      const leaderboardData = await this.calculateLeaderboard(
        startDate,
        endDate,
        "monthly"
      );
      const result = await this.finalizeAndReward(leaderboardData, "monthly");

      console.log("[Leaderboard] Monthly finalization completed:", result);
      return result;
    } catch (error) {
      console.error("Error finalizing monthly leaderboard:", error);
      throw error;
    }
  }

  /**
   * Finalize yearly leaderboard (runs on Dec 31 23:59:59)
   */
  async finalizeYearlyLeaderboard() {
    try {
      console.log("[Leaderboard] Starting yearly finalization...");
      const now = new Date();
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      // First day of year
      const startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);

      const leaderboardData = await this.calculateLeaderboard(
        startDate,
        endDate,
        "yearly"
      );
      const result = await this.finalizeAndReward(leaderboardData, "yearly");

      console.log("[Leaderboard] Yearly finalization completed:", result);
      return result;
    } catch (error) {
      console.error("Error finalizing yearly leaderboard:", error);
      throw error;
    }
  }

  /**
   * Get current leaderboard for a period
   * @param {String} periodType - 'weekly', 'monthly', 'yearly'
   * @param {Number} limit - Number of entries to return (default 50)
   */
  async getLeaderboardByPeriod(periodType, limit = 50) {
    try {
      // Get most recent snapshot date
      const latestSnapshot = await Leaderboard.findOne({ periodType })
        .sort({ snapshotDate: -1 })
        .select("snapshotDate")
        .exec();

      if (!latestSnapshot) {
        return [];
      }

      const leaderboard = await Leaderboard.find({
        periodType,
        snapshotDate: latestSnapshot.snapshotDate,
      })
        .sort({ rankPosition: 1 })
        .limit(limit)
        .lean();

      return leaderboard;
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw error;
    }
  }

  /**
   * Get user's current leaderboard position across all periods
   * @param {String} userId - User ID
   */
  async getUserLeaderboardStats(userId) {
    try {
      const stats = {
        weekly: null,
        monthly: null,
        yearly: null,
      };

      for (const periodType of ["weekly", "monthly", "yearly"]) {
        const latestSnapshot = await Leaderboard.findOne({
          userId,
          periodType,
        })
          .sort({ snapshotDate: -1 })
          .lean();

        if (latestSnapshot) {
          stats[periodType] = {
            rankPosition: latestSnapshot.rankPosition,
            totalWeightScrapped: latestSnapshot.totalWeightScrapped,
            accumulatedPoints: latestSnapshot.accumulatedPoints,
            snapshotDate: latestSnapshot.snapshotDate,
          };
        }
      }

      return stats;
    } catch (error) {
      console.error("Error fetching user leaderboard stats:", error);
      throw error;
    }
  }

  /**
   * Get historical leaderboard for a specific period and date
   * @param {String} periodType - 'weekly', 'monthly', 'yearly'
   * @param {Date} snapshotDate - Specific snapshot date
   * @param {Number} limit - Number of entries to return
   */
  async getHistoricalLeaderboard(periodType, snapshotDate, limit = 50) {
    try {
      const leaderboard = await Leaderboard.find({
        periodType,
        snapshotDate: new Date(snapshotDate),
      })
        .sort({ rankPosition: 1 })
        .limit(limit)
        .lean();

      return leaderboard;
    } catch (error) {
      console.error("Error fetching historical leaderboard:", error);
      throw error;
    }
  }

  /**
   * Reset leaderboard (admin use only)
   * @param {String} periodType - Optional, reset specific period or all if not provided
   */
  async resetLeaderboard(periodType = null) {
    try {
      if (periodType) {
        await Leaderboard.deleteMany({ periodType });
      } else {
        await Leaderboard.deleteMany({});
      }
      console.log(
        `[Leaderboard] Reset completed for: ${periodType || "all periods"}`
      );
    } catch (error) {
      console.error("Error resetting leaderboard:", error);
      throw error;
    }
  }
}

module.exports = new LeaderboardService();
