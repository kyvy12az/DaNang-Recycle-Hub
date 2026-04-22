import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-success/15 text-success border-success/20",
  locked: "bg-destructive/15 text-destructive border-destructive/20",
  pending: "bg-warning/15 text-warning border-warning/20",
  approved: "bg-success/15 text-success border-success/20",
  collected: "bg-info/15 text-info border-info/20",
  rejected: "bg-destructive/15 text-destructive border-destructive/20",
  completed: "bg-success/15 text-success border-success/20",
  failed: "bg-destructive/15 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground",
  available: "bg-success/15 text-success border-success/20",
  out_of_stock: "bg-destructive/15 text-destructive border-destructive/20",
  published: "bg-success/15 text-success border-success/20",
  draft: "bg-muted text-muted-foreground",
  new: "bg-info/15 text-info border-info/20",
  in_progress: "bg-warning/15 text-warning border-warning/20",
  closed: "bg-muted text-muted-foreground",
  sent: "bg-success/15 text-success border-success/20",
  scheduled: "bg-info/15 text-info border-info/20",
  delivered: "bg-success/15 text-success border-success/20",
  returned: "bg-warning/15 text-warning border-warning/20",
  inactive: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  active: "Hoạt động", locked: "Đã khóa", pending: "Chờ duyệt", approved: "Đã duyệt",
  collected: "Đã thu gom", rejected: "Từ chối", completed: "Hoàn thành", failed: "Thất bại",
  cancelled: "Đã hủy", available: "Còn hàng", out_of_stock: "Hết hàng",
  published: "Đã đăng", draft: "Nháp", new: "Mới", in_progress: "Đang xử lý",
  closed: "Đã đóng", sent: "Đã gửi", scheduled: "Đã lên lịch",
  delivered: "Đã giao", returned: "Hoàn trả", inactive: "Ngừng HĐ",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", statusColors[status] || "")}>
      {statusLabels[status] || status}
    </Badge>
  );
}
