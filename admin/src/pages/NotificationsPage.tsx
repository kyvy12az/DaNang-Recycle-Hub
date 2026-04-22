import { mockNotifications } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";

const typeLabels: Record<string, string> = { push: "Push", email: "Email", sms: "SMS" };

export default function NotificationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Thông báo hệ thống</h1>
        <p className="text-muted-foreground text-sm mt-1">{mockNotifications.length} thông báo</p>
      </div>
      <DataTable
        data={mockNotifications}
        searchKey="title"
        searchPlaceholder="Tìm thông báo..."
        filterOptions={[
          { key: "type", label: "Loại", options: [{ value: "push", label: "Push" }, { value: "email", label: "Email" }, { value: "sms", label: "SMS" }] },
          { key: "status", label: "Trạng thái", options: [{ value: "sent", label: "Đã gửi" }, { value: "scheduled", label: "Đã lên lịch" }, { value: "draft", label: "Nháp" }] },
        ]}
        columns={[
          { key: "id", label: "ID" },
          { key: "title", label: "Tiêu đề", render: (n) => <span className="font-medium">{n.title}</span> },
          { key: "type", label: "Kênh", render: (n) => <Badge variant="secondary">{typeLabels[n.type]}</Badge> },
          { key: "target", label: "Đối tượng", render: (n) => n.target === 'all' ? 'Tất cả' : 'Cụ thể' },
          { key: "status", label: "Trạng thái", render: (n) => <StatusBadge status={n.status} /> },
          { key: "createdAt", label: "Ngày tạo", render: (n) => new Date(n.createdAt).toLocaleDateString("vi-VN") },
        ]}
      />
    </div>
  );
}
