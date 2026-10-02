import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { Reward } from "@/data/mockData";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

export interface RewardHistory {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  rewardId: string;
  rewardName: string;
  pointsSpent: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface RewardsContextValue {
  rewards: Reward[];
  historyData: RewardHistory[];
  loading: boolean;
  historyLoading: boolean;       
  getReward: (id: string) => Reward | undefined;
  addReward: (data: Omit<Reward, "id" | "totalRedeemed">, file?: File) => Promise<boolean>;
  updateReward: (id: string, data: Partial<Reward>, file?: File) => Promise<boolean>;
  deleteReward: (id: string) => Promise<boolean>;
  fetchHistory: () => Promise<void>;
}

const RewardsContext = createContext<RewardsContextValue | undefined>(undefined);

export function RewardsProvider({ children }: { children: ReactNode }) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [historyData, setHistoryData] = useState<RewardHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true); 

  // Tải danh sách quà thưởng
  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/rewards`);
      const json = await response.json();
      if (json.success) {
        setRewards(json.data);
      } else {
        toast.error(json.message || "Không thể lấy danh sách quà thưởng");
      }
    } catch (error) {
      console.error("Lỗi fetchRewards:", error);
      toast.error("Mất kết nối tới máy chủ quản lý quà thưởng");
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách lịch sử đổi quà 
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch(`${API_URL}/api/rewards/admin/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const json = await response.json();
      if (json.success) {
        setHistoryData(json.data);
      } else {
        console.error("Lỗi fetchHistory response:", json.message);
      }
    } catch (error) {
      console.error("Lỗi fetchHistory:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchHistory();
  }, []);

  const getReward = (id: string) => rewards.find((r) => r.id === id || (r as any)._id === id);

  const addReward: RewardsContextValue["addReward"] = async (data, file) => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key === "image" && file) return;
        formData.append(key, String(data[key as keyof typeof data]));
      });

      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(`${API_URL}/api/rewards`, {
        method: "POST",
        body: formData, 
      });

      const json = await response.json();
      if (json.success) {
        toast.success("Thêm mới quà thưởng thành công!");
        await fetchRewards();
        return true;
      } else {
        toast.error(json.message || "Tạo dữ liệu quà thưởng thất bại");
        return false;
      }
    } catch (error) {
      console.error("Lỗi addReward:", error);
      toast.error("Không thể kết nối đến server để thêm quà");
      return false;
    }
  };

  // Cập nhật thông tin quà thưởng
  const updateReward: RewardsContextValue["updateReward"] = async (id, data, file) => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key === "image" && file) return;
        if (data[key as keyof typeof data] !== undefined) {
          formData.append(key, String(data[key as keyof typeof data]));
        }
      });

      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(`${API_URL}/api/rewards/${id}`, {
        method: "PUT",
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        toast.success("Cập nhật thông tin quà thưởng thành công!");
        await fetchRewards();
        return true;
      } else {
        toast.error(json.message || "Chỉnh sửa quà thưởng thất bại");
        return false;
      }
    } catch (error) {
      console.error("Lỗi updateReward:", error);
      toast.error("Không thể kết nối đến server để cập nhật");
      return false;
    }
  };

  // Xóa quà thưởng
  const deleteReward = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/rewards/${id}`, {
        method: "DELETE",
      });

      const json = await response.json();
      if (json.success) {
        toast.success("Xóa quà thưởng thành công!");
        setRewards((prev) => prev.filter((r) => r.id !== id && (r as any)._id !== id));
        return true;
      } else {
        toast.error(json.message || "Xóa quà thưởng thất bại");
        return false;
      }
    } catch (error) {
      console.error("Lỗi deleteReward:", error);
      toast.error("Có lỗi xảy ra khi yêu cầu xóa phần thưởng");
      return false;
    }
  };

  return (
    <RewardsContext.Provider
      value={{ 
        rewards, 
        historyData,
        loading, 
        historyLoading, 
        getReward, 
        addReward, 
        updateReward, 
        deleteReward,
        fetchHistory 
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
}

export function useRewards() {
  const ctx = useContext(RewardsContext);
  if (!ctx) throw new Error("useRewards bắt buộc phải được bọc bên trong RewardsProvider");
  return ctx;
}