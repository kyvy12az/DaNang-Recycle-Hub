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
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
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
      <div className={`${size} rounded-md bg-muted flex items-center justify-center text-muted-foreground`}>
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`${size} rounded-md object-cover border`}
      onError={() => setError(true)}
    />
  );
}

export default function RewardsPage() {
  const navigate = useNavigate();
  const { rewards, deleteReward } = useRewards();
  const [selected, setSelected] = useState<Reward | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteReward(deleteId);
    toast.success("Đã xóa quà thưởng");
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Quản lý quà thưởng</h1>
          <p className="text-muted-foreground text-sm mt-1">{rewards.length} phần thưởng</p>
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

        <TabsContent value="rewards" className="mt-4">
          <DataTable<Reward>
            data={rewards}
            searchKey="name"
            searchPlaceholder="Tìm quà thưởng..."
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
              { key: "totalRedeemed", label: "Đã đổi" },
              { key: "status", label: "Trạng thái", render: (r) => <StatusBadge status={r.status} /> },
              { key: "actions", label: "", render: (r) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/rewards/${r.id}/edit`)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )},
            ]}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <DataTable
            data={mockRewardHistory}
            searchKey="userName"
            searchPlaceholder="Tìm theo tên..."
            columns={[
              { key: "id", label: "ID" },
              { key: "userName", label: "Người dùng", render: (r) => <span className="font-medium">{r.userName}</span> },
              { key: "rewardName", label: "Quà" },
              { key: "pointsUsed", label: "Điểm đã dùng", render: (r) => <span className="text-primary font-medium">{r.pointsUsed}</span> },
              { key: "status", label: "Trạng thái", render: (r) => <StatusBadge status={r.status} /> },
              { key: "createdAt", label: "Ngày", render: (r) => new Date(r.createdAt).toLocaleDateString("vi-VN") },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-4">
                <RewardImage src={selected.image} alt={selected.name} size="h-24 w-24" />
                <div className="flex-1 space-y-2">
                  <Badge variant="secondary" className={groupBadgeClass[selected.group]}>
                    {REWARD_GROUP_LABELS[selected.group]}
                  </Badge>
                  <p className="text-muted-foreground">{selected.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground">Điểm cần</span><p className="font-bold text-primary text-lg">{selected.pointsRequired}</p></div>
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground">Tồn kho</span><p className="font-bold text-lg">{selected.stock}</p></div>
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground">Đã đổi</span><p className="font-bold text-lg">{selected.totalRedeemed}</p></div>
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground">Danh mục</span><p className="font-bold text-lg">{selected.category}</p></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { navigate(`/rewards/${selected.id}/edit`); setSelected(null); }}>
                  <Pencil className="h-4 w-4 mr-2" /> Sửa
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => { setDeleteId(selected.id); setSelected(null); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Xóa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa quà thưởng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Quà thưởng sẽ bị xóa khỏi danh sách.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}