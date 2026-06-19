const leaderboardService = require("../services/leaderboardService");
const Leaderboard = require("../models/Leaderboard");
const Badge = require("../models/Badge");
const User = require("../models/User");
const Order = require("../models/Order");

// Lấy bảng xếp hạng theo khoảng thời gian (weekly, monthly, yearly)
exports.getLeaderboardByPeriod = async (req, res) => {
  try {
    const { period = "weekly" } = req.params;
    const { limit = 50 } = req.query;

    if (!["weekly", "monthly", "yearly"].includes(period)) {
      return res.status(400).json({
        success: false,
        error: "Invalid period. Must be: weekly, monthly, or yearly",
      });
    }

    const leaderboard = await leaderboardService.getLeaderboardByPeriod(
      period,
      Math.min(parseInt(limit), 100)
    );

    res.status(200).json({
      success: true,
      period,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard",
      message: error.message,
    });
  }
};

// Lấy bảng xếp hạng trực tiếp từ bảng listings có status=completed.
// Aggregate totalWeight theo sellerId trong khoảng thời gian (weekly/monthly/yearly).
exports.getLiveLeaderboard = async (req, res) => {
  try {
    const { period = "weekly" } = req.params;
    const { limit = 100 } = req.query;

    if (!["weekly", "monthly", "yearly"].includes(period)) {
      return res.status(400).json({
        success: false,
        error: "Invalid period. Must be: weekly, monthly, or yearly",
      });
    }

    const now = new Date();
    let startDate;

    if (period === "weekly") {
      // Đầu tuần hiện tại (thứ Hai 00:00:00)
      const day = now.getDay(); // 0=CN, 1=T2...
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
    } else if (period === "monthly") {
      // Ngày 1 của tháng hiện tại
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else {
      // Ngày 1/1 của năm hiện tại
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    }

    const Listing = require("../models/Listing");

    // Aggregate listings completed trong khoảng thời gian, group theo sellerId
    const pipeline = [
      {
        $match: {
          status: "completed",
          updatedAt: { $gte: startDate, $lte: now },
          totalWeight: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: "$sellerId",
          sellerName: { $last: "$sellerName" },
          periodWeight: { $sum: "$totalWeight" },
          listingCount: { $sum: 1 },
        },
      },
      { $sort: { periodWeight: -1 } },
      { $limit: Math.min(parseInt(limit), 200) },
    ];

    const aggregated = await Listing.aggregate(pipeline);

    if (aggregated.length === 0) {
      return res.status(200).json({
        success: true,
        period,
        source: "listings_completed",
        count: 0,
        data: [],
      });
    }

    // Lấy greenPoints từ User (optional enrichment)
    const userIds = aggregated.map((a) => a._id).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id greenPoints")
      .lean();
    const pointsMap = {};
    users.forEach((u) => {
      pointsMap[u._id.toString()] = u.greenPoints || 0;
    });

    const leaderboard = aggregated.map((entry, i) => ({
      _id: `live_${entry._id}_${period}`,
      userId: entry._id,
      userName: entry.sellerName || "Unknown",
      rankPosition: i + 1,
      totalWeightScrapped: entry.periodWeight || 0,
      accumulatedPoints: pointsMap[entry._id?.toString()] || 0,
      listingCount: entry.listingCount || 0,
      periodType: period,
      snapshotDate: now,
      rewardStatus: "pending",
    }));

    return res.status(200).json({
      success: true,
      period,
      source: "listings_completed",
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Error fetching live leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch live leaderboard",
      message: error.message,
    });
  }
};


// lấy tất cả bảng xếp hạng hiện tại cho cả 3 khoảng thời gian (weekly, monthly, yearly) trong một lần gọi API.
exports.getAllCurrentLeaderboards = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const maxLimit = Math.min(parseInt(limit), 100);

    const leaderboards = {
      weekly: await leaderboardService.getLeaderboardByPeriod("weekly", maxLimit),
      monthly: await leaderboardService.getLeaderboardByPeriod(
        "monthly",
        maxLimit
      ),
      yearly: await leaderboardService.getLeaderboardByPeriod("yearly", maxLimit),
    };

    res.status(200).json({
      success: true,
      data: leaderboards,
    });
  } catch (error) {
    console.error("Error fetching all leaderboards:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboards",
      message: error.message,
    });
  }
};

// lấy thống kê bảng xếp hạng của một người dùng cụ thể, bao gồm tổng điểm xanh, số lượng huy hiệu đã nhận, và các vị trí xếp hạng trong các khoảng thời gian khác nhau.
exports.getUserLeaderboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "name greenPoints leaderboardStats badges"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // lấy thống kê bảng xếp hạng của người dùng từ service
    const leaderboardStats =
      await leaderboardService.getUserLeaderboardStats(userId);

    // lấy tất cả huy hiệu của người dùng (cả active và archived) để hiển thị chi tiết
    const badges = await Badge.find({ userId, status: "active" }).lean();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        greenPoints: user.greenPoints,
        totalBadges: user.leaderboardStats?.totalBadges || 0,
      },
      leaderboardStats,
      badges: badges.map((badge) => ({
        type: badge.badgeType,
        earnedDate: badge.earnedDate,
        periodEndDate: badge.periodEndDate,
      })),
    });
  } catch (error) {
    console.error("Error fetching user leaderboard stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user leaderboard stats",
      message: error.message,
    });
  }
};

