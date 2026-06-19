import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowLeft, ShieldAlert, Calendar, Phone, MapPin, Mail, CreditCard, Scale, History, Coins, Loader2 } from "lucide-react";
import { DBUser } from "./UsersPage";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [user, setUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/admin/management/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_auth_token")}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          const foundUser = data.users.find((u: DBUser) => u.id === id);
          setUser(foundUser || null);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin chi tiết thành viên:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUserDetail();
  }, [id, API_BASE_URL]);

  const handleToggleLock = async () => {
    if (!user) return;
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/management/users/${user.id}/toggle-lock`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_auth_token")}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setUser(prev => prev ? { ...prev, isLocked: data.isLocked } : null);
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái tài khoản:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px] space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Đang tải hồ sơ thành viên...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-destructive font-medium">Không tìm thấy thành viên này trên hệ thống hoặc đã bị xóa.</p>
        <Button onClick={() => navigate("/users")} variant="outline" className="rounded-xl">
          <ArrowLeft size={16} className="mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 animate-fade-in">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <Button onClick={() => navigate(-1)} variant="ghost" className="gap-2 rounded-xl text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-slate-50 border px-3 py-1.5 rounded-xl">
            Mã hệ thống đầy đủ: <code className="font-mono text-slate-800 font-semibold ml-1">{user.id}</code>
          </span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CỘT TRÁI: THÔNG TIN HỒ SƠ & CHỈ SỐ */}
        <div className="md:col-span-2 space-y-6">

          {/* Thẻ thông tin tài khoản cơ bản */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={user.avatar || "/default-avatar.png"}
              className="h-24 w-24 rounded-full object-cover border-4 border-emerald-500/10 shadow-sm"
              alt="User Avatar"
            />
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h2>

                  {/* CẮT CHUỖI HIỂN THỊ MÃ NGẮN GỌN TẠI ĐÂY */}
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 border h-fit shadow-2xs">
                    #{user.id.substring(user.id.length - 6).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 text-xs">
                  <div className={`h-2 w-2 rounded-full ${user.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                  <span className="text-muted-foreground font-medium">
                    {user.isOnline ? "Đang trực tuyến trên ứng dụng" : `Hoạt động lần cuối: ${user.lastSeen ? new Date(user.lastSeen).toLocaleString("vi-VN") : "Không rõ"}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm text-slate-600 border-t border-dashed">
                <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                  <Mail size={15} className="text-slate-400 shrink-0" />
                  <span className="font-medium truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                  <Phone size={15} className="text-slate-400 shrink-0" />
                  <span className="font-medium">{user.phone || "Chưa cung cấp SĐT"}</span>
                </div>
                <div className="flex items-center gap-2.5 justify-center sm:justify-start sm:col-span-2">
                  <MapPin size={15} className="text-slate-400 shrink-0" />
                  <span className="font-medium line-clamp-1">{user.address || "Chưa thiết lập địa chỉ thu gom"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thẻ thống kê tài chính và thu gom thực tế */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Số liệu tích lũy & Tài chính</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <Coins size={16} />
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Điểm xanh</span>
                </div>
                <div>
                  <p className="font-black text-emerald-600 text-2xl leading-none">{user.greenPoints}</p>
                  <span className="text-[11px] text-emerald-700/70 font-medium mt-1 inline-block">xu tích lũy</span>
                </div>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <CreditCard size={16} />
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Ví điện tử</span>
                </div>
                <div>
                  <p className="font-black text-blue-600 text-xl leading-none">
                    {new Intl.NumberFormat("vi-VN").format(user.walletBalance)}đ
                  </p>
                  <span className="text-[11px] text-blue-700/70 font-medium mt-1 inline-block">số dư tài khoản</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <Scale size={16} />
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Khối lượng</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-2xl leading-none">{user.totalWeight}</p>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">kg rác đã gom</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <History size={16} />
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Giao dịch</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-2xl leading-none">{user.totalTransactions}</p>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">lượt thành công</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* CỘT PHẢI: KIỂM SOÁT HÀNH ĐỘNG ADMIN */}
        <div className="space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Kiểm soát quyền truy cập</h3>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm border border-slate-100">
              <span className="text-muted-foreground font-medium">Trạng thái tài khoản:</span>
              <StatusBadge status={user.isLocked ? "locked" : "active"} />
            </div>

            <div className="space-y-3 pt-1">
              <Button
                variant={user.isLocked ? "default" : "destructive"}
                className="w-full h-11 font-semibold rounded-xl transition-all shadow-xs"
                onClick={handleToggleLock}
                disabled={submitting}
              >
                {user.isLocked ? "Mở khóa tài khoản thành viên" : "Khóa tài khoản người dùng"}
              </Button>

              {user.isLocked ? (
                <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded-xl p-3 leading-normal">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-pulse" />
                  <span>Tài khoản này đang bị đình chỉ. Người dùng hoàn toàn không thể đăng nhập hoặc tạo các yêu cầu thu gom rác trên ứng dụng di động Client.</span>
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground font-medium">
                  Thành viên đang hoạt động bình thường, có đầy đủ các quyền hạn trao đổi trên hệ thống.
                </p>
              )}
            </div>
          </div>

          {/* Thẻ phụ thông tin tham gia hệ thống */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1.5 border-b pb-2">
              <Calendar size={14} className="text-slate-400" />
              <span>Phân loại & Định danh</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Ngày đăng ký:</span>
              <span className="font-semibold text-slate-700">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "---"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Hạng vai trò:</span>
              <span className="font-bold text-emerald-600 uppercase tracking-wide">User (Thành viên)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}