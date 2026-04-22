import { mockCollectionPoints } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";

const typeLabels: Record<string, string> = { collection: "Thu gom", dealer: "Đại lý", center: "Trung tâm" };

export default function CollectionPointsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Điểm thu gom & đại lý tái chế</h1>
        <p className="text-muted-foreground text-sm mt-1">{mockCollectionPoints.length} điểm</p>
      </div>
      <DataTable
        data={mockCollectionPoints}
        searchKey="name"
        searchPlaceholder="Tìm điểm thu gom..."
        filterOptions={[
          { key: "type", label: "Loại", options: [{ value: "collection", label: "Thu gom" }, { value: "dealer", label: "Đại lý" }, { value: "center", label: "Trung tâm" }] },
          { key: "status", label: "Trạng thái", options: [{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng HĐ" }] },
        ]}
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Tên điểm", render: (c) => <span className="font-medium">{c.name}</span> },
          { key: "address", label: "Địa chỉ" },
          { key: "type", label: "Loại", render: (c) => <Badge variant="secondary">{typeLabels[c.type]}</Badge> },
          { key: "workingHours", label: "Giờ làm việc" },
          { key: "contact", label: "Liên hệ" },
          { key: "status", label: "Trạng thái", render: (c) => <StatusBadge status={c.status} /> },
        ]}
      />
    </div>
  );
}
