import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar, Weight, Tag, User, FileText, Award, DollarSign, Loader2, Check, X } from "lucide-react";
import { WastePost, getStatusLabel } from "./WastePostsPage";

export default function WastePostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [post, setPost] = useState<WastePost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [screenStatus, setScreenStatus] = useState<WastePost['status'] | 'none'>('none');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_auth_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/management/listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const targetPost = data.listings.find((p: WastePost) => p.id === id);
        setPost(targetPost || null);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết đơn rác:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: WastePost['status']) => {
    if (!post) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem("admin_auth_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/management/listings/${post.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPost(prev => prev ? { ...prev, status: newStatus } : null);

        // Kích hoạt hiệu ứng chuyển động ở giữa màn hình
        setScreenStatus(newStatus);

        // Tự động ẩn hiệu ứng sau 2 giây
        setTimeout(() => {
          setScreenStatus('none');
        }, 2000);

      } else {
        alert(data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi kết nối kiểm duyệt bài đăng:", error);
      alert("Đã xảy ra lỗi kết nối với máy chủ.");
    } finally {
      setActionLoading(false);
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

  if (!post) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/waste-posts")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Trở lại
        </Button>
        <p className="text-destructive font-medium">Bài đăng rác này không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 animate-fade-in">
      <div>
        <Button variant="outline" size="sm" onClick={() => navigate("/waste-posts")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay về danh sách bài đăng
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột Trái: Ảnh thực tế */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base font-bold text-slate-700">Hình ảnh thực tế rác thải</CardTitle></CardHeader>
            <CardContent>
              {post.images && post.images.length > 0 && post.images[0] ? (
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border">
                  <img src={post.images[0]} alt="Waste product" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-square rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed">
                  <FileText size={32} />
                  <span className="text-xs text-center px-4">Người dân chưa đăng tải ảnh thực tế lên hệ thống</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cột Phải: Thông tin bài đăng */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Thông tin chi tiết đơn đăng ký</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">Mã đơn (ID): {post.id}</p>
                </div>
                <div>
                  {getStatusLabel(post.status)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600" /> Danh mục phân loại rác chi tiết:
                </h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b">
                      <tr>
                        <th className="px-4 py-3">Loại rác</th>
                        <th className="px-4 py-3 text-right">Đơn giá / Kg</th>
                        <th className="px-4 py-3 text-right">Khối lượng</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {post.itemsDetail.map((item, index) => (
                        <tr key={index} className="bg-white hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{item.wasteTypeName}</td>
                          <td className="px-4 py-3 text-right">{new Intl.NumberFormat("vi-VN").format(item.pricePerKg)}đ</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">{item.quantity} kg</td>
                          <td className="px-4 py-3 text-right font-bold">{new Intl.NumberFormat("vi-VN").format(item.estimatedPrice)}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <InfoRow icon={<User className="h-4 w-4" />} label="Người đăng ký bán" value={post.userName} />
                <InfoRow icon={<Weight className="h-4 w-4" />} label="Tổng trọng lượng bài đăng" value={`${post.weight} kg`} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Tổng số tiền thu về tạm tính" value={`${new Intl.NumberFormat("vi-VN").format(post.estimatedPrice)}đ`} />
                <InfoRow icon={<Award className="h-4 w-4" />} label="Điểm xanh tích lũy nhận được" value={`${post.greenPoints} Điểm`} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Thời gian hẹn lấy rác" value={post.pickupTime} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Khu vực quận/huyện" value={post.district} />
                <div className="md:col-span-2">
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Địa chỉ tập kết cụ thể" value={post.address} />
                </div>
                {post.notes && (
                  <div className="md:col-span-2">
                    <InfoRow icon={<FileText className="h-4 w-4" />} label="Ghi chú đính kèm của người dân" value={post.notes} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Khu vực hành động Phê Duyệt / Thu Gom đơn hàng */}
          <Card className="border-emerald-200 bg-emerald-50/10">
            <CardHeader><CardTitle className="text-base font-bold text-slate-800">Điều hướng kiểm duyệt và xử lý đơn</CardTitle></CardHeader>
            <CardContent className="flex gap-3 flex-wrap">
              {/* Bước 1: Đơn mới tạo (available) -> Cho phép Duyệt công khai hoặc Từ chối */}
              {post.status === 'available' && (
                <>
                  <Button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('approved')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 rounded-xl"
                  >
                    Phê duyệt bài đăng rác
                  </Button>
                  <Button
                    disabled={actionLoading}
                    variant="destructive"
                    onClick={() => handleUpdateStatus('rejected')}
                    className="font-medium px-6 rounded-xl"
                  >
                    Từ chối bài đăng
                  </Button>
                </>
              )}

              {/* Bước 2: Đơn đã duyệt (approved) nhưng chưa có ai đến lấy */}
              {post.status === 'approved' && (
                <p className="text-sm text-blue-600 bg-blue-50/50 border border-blue-100 p-3 rounded-xl w-full font-medium">
                  ⏰ Đơn hàng đã được duyệt thành công và đang hiển thị công khai trên ứng dụng để chờ người thu gom tới nhận đơn.
                </p>
              )}

              {/* Bước 3: Đơn đang đi gom / chưa trả tiền (pending) -> Cho phép Admin đóng đơn khi thu gom xong */}
              {post.status === 'pending' && (
                <Button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('completed')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl px-6"
                >
                  Xác nhận giao dịch thanh toán & Thu gom thành công (Hoàn tất đơn)
                </Button>
              )}

              {/* Bước 4: Trạng thái kết thúc cuối cùng (completed hoặc rejected) */}
              {post.status === 'completed' && (
                <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-xl w-full font-medium">
                  ✓ Quy trình hoàn tất: Đơn hàng này đã được thu gom thành công và thanh toán sòng phẳng tiền cho người dân.
                </p>
              )}
              {post.status === 'rejected' && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl w-full font-medium">
                  ✕ Bài đăng này đã bị quản trị viên từ chối duyệt công khai do không hợp lệ.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {screenStatus !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-xs w-full mx-4 border border-slate-100 transform scale-100 transition-transform duration-300">

            {/* Vòng tròn & SVG vẽ nét hiệu ứng Phê duyệt hoặc Hoàn tất */}
            {(screenStatus === 'approved' || screenStatus === 'completed') && (
              <>
                <div className={`h-20 w-20 rounded-full flex items-center justify-center border-4 ${screenStatus === 'approved'
                    ? 'bg-emerald-50 border-emerald-500/20 text-emerald-600'
                    : 'bg-sky-50 border-sky-500/20 text-sky-600'
                  }`}>
                  {/* Custom SVG vẽ từng nét dấu tích */}
                  <svg
                    className="w-12 h-12"
                    viewBox="0 0 52 52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      className="animate-draw-checkmark"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                      d="M14 27l7 7 16-16"
                    />
                  </svg>
                </div>
                <h3 className="mt-5 font-bold text-slate-800 text-lg">
                  {screenStatus === 'approved' ? 'Đã phê duyệt đơn' : 'Hoàn tất thu gom'}
                </h3>
                <p className="text-sm text-slate-500 text-center mt-1">
                  {screenStatus === 'approved'
                    ? 'Bài đăng đã sẵn sàng công khai trên hệ thống'
                    : 'Đơn hàng đã kết thúc thành công'}
                </p>
              </>
            )}

            {/* Vòng tròn & SVG vẽ nét hiệu ứng Từ chối */}
            {screenStatus === 'rejected' && (
              <>
                <div className="h-20 w-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border-4 border-rose-500/20">
                  {/* Custom SVG vẽ từng nét dấu nhân X */}
                  <svg
                    className="w-10 h-10"
                    viewBox="0 0 52 52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  >
                    <path
                      className="animate-draw-x-line1"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                      d="M16 16l20 20"
                    />
                    <path
                      className="animate-draw-x-line2"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                      d="M36 16L16 36"
                    />
                  </svg>
                </div>
                <h3 className="mt-5 font-bold text-slate-800 text-lg">Đã từ chối duyệt</h3>
                <p className="text-sm text-slate-500 text-center mt-1">Hệ thống đã hủy bài viết này thành công</p>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="mt-0.5 text-emerald-700 bg-emerald-100/60 p-2 rounded-lg">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-slate-400 font-medium">{label}</div>
        <div className="text-sm font-semibold text-slate-700 mt-0.5">{value}</div>
      </div>
    </div>
  );
}