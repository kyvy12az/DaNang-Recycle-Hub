import { mockEducationPosts } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";

const catLabels: Record<string, string> = { recycling: "Tái chế", saving: "Tiết kiệm", environment: "Môi trường" };

export default function EducationPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Nội dung giáo dục</h1>
        <p className="text-muted-foreground text-sm mt-1">{mockEducationPosts.length} bài viết</p>
      </div>
      <DataTable
        data={mockEducationPosts}
        searchKey="title"
        searchPlaceholder="Tìm bài viết..."
        filterOptions={[
          { key: "category", label: "Danh mục", options: [{ value: "recycling", label: "Tái chế" }, { value: "saving", label: "Tiết kiệm" }, { value: "environment", label: "Môi trường" }] },
          { key: "status", label: "Trạng thái", options: [{ value: "published", label: "Đã đăng" }, { value: "draft", label: "Nháp" }] },
        ]}
        columns={[
          { key: "image", label: "", render: (e) => <span className="text-2xl">{e.image}</span> },
          { key: "title", label: "Tiêu đề", render: (e) => <div><span className="font-medium">{e.title}</span>{e.featured && <Badge variant="secondary" className="ml-2 text-xs">⭐ Nổi bật</Badge>}</div> },
          { key: "category", label: "Danh mục", render: (e) => <Badge variant="outline">{catLabels[e.category]}</Badge> },
          { key: "status", label: "Trạng thái", render: (e) => <StatusBadge status={e.status} /> },
          { key: "createdAt", label: "Ngày tạo", render: (e) => new Date(e.createdAt).toLocaleDateString("vi-VN") },
        ]}
      />
    </div>
  );
}
