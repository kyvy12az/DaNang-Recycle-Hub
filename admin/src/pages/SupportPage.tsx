import { mockSupportTickets } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";

const typeLabels: Record<string, string> = { support: "Hỗ trợ", transaction_error: "Lỗi GD", fraud_report: "Gian lận", dispute: "Tranh chấp" };
const priorityColors: Record<string, string> = { low: "bg-muted text-muted-foreground", medium: "bg-warning/15 text-warning", high: "bg-destructive/15 text-destructive" };

export default function SupportPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Khiếu nại & Hỗ trợ</h1>
        <p className="text-muted-foreground text-sm mt-1">{mockSupportTickets.length} ticket</p>
      </div>
      <DataTable
        data={mockSupportTickets}
        searchKey="userName"
        searchPlaceholder="Tìm theo tên..."
        filterOptions={[
          { key: "status", label: "Trạng thái", options: [{ value: "new", label: "Mới" }, { value: "in_progress", label: "Đang xử lý" }, { value: "closed", label: "Đã đóng" }] },
          { key: "type", label: "Loại", options: [{ value: "support", label: "Hỗ trợ" }, { value: "transaction_error", label: "Lỗi GD" }, { value: "fraud_report", label: "Gian lận" }, { value: "dispute", label: "Tranh chấp" }] },
        ]}
        columns={[
          { key: "id", label: "ID" },
          { key: "userName", label: "Người gửi", render: (t) => <span className="font-medium">{t.userName}</span> },
          { key: "subject", label: "Tiêu đề" },
          { key: "type", label: "Loại", render: (t) => <Badge variant="secondary">{typeLabels[t.type]}</Badge> },
          { key: "priority", label: "Ưu tiên", render: (t) => <Badge variant="outline" className={priorityColors[t.priority]}>{t.priority.toUpperCase()}</Badge> },
          { key: "status", label: "Trạng thái", render: (t) => <StatusBadge status={t.status} /> },
          { key: "createdAt", label: "Ngày", render: (t) => new Date(t.createdAt).toLocaleDateString("vi-VN") },
        ]}
      />
    </div>
  );
}
