const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController");
const { protect, restrictTo } = require("../middleware/auth");

// Public routes
// Get all current leaderboards (weekly, monthly, yearly)
router.get("/", leaderboardController.getAllCurrentLeaderboards);

// Get LIVE leaderboard by period (queries users directly, no snapshot required)
router.get("/live/:period", leaderboardController.getLiveLeaderboard);

// Get leaderboard summary and statistics
router.get("/info/summary", leaderboardController.getLeaderboardSummary);

// Get leaderboard by period (weekly/monthly/yearly) — reads from Leaderboard snapshots
router.get("/:period", leaderboardController.getLeaderboardByPeriod);

// Get historical leaderboard for a specific period and date
router.get("/:period/:snapshotDate", leaderboardController.getHistoricalLeaderboard);

// Get user's leaderboard stats
router.get("/user/:userId/stats", leaderboardController.getUserLeaderboardStats);

// Get user's badges
router.get("/user/:userId/badges", leaderboardController.getUserBadges);

// Protected routes (require authentication)
// [ADMIN] Manually finalize leaderboard (for testing)
router.post(
  "/admin/finalize/:period",
  protect,
  restrictTo("admin"),
  leaderboardController.adminFinalizeLeaderboard
);

// [ADMIN] Reset leaderboard
router.post(
  "/admin/reset",
  protect,
  restrictTo("admin"),
  leaderboardController.adminResetLeaderboard
);

module.exports = router;
