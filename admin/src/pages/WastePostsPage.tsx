import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/shared/DataTable";
import { Loader2 } from "lucide-react";

export interface WasteItemDetail {
  wasteTypeId: string;
  wasteTypeName: string;
  pricePerKg: number;
  quantity: number;
  estimatedPrice: number;
}

export interface WastePost {
  id: string;
  userName: string;
  wasteType: string;
  weight: number;
  estimatedPrice: number;
  greenPoints: number;
  status: 'available' | 'approved' | 'pending' | 'completed' | 'rejected';
  images: string[];
  address: string;
  district: string;
  pickupTime: string;
  notes: string;
  itemsDetail: WasteItemDetail[];
  createdAt: string;
}

export function getStatusLabel(status: WastePost['status']) {
  switch (status) {
    case 'available':
      return <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs font-semibold">Chờ duyệt đơn</span>;
    case 'approved':
      return <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 text-xs font-semibold">Chờ người gom</span>;
    case 'pending':
      return <span className="text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 text-xs font-semibold">Đang thu gom</span>;
    case 'completed':
      return <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-xs font-semibold">Đã thu gom thành công</span>;
    case 'rejected':
      return <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 text-xs font-semibold">Đã từ chối duyệt</span>;
    default:
      return status;
  }
}

export default function WastePostsPage() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [posts, setPosts] = useState<WastePost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_auth_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/management/listings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPosts(data.listings);
      }
    } catch (error) {
      console.error("Lỗi khi kết nối API lấy danh sách bài đăng rác:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px] space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Đang tải chi tiết bài đăng...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Quản lý danh sách bài đăng rác</h1>
        <p className="text-muted-foreground text-sm mt-1">Hiện có tổng cộng {posts.length} đơn đăng ký thu gom rác trên hệ thống</p>
      </div>

      <DataTable<WastePost>
        data={posts}
        searchPlaceholder="Tìm kiếm theo tên người đăng..."
        searchKey="userName"
        filterOptions={[
          {
            key: "status",
            label: "Trạng thái đơn",
            options: [
              { value: "available", label: "Chờ duyệt đơn" },
              { value: "approved", label: "Chờ người gom" },
              { value: "pending", label: "Đang thu gom" },
              { value: "completed", label: "Đã thu gom thành công" },
              { value: "rejected", label: "Đã từ chối duyệt" }
            ]
          }
        ]}
        onRowClick={(row) => navigate(`/waste-posts/${row.id}`)}
        columns={[
          { key: "id", label: "Mã bài đăng" },
          {
            key: "image",
            label: "Hình ảnh",
            render: (p) => (
              p.images && p.images.length > 0 && p.images[0] ? (
                <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Không ảnh</div>
              )
            )
          },
          { key: "userName", label: "Người đăng", render: (p) => <span className="font-medium text-slate-700">{p.userName}</span> },
          { key: "wasteType", label: "Chi tiết loại rác" },
          { key: "weight", label: "Khối lượng", render: (p) => `${p.weight} kg` },
          { key: "estimatedPrice", label: "Giá tạm tính", render: (p) => `${new Intl.NumberFormat("vi-VN").format(p.estimatedPrice)}đ` },
          { key: "status", label: "Trạng thái", render: (p) => getStatusLabel(p.status) }
        ]}
      />
    </div>
  );
}