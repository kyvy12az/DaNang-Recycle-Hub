import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

const LeaderboardStats = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPeriod, setExpandedPeriod] = useState(null);

  useEffect(() => {
    fetchLeaderboardStats();
  }, [userId]);

  const fetchLeaderboardStats = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch(
        `http://your-api.com/api/leaderboards/user/${userId}/stats`
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.leaderboardStats);
      }
    } catch (error) {
      console.error("Error fetching leaderboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#22c55e" />
      </View>
    );
  }

  if (!stats) {
    return null;
  }

  const renderRankSection = (period, periodLabel) => {
    const rank = stats[period];
    const isExpanded = expandedPeriod === period;

    if (!rank) {
      return (
        <View key={period} style={styles.rankCard}>
          <TouchableOpacity
            style={styles.rankHeader}
            onPress={() => setExpandedPeriod(isExpanded ? null : period)}
          >
            <View style={styles.rankTitle}>
              <Text style={styles.periodLabel}>{periodLabel}</Text>
              <Text style={styles.rankText}>Not Ranked</Text>
            </View>
            <Text style={styles.expandIcon}>
              {isExpanded ? "▼" : "▶"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={period} style={styles.rankCard}>
        <TouchableOpacity
          style={styles.rankHeader}
          onPress={() => setExpandedPeriod(isExpanded ? null : period)}
        >
          <View style={styles.rankTitle}>
            <Text style={styles.periodLabel}>{periodLabel}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{rank.rankPosition}</Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>
            {isExpanded ? "▼" : "▶"}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.rankDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight Scrapped</Text>
              <Text style={styles.detailValue}>
                {rank.totalWeightScrapped.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Points Earned</Text>
              <Text style={styles.detailValue}>{rank.accumulatedPoints} pts</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Period End</Text>
              <Text style={styles.detailValue}>
                {new Date(rank.snapshotDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Rankings</Text>

      {renderRankSection("weekly", "Weekly")}
      {renderRankSection("monthly", "Monthly")}
      {renderRankSection("yearly", "Yearly")}

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Top 3 contributors are rewarded with green points and badges at the
          end of each period.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  rankCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rankTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  rankBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0369a1",
  },
  expandIcon: {
    fontSize: 12,
    color: "#999",
  },
  rankDetails: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22c55e",
  },
  infoBox: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#0369a1",
    lineHeight: 16,
  },
  loaderContainer: {
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LeaderboardStats;
