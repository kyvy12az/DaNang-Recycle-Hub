import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockRewardHistory, Reward, RewardGroup, REWARD_GROUP_LABELS } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ImageOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRewards } from "@/contexts/RewardsContext";

const groupBadgeClass: Record<RewardGroup, string> = {
  financial: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  green_gift: "bg-green-100 text-green-700 hover:bg-green-100",
  voucher: "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

function RewardImage({ src, alt, size = "h-12 w-12" }: { src: string; alt: string; size?: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`${size} rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0`}>
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`${size} rounded-md object-cover border shrink-0`}
      onError={() => setError(true)}
    />
  );
}

export default function RewardsPage() {
  const navigate = useNavigate();
  const { rewards, loading, deleteReward } = useRewards();
  const [selected, setSelected] = useState<Reward | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    const success = await deleteReward(deleteId);
    setIsDeleting(false);
    
    if (success) {
      setDeleteId(null);
    }
  };

  const getRecordId = (r: Reward): string => {
    return r.id || (r as any)._id || "";
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Đang tải dữ liệu quà thưởng từ máy chủ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Quản lý quà thưởng</h1>
          <p className="text-muted-foreground text-sm mt-1">Hiện có {rewards.length} phần thưởng trên hệ thống</p>
        </div>
        <Button onClick={() => navigate("/rewards/new")}>
          <Plus className="h-4 w-4 mr-2" /> Thêm quà
        </Button>
      </div>

      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards">Danh sách quà</TabsTrigger>
          <TabsTrigger value="history">Lịch sử đổi quà</TabsTrigger>
        </TabsList>

        {/* Tab 1: Quản lý danh sách quà */}
        <TabsContent value="rewards" className="mt-4">
          <DataTable<Reward>
            data={rewards}
            searchKey="name"
            searchPlaceholder="Tìm quà thưởng theo tên..."
            filterOptions={[
              {
                key: "group", label: "Nhóm quà",
                options: (Object.keys(REWARD_GROUP_LABELS) as RewardGroup[]).map((g) => ({
                  value: g, label: REWARD_GROUP_LABELS[g],
                })),
              },
            ]}
            onRowClick={setSelected}
            columns={[
              { key: "image", label: "Ảnh", render: (r) => <RewardImage src={r.image} alt={r.name} /> },
              { key: "name", label: "Tên quà", render: (r) => <span className="font-medium">{r.name}</span> },
              { key: "group", label: "Nhóm quà", render: (r) => (
                <Badge variant="secondary" className={groupBadgeClass[r.group]}>
                  {REWARD_GROUP_LABELS[r.group]}
                </Badge>
              )},
              { key: "pointsRequired", label: "Điểm cần", render: (r) => <span className="text-primary font-semibold">{r.pointsRequired}</span> },
              { key: "stock", label: "Tồn kho" },
              { key: "totalRedeemed", label: "Đã đổi", render: (r) => <span>{r.totalRedeemed ?? 0}</span> },
              { key: "status", label: "Trạng thái", render: (r) => <StatusBadge status={r.status} /> },
              { key: "actions", label: "", render: (r) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/rewards/${getRecordId(r)}/edit`)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(getRecordId(r))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )},
            ]}
          />
        </TabsContent>

        {/* Tab 2: Lịch sử đổi quà của người dùng */}
        <TabsContent value="history" className="mt-4">
          <DataTable
            data={mockRewardHistory}
            searchKey="userName"
            searchPlaceholder="Tìm kiếm theo tên người dùng..."
            columns={[
              { key: "id", label: "ID" },
              { key: "userName", label: "Người dùng", render: (r) => <span className="font-medium">{r.userName}</span> },
              { key: "rewardName", label: "Quà được đổi" },
              { key: "pointsUsed", label: "Điểm đã dùng", render: (r) => <span className="text-primary font-medium">{r.pointsUsed}</span> },
              { key: "status", label: "Trạng thái", render: (r) => <StatusBadge status={r.status} /> },
              { key: "createdAt", label: "Ngày đổi", render: (r) => new Date(r.createdAt).toLocaleDateString("vi-VN") },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Modal hiển thị thông tin chi tiết một phần quà */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-lg font-bold">{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-4 items-start">
                <RewardImage src={selected.image} alt={selected.name} size="h-24 w-24" />
                <div className="flex-1 space-y-2">
                  <Badge variant="secondary" className={groupBadgeClass[selected.group]}>
                    {REWARD_GROUP_LABELS[selected.group]}
                  </Badge>
                  <p className="text-muted-foreground text-xs leading-relaxed">{selected.description || "Không có mô tả chi tiết cho vật phẩm này."}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground text-xs">Điểm đổi</span><p className="font-bold text-primary text-lg mt-0.5">{selected.pointsRequired}</p></div>
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground text-xs">Tồn trong kho</span><p className="font-bold text-lg mt-0.5">{selected.stock}</p></div>
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground text-xs">Lượt đổi thực tế</span><p className="font-bold text-lg mt-0.5">{selected.totalRedeemed ?? 0}</p></div>
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground text-xs">Danh mục phân loại</span><p className="font-bold text-lg mt-0.5 truncate">{selected.category || "Chưa phân loại"}</p></div>
              </div>
              <div className="flex gap-2 pt-2 border-t mt-4">
                <Button variant="outline" className="flex-1" onClick={() => { navigate(`/rewards/${getRecordId(selected)}/edit`); setSelected(null); }}>
                  <Pencil className="h-4 w-4 mr-2" /> Chỉnh sửa
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => { setDeleteId(getRecordId(selected)); setSelected(null); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Xóa quà
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hộp thoại Popup xác nhận thao tác xóa dữ liệu vật phẩm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && !isDeleting && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa quà thưởng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bản ghi dữ liệu quà tặng sẽ bị gỡ bỏ vĩnh viễn khỏi danh sách hệ thống đổi điểm của người dùng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); 
              }} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}