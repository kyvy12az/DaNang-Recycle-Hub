import { mockWalletHistories } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";

export default function WalletPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Ví & Điểm xanh</h1>
        <p className="text-muted-foreground text-sm mt-1">Lịch sử thay đổi ví và điểm xanh</p>
      </div>
      <DataTable
        data={mockWalletHistories}
        searchPlaceholder="Tìm theo tên..."
        searchKey="userName"
        filterOptions={[
          { key: "type", label: "Loại", options: [{ value: "credit", label: "Cộng" }, { value: "debit", label: "Trừ" }] },
        ]}
        columns={[
          { key: "id", label: "ID" },
          { key: "userName", label: "Người dùng", render: (w) => <span className="font-medium">{w.userName}</span> },
          { key: "type", label: "Loại", render: (w) => <Badge variant="outline" className={w.type === 'credit' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}>{w.type === 'credit' ? 'Cộng' : 'Trừ'}</Badge> },
          { key: "amount", label: "Số tiền", render: (w) => <span className="font-semibold">{new Intl.NumberFormat("vi-VN").format(w.amount)}đ</span> },
          { key: "pointsChange", label: "Điểm xanh", render: (w) => <span className={w.pointsChange > 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>{w.pointsChange > 0 ? '+' : ''}{w.pointsChange}</span> },
          { key: "reason", label: "Lý do" },
          { key: "createdAt", label: "Ngày", render: (w) => new Date(w.createdAt).toLocaleDateString("vi-VN") },
        ]}
      />
    </div>
  );
}
