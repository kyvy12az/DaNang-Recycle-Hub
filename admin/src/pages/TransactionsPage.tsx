import { mockTransactions } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";

const typeLabels: Record<string, string> = { deposit: "Nạp tiền", withdraw: "Rút tiền", payment: "Thanh toán" };
const typeColors: Record<string, string> = { deposit: "bg-success/15 text-success", withdraw: "bg-warning/15 text-warning", payment: "bg-info/15 text-info" };

export default function TransactionsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Quản lý giao dịch</h1>
        <p className="text-muted-foreground text-sm mt-1">{mockTransactions.length} giao dịch</p>
      </div>
      <DataTable
        data={mockTransactions}
        searchPlaceholder="Tìm theo tên người dùng..."
        searchKey="userName"
        filterOptions={[
          { key: "type", label: "Loại", options: [{ value: "deposit", label: "Nạp tiền" }, { value: "withdraw", label: "Rút tiền" }, { value: "payment", label: "Thanh toán" }] },
          { key: "status", label: "Trạng thái", options: [{ value: "pending", label: "Chờ xử lý" }, { value: "completed", label: "Hoàn thành" }, { value: "failed", label: "Thất bại" }, { value: "cancelled", label: "Đã hủy" }] },
        ]}
        columns={[
          { key: "id", label: "Mã GD" },
          { key: "userName", label: "Người dùng", render: (t) => <span className="font-medium">{t.userName}</span> },
          { key: "type", label: "Loại", render: (t) => <Badge variant="outline" className={typeColors[t.type]}>{typeLabels[t.type]}</Badge> },
          { key: "amount", label: "Số tiền", render: (t) => <span className="font-semibold">{new Intl.NumberFormat("vi-VN").format(t.amount)}đ</span> },
          { key: "description", label: "Mô tả" },
          { key: "status", label: "Trạng thái", render: (t) => <StatusBadge status={t.status} /> },
          { key: "createdAt", label: "Ngày", render: (t) => new Date(t.createdAt).toLocaleDateString("vi-VN") },
        ]}
      />
    </div>
  );
}
