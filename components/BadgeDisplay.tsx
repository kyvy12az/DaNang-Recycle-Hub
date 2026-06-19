import React from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";

const BadgeDisplay = ({ badges = [] }) => {
  const getBadgeIcon = (badgeType) => {
    const parts = badgeType.split("_");
    const period = parts[0];
    const rank = parts[1];

    const icons = {
      weekly_top1: "🥇",
      weekly_top2: "🥈",
      weekly_top3: "🥉",
      monthly_top1: "🏅",
      monthly_top2: "🎖️",
      monthly_top3: "⭐",
      yearly_top1: "👑",
      yearly_top2: "💎",
      yearly_top3: "🌟",
    };

    return icons[badgeType] || "🏆";
  };

  const getBadgeLabel = (badgeType) => {
    const labels = {
      weekly_top1: "Weekly Top 1",
      weekly_top2: "Weekly Top 2",
      weekly_top3: "Weekly Top 3",
      monthly_top1: "Monthly Top 1",
      monthly_top2: "Monthly Top 2",
      monthly_top3: "Monthly Top 3",
      yearly_top1: "Yearly Top 1",
      yearly_top2: "Yearly Top 2",
      yearly_top3: "Yearly Top 3",
    };

    return labels[badgeType] || badgeType;
  };

  const renderBadge = ({ item }) => (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeIcon}>{getBadgeIcon(item.badgeType)}</Text>
      <Text style={styles.badgeLabel} numberOfLines={2}>
        {getBadgeLabel(item.badgeType)}
      </Text>
      <Text style={styles.badgeDate}>
        {new Date(item.earnedDate).toLocaleDateString()}
      </Text>
    </View>
  );

  if (!badges || badges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No badges yet</Text>
        <Text style={styles.emptySubText}>
          Rank top 3 to earn badges!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={badges}
        renderItem={renderBadge}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badgeContainer: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 4,
  },
  badgeDate: {
    fontSize: 9,
    color: "#999",
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: "#999",
  },
});

export default BadgeDisplay;
