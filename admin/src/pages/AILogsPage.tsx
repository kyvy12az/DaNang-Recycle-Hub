import { mockAILogs } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";

export default function AILogsPage() {
  const accuracy = mockAILogs.filter(l => l.isCorrect === true).length / mockAILogs.filter(l => l.isCorrect !== null).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Phân loại rác</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockAILogs.length} log phân loại</p>
        </div>
        <div className="bg-card border rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground">Tỷ lệ chính xác: </span>
          <span className="font-bold text-primary text-lg">{(accuracy * 100).toFixed(1)}%</span>
        </div>
      </div>
      <DataTable
        data={mockAILogs}
        searchKey="userName"
        searchPlaceholder="Tìm theo tên..."
        filterOptions={[
          { key: "predictedClass", label: "Loại rác", options: [{ value: "Nhựa PET", label: "Nhựa PET" }, { value: "Giấy", label: "Giấy" }, { value: "Kim loại", label: "Kim loại" }, { value: "Thủy tinh", label: "Thủy tinh" }] },
        ]}
        columns={[
          { key: "id", label: "ID" },
          { key: "userName", label: "Người dùng", render: (a) => <span className="font-medium">{a.userName}</span> },
          { key: "predictedClass", label: "Dự đoán", render: (a) => <Badge variant="secondary">{a.predictedClass}</Badge> },
          { key: "confidence", label: "Độ tin cậy", render: (a) => <span className={a.confidence > 0.85 ? 'text-success font-medium' : a.confidence > 0.7 ? 'text-warning font-medium' : 'text-destructive font-medium'}>{(a.confidence * 100).toFixed(1)}%</span> },
          { key: "isCorrect", label: "Kết quả", render: (a) => a.isCorrect === null ? <Badge variant="outline">Chưa xác minh</Badge> : a.isCorrect ? <Badge variant="outline" className="bg-success/15 text-success">Đúng</Badge> : <Badge variant="outline" className="bg-destructive/15 text-destructive">Sai</Badge> },
          { key: "createdAt", label: "Ngày", render: (a) => new Date(a.createdAt).toLocaleDateString("vi-VN") },
        ]}
      />
    </div>
  );
}
