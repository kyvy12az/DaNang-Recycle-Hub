import { useState } from "react";
// Giả định bạn đã thêm mockLeaderboard vào file mockData tương tự như mockWastePosts
import { mockLeaderboard, LeaderboardItem } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>(mockLeaderboard);
  const [selected, setSelected] = useState<LeaderboardItem | null>(null);

  // Hàm cập nhật trạng thái phê duyệt giải thưởng hoặc gắn cờ gian lận
  const updateStatus = (id: string, status: LeaderboardItem['status']) => {
    setLeaderboard(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    if (selected?.id === id) setSelected(curr => curr ? { ...curr, status } : null);
  };

  // Hàm render số huy chương hoặc hiển thị số thứ tự cho Top 3 dựa trên ảnh thiết kế
  const renderRankBadge = (rank: number) => {
    if (rank === 1) return <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-xs mx-auto">1</span>;
    if (rank === 2) return <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs mx-auto">2</span>;
    if (rank === 3) return <span className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 font-bold text-xs mx-auto">3</span>;
    return <span className="text-slate-700 font-semibold">{rank}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Khối Tiêu Đề */}
      <div>
        <h1 className="text-2xl font-bold">Quản lý bảng xếp hạng</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Giám sát và phê duyệt kết quả thi đua đóng góp xanh (Hệ thống Tuần/Tháng/Năm).
        </p>
      </div>

      {/* Bảng Dữ Liệu Grid Hệ Thống */}
      <DataTable<LeaderboardItem>
        data={leaderboard}
        searchPlaceholder="Tìm theo tên người dùng hoặc mã số..."
        searchKey="userName"
        filterOptions={[
          {
            key: "status",
            label: "Trạng thái giải",
            options: [
              { value: "approved", label: "Đã phê duyệt" },
              { value: "pending", label: "Chờ xử lý" },
              { value: "flagged", label: "Nghi vấn gian lận" },
            ],
          },
          {
            key: "period",
            label: "Chu kỳ thi đua",
            options: [
              { value: "weekly", label: "Tuần này" },
              { value: "monthly", label: "Tháng này" },
              { value: "yearly", label: "Năm nay" },
            ],
          },
        ]}
        onRowClick={setSelected}
        columns={[
          { 
            key: "rank", 
            label: "Thứ hạng", 
            render: (item) => <div className="text-center">{renderRankBadge(item.rank)}</div> 
          },
          { 
            key: "id", 
            label: "Mã User", 
            render: (item) => <span className="font-mono text-xs text-muted-foreground">{item.id}</span> 
          },
          { 
            key: "userName", 
            label: "Người dùng", 
            render: (item) => <span className="font-bold text-slate-800">{item.userName}</span> 
          },
          { 
            key: "totalWeight", 
            label: "Tổng khối lượng", 
            render: (item) => <span className="font-bold text-sky-600">{item.totalWeight.toLocaleString("vi-VN")} Kg</span> 
          },
          { 
            key: "points", 
            label: "Điểm xanh", 
            render: (item) => <span className="font-bold text-emerald-600">+{item.points.toLocaleString("vi-VN")}</span> 
          },
          { 
            key: "status", 
            label: "Trạng thái giải", 
            render: (item) => <StatusBadge status={item.status} /> 
          },
        ]}
      />

      {/* Hộp Thoại (Popup) Chi Tiết Xử Lý Thứ Hạng */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đóng góp tài khoản #{selected?.id}</DialogTitle>
          </DialogHeader>
          
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Người dùng:</span>
                  <p className="font-bold text-base text-slate-800">{selected.userName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Thứ hạng hiện tại:</span>
                  <p className="font-semibold text-amber-600">Top {selected.rank}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tổng khối lượng rác thu gom:</span>
                  <p className="font-bold text-sky-600 text-lg">{selected.totalWeight.toLocaleString("vi-VN")} kg</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Điểm xanh tích lũy kỳ này:</span>
                  <p className="font-bold text-emerald-600 text-lg">+{selected.points.toLocaleString("vi-VN")}</p>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Chu kỳ áp dụng giải thưởng:</span>
                <p className="font-medium">
                  {selected.period === "weekly" && "Bảng xếp hạng thi đua tuần"}
                  {selected.period === "monthly" && "Bảng xếp hạng thi đua tháng"}
                  {selected.period === "yearly" && "Bảng xếp hạng thi đua năm"}
                </p>
              </div>

              {/* Khu vực nút điều hướng hành động tương tác của Admin */}
              <div className="flex gap-2 flex-wrap pt-2">
                {selected.status === 'pending' && (
                  <>
                    <Button onClick={() => updateStatus(selected.id, 'approved')}>Phê duyệt phát thưởng</Button>
                    <Button variant="destructive" onClick={() => updateStatus(selected.id, 'flagged')}>Gắn cờ nghi vấn gian lận</Button>
                  </>
                )}
                {selected.status === 'flagged' && (
                  <Button variant="outline" onClick={() => updateStatus(selected.id, 'pending')}>Gỡ cờ & Chờ xét duyệt lại</Button>
                )}
                {selected.status === 'approved' && (
                  <Button variant="outline" disabled className="bg-slate-50">Đã hoàn tất trao giải</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}