// lấy bảng xếp hạng lịch sử cho một khoảng thời gian và ngày chụp cụ thể, cho phép người dùng xem lại bảng xếp hạng của các khoảng thời gian trước đó.
exports.getHistoricalLeaderboard = async (req, res) => {
  try {
    const { period, snapshotDate } = req.params;
    const { limit = 50 } = req.query;

    if (!["weekly", "monthly", "yearly"].includes(period)) {
      return res.status(400).json({
        success: false,
        error: "Invalid period. Must be: weekly, monthly, or yearly",
      });
    }

    const date = new Date(snapshotDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use ISO format (YYYY-MM-DD)",
      });
    }

    const leaderboard = await leaderboardService.getHistoricalLeaderboard(
      period,
      date,
      Math.min(parseInt(limit), 100)
    );

    res.status(200).json({
      success: true,
      period,
      snapshotDate: date,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Error fetching historical leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch historical leaderboard",
      message: error.message,
    });
  }
};

// lấy tất cả huy hiệu của một người dùng cụ thể, bao gồm cả huy hiệu đang hoạt động và đã lưu trữ, để hiển thị chi tiết về thành tích của người dùng đó trong các bảng xếp hạng trước đây.
exports.getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = "active" } = req.query;

    const user = await User.findById(userId).select("name");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const query = { userId };
    if (status && ["active", "archived"].includes(status)) {
      query.status = status;
    }

    const badges = await Badge.find(query)
      .sort({ earnedDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
      },
      count: badges.length,
      badges,
    });
  } catch (error) {
    console.error("Error fetching user badges:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user badges",
      message: error.message,
    });
  }
};

// lấy tổng quan về bảng xếp hạng hiện tại, bao gồm ngày chụp mới nhất cho mỗi khoảng thời gian, ngày dự kiến cho lần chốt thưởng tiếp theo, tổng số người dùng trong bảng xếp hạng, và thống kê về các loại huy hiệu đã được trao.
exports.getLeaderboardSummary = async (req, res) => {
  try {
    // Get latest snapshots for each period
    const latestSnapshots = await Promise.all([
      Leaderboard.findOne({ periodType: "weekly" })
        .sort({ snapshotDate: -1 })
        .select("snapshotDate"),
      Leaderboard.findOne({ periodType: "monthly" })
        .sort({ snapshotDate: -1 })
        .select("snapshotDate"),
      Leaderboard.findOne({ periodType: "yearly" })
        .sort({ snapshotDate: -1 })
        .select("snapshotDate"),
    ]);

    const now = new Date();

    const nextWeekly = new Date(now);
    nextWeekly.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
    nextWeekly.setHours(23, 59, 59, 999);

    let nextMonthly = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    nextMonthly.setHours(23, 59, 59, 999);
    if (now > nextMonthly) {
      nextMonthly = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      nextMonthly.setHours(23, 59, 59, 999);
    }

    let nextYearly = new Date(now.getFullYear(), 11, 31);
    nextYearly.setHours(23, 59, 59, 999);
    if (now > nextYearly) {
      nextYearly = new Date(now.getFullYear() + 1, 11, 31);
      nextYearly.setHours(23, 59, 59, 999);
    }

    const badgeCounts = await Badge.aggregate([
      {
        $group: {
          _id: "$badgeType",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      summary: {
        lastSnapshots: {
          weekly: latestSnapshots[0]?.snapshotDate || null,
          monthly: latestSnapshots[1]?.snapshotDate || null,
          yearly: latestSnapshots[2]?.snapshotDate || null,
        },
        nextFinalization: {
          weekly: nextWeekly,
          monthly: nextMonthly,
          yearly: nextYearly,
        },
        totalUsers: await Leaderboard.countDocuments(),
        badgeStats: badgeCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard summary",
      message: error.message,
    });
  }
};

exports.adminFinalizeLeaderboard = async (req, res) => {
  try {
    const { period } = req.params;

    if (!["weekly", "monthly", "yearly"].includes(period)) {
      return res.status(400).json({
        success: false,
        error: "Invalid period. Must be: weekly, monthly, or yearly",
      });
    }

    let result;
    switch (period) {
      case "weekly":
        result = await leaderboardService.finalizeWeeklyLeaderboard();
        break;
      case "monthly":
        result = await leaderboardService.finalizeMonthlyLeaderboard();
        break;
      case "yearly":
        result = await leaderboardService.finalizeYearlyLeaderboard();
        break;
    }

    res.status(200).json({
      success: true,
      message: `${period.charAt(0).toUpperCase() + period.slice(1)} leaderboard finalized successfully`,
      result,
    });
  } catch (error) {
    console.error("Error finalizing leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to finalize leaderboard",
      message: error.message,
    });
  }
};

exports.adminResetLeaderboard = async (req, res) => {
  try {
    const { period } = req.body;

    await leaderboardService.resetLeaderboard(period || null);

    res.status(200).json({
      success: true,
      message: `Leaderboard reset successfully${period ? ` for ${period}` : " for all periods"}`,
    });
  } catch (error) {
    console.error("Error resetting leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset leaderboard",
      message: error.message,
    });
  }
};
