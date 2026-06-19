import { useState, useEffect } from "react";

// Base API URL - Update this to your actual backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

export const useLeaderboard = (period = "weekly", limit = 50) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/leaderboards/${period}?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to fetch leaderboard");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchLeaderboard };
};

export const useAllLeaderboards = (limit = 50) => {
  const [data, setData] = useState({
    weekly: [],
    monthly: [],
    yearly: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllLeaderboards();
  }, []);

  const fetchAllLeaderboards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/leaderboards?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to fetch leaderboards");
      }
    } catch (err) {
      console.error("Error fetching leaderboards:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchAllLeaderboards };
};

export const useUserLeaderboardStats = (userId) => {
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserStats();
    }
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/leaderboards/user/${userId}/stats`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setStats(result.leaderboardStats);
        setBadges(result.badges);
      } else {
        setError(result.error || "Failed to fetch user stats");
      }
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { stats, badges, loading, error, refetch: fetchUserStats };
};

export const useUserBadges = (userId) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserBadges();
    }
  }, [userId]);

  const fetchUserBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/leaderboards/user/${userId}/badges?status=active`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setBadges(result.badges);
      } else {
        setError(result.error || "Failed to fetch badges");
      }
    } catch (err) {
      console.error("Error fetching badges:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { badges, loading, error, refetch: fetchUserBadges };
};

export const useLeaderboardSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/leaderboards/info/summary`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSummary(result.summary);
      } else {
        setError(result.error || "Failed to fetch summary");
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { summary, loading, error, refetch: fetchSummary };
};

export const useHistoricalLeaderboard = (period, snapshotDate) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (period && snapshotDate) {
      fetchHistoricalLeaderboard();
    }
  }, [period, snapshotDate]);

  const fetchHistoricalLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const dateStr = new Date(snapshotDate).toISOString().split("T")[0];
      const response = await fetch(
        `${API_BASE_URL}/leaderboards/${period}/${dateStr}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to fetch historical data");
      }
    } catch (err) {
      console.error("Error fetching historical leaderboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchHistoricalLeaderboard };
};
