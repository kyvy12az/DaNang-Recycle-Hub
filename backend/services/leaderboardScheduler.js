const cron = require("node-cron");
const leaderboardService = require("./leaderboardService");

/**
 * Initialize all leaderboard scheduled jobs
 * Call this function in server.js when the database connection is established
 */
function initializeLeaderboardJobs() {
  console.log("[Leaderboard Jobs] Initializing scheduled jobs...");

  // Weekly leaderboard finalization
  // Runs every Sunday at 23:59:59 Vietnam time (UTC+7)
  // Cron format: 59 23 * * 0 (minute hour day month dayOfWeek)
  const weeklyJob = cron.schedule(
    "59 23 * * 0",
    async () => {
      console.log("[Leaderboard Jobs] Running weekly finalization...");
      try {
        const result = await leaderboardService.finalizeWeeklyLeaderboard();
        console.log("[Leaderboard Jobs] Weekly finalization result:", result);
      } catch (error) {
        console.error("[Leaderboard Jobs] Error in weekly finalization:", error);
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh", // Vietnam timezone
    }
  );

  // Monthly leaderboard finalization
  // Runs on the 28th-31st of each month at 23:59:59
  // This ensures it runs on the last day of any month
  const monthlyJob = cron.schedule(
    "59 23 28-31 * *",
    async () => {
      // Check if today is actually the last day of the month
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // If tomorrow is day 1 of next month, today is the last day
      if (tomorrow.getDate() === 1) {
        console.log("[Leaderboard Jobs] Running monthly finalization...");
        try {
          const result = await leaderboardService.finalizeMonthlyLeaderboard();
          console.log("[Leaderboard Jobs] Monthly finalization result:", result);
        } catch (error) {
          console.error("[Leaderboard Jobs] Error in monthly finalization:", error);
        }
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    }
  );

  // Yearly leaderboard finalization
  // Runs on December 31 at 23:59:59
  // Cron format: 59 23 31 12 * (minute hour day month dayOfWeek)
  const yearlyJob = cron.schedule(
    "59 23 31 12 *",
    async () => {
      console.log("[Leaderboard Jobs] Running yearly finalization...");
      try {
        const result = await leaderboardService.finalizeYearlyLeaderboard();
        console.log("[Leaderboard Jobs] Yearly finalization result:", result);
      } catch (error) {
        console.error("[Leaderboard Jobs] Error in yearly finalization:", error);
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    }
  );

  console.log("[Leaderboard Jobs] Jobs initialized successfully");
  console.log("  - Weekly finalization: Every Sunday 23:59:59");
  console.log("  - Monthly finalization: Last day of month 23:59:59");
  console.log("  - Yearly finalization: December 31 23:59:59");

  return {
    weeklyJob,
    monthlyJob,
    yearlyJob,
  };
}

/**
 * Stop all scheduled jobs
 * Call this function during server shutdown
 */
function stopLeaderboardJobs(jobs) {
  if (jobs) {
    console.log("[Leaderboard Jobs] Stopping all scheduled jobs...");
    jobs.weeklyJob?.stop();
    jobs.monthlyJob?.stop();
    jobs.yearlyJob?.stop();
    console.log("[Leaderboard Jobs] All jobs stopped");
  }
}

module.exports = {
  initializeLeaderboardJobs,
  stopLeaderboardJobs,
};
