import { useState } from "react";
import { mockWastePosts, WastePost } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function WastePostsPage() {
  const [posts, setPosts] = useState(mockWastePosts);
  const [selected, setSelected] = useState<WastePost | null>(null);

  const updateStatus = (id: string, status: WastePost['status']) => {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, status } : p));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Quản lý giám sát trạng thái và tiến độ đơn rác</h1>
        <p className="text-muted-foreground text-sm mt-1">{posts.length} bài đăng</p>
      </div>

      <DataTable<WastePost>
        data={posts}
        searchPlaceholder="Tìm theo tên người đăng..."
        searchKey="userName"
        filterOptions={[
          { key: "status", label: "Trạng thái", options: [{ value: "pending", label: "Chờ duyệt" }, { value: "approved", label: "Đã duyệt" }, { value: "collected", label: "Đã thu gom" }, { value: "rejected", label: "Từ chối" }] },
          { key: "wasteType", label: "Loại rác", options: [{ value: "Nhựa PET", label: "Nhựa PET" }, { value: "Giấy carton", label: "Giấy carton" }, { value: "Kim loại", label: "Kim loại" }, { value: "Thủy tinh", label: "Thủy tinh" }] },
        ]}
        onRowClick={setSelected}
        columns={[
          { key: "id", label: "ID" },
          { key: "userName", label: "Người đăng", render: (p) => <span className="font-medium">{p.userName}</span> },
          { key: "wasteType", label: "Loại rác" },
          { key: "weight", label: "Khối lượng", render: (p) => `${p.weight} kg` },
          { key: "estimatedPrice", label: "Giá dự tính", render: (p) => `${new Intl.NumberFormat("vi-VN").format(p.estimatedPrice)}đ` },
          { key: "status", label: "Trạng thái", render: (p) => <StatusBadge status={p.status} /> },
          { key: "createdAt", label: "Ngày tạo", render: (p) => new Date(p.createdAt).toLocaleDateString("vi-VN") },
        ]}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết bài đăng #{selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Người đăng:</span><p className="font-medium">{selected.userName}</p></div>
                <div><span className="text-muted-foreground">Loại rác:</span><p className="font-medium">{selected.wasteType}</p></div>
                <div><span className="text-muted-foreground">Khối lượng:</span><p className="font-medium">{selected.weight} kg</p></div>
                <div><span className="text-muted-foreground">Giá dự tính:</span><p className="font-medium">{new Intl.NumberFormat("vi-VN").format(selected.estimatedPrice)}đ</p></div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Địa chỉ:</span>
                <p className="font-medium">{selected.address}</p>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Giờ hẹn:</span>
                <p className="font-medium">{new Date(selected.scheduledTime).toLocaleString("vi-VN")}</p>
              </div>
              {selected.notes && <div className="text-sm"><span className="text-muted-foreground">Ghi chú:</span><p>{selected.notes}</p></div>}
              {selected.collectorName && <div className="text-sm"><span className="text-muted-foreground">Người thu gom:</span><p className="font-medium">{selected.collectorName}</p></div>}
              <div className="flex gap-2 flex-wrap">
                {selected.status === 'pending' && <>
                  <Button onClick={() => updateStatus(selected.id, 'approved')}>Duyệt</Button>
                  <Button variant="destructive" onClick={() => updateStatus(selected.id, 'rejected')}>Từ chối</Button>
                </>}
                {selected.status === 'approved' && <Button onClick={() => updateStatus(selected.id, 'collected')}>Đánh dấu đã thu gom</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
