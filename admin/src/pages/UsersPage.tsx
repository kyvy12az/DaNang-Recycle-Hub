import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";

export interface DBUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  address: string | null;
  greenPoints: number;
  walletBalance: number;
  totalWeight: number;
  totalTransactions: number;
  isOnline: boolean;
  lastSeen: string | null;
  isLocked: boolean; 
}

export default function UsersPage() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Gọi API lấy dữ liệu khi khởi chạy trang
  useEffect(() => {
    fetchUsersFromServer();
  }, []);

  const fetchUsersFromServer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/management/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_auth_token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng từ server:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? "Đang xử lý dữ liệu..." : `Hệ thống đang có tất cả ${users.length} tài khoản thành viên`}
        </p>
      </div>

      <DataTable<DBUser>
        data={users}
        searchPlaceholder="Tìm theo tên hoặc email thành viên..."
        searchKey="name"
        filterOptions={[
          { 
            key: "isLocked", 
            label: "Trạng thái", 
            options: [
              { value: "false", label: "Đang hoạt động" }, 
              { value: "true", label: "Đang bị khóa" }
            ] 
          },
        ]}
        // Khi bấm vào dòng, chuyển hướng sang trang chi tiết dựa trên ID gốc
        onRowClick={(user) => navigate(`/users/${user.id}`)}
        columns={[
          { 
            key: "id", 
            label: "Mã số", 
            // Giữ nguyên ID gốc để map dữ liệu nhưng xử lý cắt chuỗi hiển thị 6 ký tự cuối
            render: (u) => (
              <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-1 rounded text-slate-700 shadow-sm">
                #{u.id.substring(u.id.length - 6).toUpperCase()}
              </span>
            ) 
          },
          { 
            key: "name", 
            label: "Thành viên", 
            render: (u) => (
              <div className="flex items-center gap-3">
                <img 
                  src={u.avatar || "/default-avatar.png"} 
                  className="h-8 w-8 rounded-full border bg-slate-100 object-cover" 
                  alt="" 
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 leading-tight">{u.name}</span>
                  {u.isOnline && <span className="text-[10px] text-emerald-500 font-bold mt-0.5 animate-pulse">Online</span>}
                </div>
              </div>
            ) 
          },
          { key: "email", label: "Địa chỉ Email" },
          { key: "phone", label: "Số điện thoại", render: (u) => u.phone || "---" },
          { 
            key: "greenPoints", 
            label: "Điểm tích lũy", 
            render: (u) => <span className="text-emerald-600 font-bold">{u.greenPoints} xu</span> 
          },
          { 
            key: "totalWeight", 
            label: "Khối lượng thu gom", 
            render: (u) => <span className="font-medium text-slate-700">{u.totalWeight} kg</span> 
          },
          { 
            key: "isLocked", 
            label: "Trạng thái", 
            render: (u) => <StatusBadge status={u.isLocked ? "locked" : "active"} />
          },
        ]}
      />
    </div>
  );
}