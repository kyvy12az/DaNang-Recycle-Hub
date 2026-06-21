import { useNavigate } from "react-router-dom";
import { Plus, Heart, MessageCircle, Loader2 } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEducation } from "@/contexts/EducationContext";

const catLabels: Record<string, string> = { recycling: "Tái chế", saving: "Tiết kiệm", environment: "Môi trường" };

export default function EducationPage() {
  const navigate = useNavigate();
  const { posts, loading } = useEducation();

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Đang tải dữ liệu bài viết từ máy chủ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Nội dung giáo dục</h1>
          <p className="text-muted-foreground text-sm mt-1">{posts.length} bài viết</p>
        </div>
        <Button onClick={() => navigate("/education/new")}>
          <Plus className="h-4 w-4 mr-1.5" /> Thêm bài viết
        </Button>
      </div>
      <DataTable
        data={posts}
        searchKey="title"
        searchPlaceholder="Tìm bài viết..."
        onRowClick={(e) => navigate(`/education/${e.id}`)}
        filterOptions={[
          { key: "category", label: "Danh mục", options: [{ value: "recycling", label: "Tái chế" }, { value: "saving", label: "Tiết kiệm" }, { value: "environment", label: "Môi trường" }] },
          { key: "status", label: "Trạng thái", options: [{ value: "published", label: "Đã đăng" }, { value: "draft", label: "Nháp" }] },
        ]}
        columns={[
          { key: "image", label: "", render: (e) => e.coverImage ? (
            <img src={e.coverImage} alt={e.title} className="h-12 w-16 object-cover rounded" />
          ) : <span className="text-2xl">{e.image || "📄"}</span> },
          { key: "title", label: "Tiêu đề", render: (e) => <div><span className="font-medium">{e.title}</span>{e.featured && <Badge variant="secondary" className="ml-2 text-xs">⭐ Nổi bật</Badge>}</div> },
          { key: "category", label: "Danh mục", render: (e) => <Badge variant="outline">{catLabels[e.category] || "Khác"}</Badge> },
          { key: "status", label: "Trạng thái", render: (e) => <StatusBadge status={e.status} /> },
          { key: "engagement", label: "Tương tác", render: (e) => (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-red-500" />{e.likes || 0}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{(e.comments || []).length}</span>
            </div>
          )},
          { key: "createdAt", label: "Ngày tạo", render: (e) => {
            try {
              return e.createdAt ? new Date(e.createdAt).toLocaleDateString("vi-VN") : "N/A";
            } catch {
              return "N/A";
            }
          }},
        ]}
      />
    </div>
  );
}