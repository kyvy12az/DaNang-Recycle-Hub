import { createContext, ReactNode, useContext, useState } from "react";
import { mockRewards, Reward } from "@/data/mockData";

interface RewardsContextValue {
  rewards: Reward[];
  getReward: (id: string) => Reward | undefined;
  addReward: (data: Omit<Reward, "id" | "totalRedeemed">) => Reward;
  updateReward: (id: string, data: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
}

const RewardsContext = createContext<RewardsContextValue | undefined>(undefined);

export function RewardsProvider({ children }: { children: ReactNode }) {
  const [rewards, setRewards] = useState<Reward[]>(mockRewards);

  const getReward = (id: string) => rewards.find((r) => r.id === id);

  const addReward: RewardsContextValue["addReward"] = (data) => {
    const nextNum = rewards.length + 1;
    const newReward: Reward = {
      ...data,
      id: `R${String(nextNum).padStart(3, "0")}`,
      totalRedeemed: 0,
    };
    setRewards((prev) => [newReward, ...prev]);
    return newReward;
  };

  const updateReward: RewardsContextValue["updateReward"] = (id, data) => {
    setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const deleteReward = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <RewardsContext.Provider value={{ rewards, getReward, addReward, updateReward, deleteReward }}>
      {children}
    </RewardsContext.Provider>
  );
}

export function useRewards() {
  const ctx = useContext(RewardsContext);
  if (!ctx) throw new Error("useRewards must be used within RewardsProvider");
  return ctx;
}