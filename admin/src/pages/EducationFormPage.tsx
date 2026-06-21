import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload, Link2, ImageOff, Leaf, Droplets, Coins, Clock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useEducation } from "@/contexts/EducationContext";
import { EducationPost } from "@/data/mockData";

type PostForm = Omit<EducationPost, "id" | "createdAt" | "likes" | "comments">;

const emptyForm: PostForm = {
  title: "", description: "", content: "",
  category: "recycling", status: "draft", featured: false,
  image: "📄", coverImage: "",
  co2SavedKg: 0, waterSavedL: 0,
  greenPoints: 5, readMinutesForPoints: 3, readMinutes: 5,
};

const catLabels: Record<string, string> = { recycling: "Tái chế", saving: "Tiết kiệm", environment: "Môi trường" };

export default function EducationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPost, addPost, updatePost } = useEducation();
  const isEdit = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PostForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageTab, setImageTab] = useState<"upload" | "url">("url");
  const [imgError, setImgError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      const p = getPost(id);
      if (!p) {
        toast.error("Không tìm thấy bài viết");
        navigate("/education");
        return;
      }
      setForm({
        title: p.title, description: p.description, content: p.content,
        category: p.category, status: p.status, featured: p.featured,
        image: p.image, coverImage: p.coverImage || "",
        co2SavedKg: p.co2SavedKg || 0, waterSavedL: p.waterSavedL || 0,
        greenPoints: p.greenPoints || 0, readMinutesForPoints: p.readMinutesForPoints || 0,
        readMinutes: p.readMinutes || 0,
      });
      setImageTab("url");
    }
  }, [id, isEdit, getPost, navigate]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Vui lòng chọn file định dạng ảnh hợp lệ");
    if (file.size > 3 * 1024 * 1024) return toast.error("Kích thước ảnh vượt quá định mức tối đa 3MB");

    setSelectedFile(file);
    setImgError(false);

    const previewUrl = URL.createObjectURL(file);
    setForm((f) => ({ ...f, coverImage: previewUrl }));
  };

  // Hủy/Xóa ảnh đã chọn
  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Tránh kích hoạt sự kiện click của thẻ div cha
    setSelectedFile(null);
    setForm((f) => ({ ...f, coverImage: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Vui lòng nhập tiêu đề bài viết");
    if (!form.content.trim()) return toast.error("Vui lòng điền nội dung chi tiết bài viết");

    setSaving(true);
    let success = false;

    if (isEdit && id) {
      success = await updatePost(id, form, selectedFile || undefined);
    } else {
      success = await addPost(form, selectedFile || undefined);
    }

    setSaving(false);
    if (success) {
      navigate("/education");
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in -m-4 md:-m-6">
      {/* Header Bar điều hướng và tác vụ */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" disabled={saving} onClick={() => navigate("/education")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight">{isEdit ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}</h1>
          <p className="text-muted-foreground text-xs">
            {isEdit ? "Cập nhật dữ liệu nội dung giáo dục" : "Tạo cấu trúc bài viết giáo dục sinh thái mới"}
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={saving} onClick={() => navigate("/education")}>Hủy</Button>
        <Button size="sm" disabled={saving} onClick={handleSave}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Đang lưu...
            </>
          ) : isEdit ? "Lưu thay đổi" : "Thêm bài viết"}
        </Button>
      </div>

      {/* Vùng Content chia làm 2 Column */}
      <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-4 p-4 md:p-6 overflow-auto">
        {/* Form nhập liệu chính */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề bài viết *</Label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
                placeholder="VD: 10 cách tái chế rác nhựa tại nhà và văn phòng" 
                disabled={saving}
              />
            </div>

            {/* Quản lý Tab tải ảnh lên hoặc dán URL */}
            <div className="space-y-2">
              <Label>Ảnh bìa minh họa</Label>
              <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as "upload" | "url")}>
                <TabsList className="grid grid-cols-2 w-full max-w-xs">
                  <TabsTrigger value="upload" disabled={saving}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />Tải lên từ máy
                  </TabsTrigger>
                  <TabsTrigger value="url" disabled={saving}>
                    <Link2 className="h-3.5 w-3.5 mr-1.5" />Dán link ảnh
                  </TabsTrigger>
                </TabsList>
                
                {/* Khu vực Upload Ảnh */}
                <TabsContent value="upload" className="mt-3">
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} 
                  />
                  <div 
                    onClick={() => !saving && fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      if(saving) return;
                      const f = e.dataTransfer.files?.[0]; 
                      if (f) handleFile(f); 
                    }}
                    className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer hover:bg-muted/50 transition-colors relative"
                  >
                    <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1.5" />
                    <p className="text-sm font-medium">Click hoặc kéo thả ảnh vào đây</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, JPEG tối đa 3MB</p>
                    
                    {selectedFile && (
                      <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-200">
                        <span className="truncate max-w-[180px]">Đã chọn: {selectedFile.name}</span>
                        <button type="button" onClick={handleRemoveFile} className="hover:bg-emerald-200 p-0.5 rounded transition-colors">
                          <X className="h-3 w-3 text-emerald-800" />
                        </button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Khu vực Dán URL Ảnh */}
                <TabsContent value="url" className="mt-3">
                  <Input 
                    placeholder="https://images.unsplash.com/photo-example.jpg"
                    value={form.coverImage?.startsWith("blob:") ? "" : (form.coverImage || "")}
                    disabled={saving}
                    onChange={(e) => { 
                      setForm({ ...form, coverImage: e.target.value }); 
                      setImgError(false); 
                      setSelectedFile(null); // Reset file vật lý nếu chuyển qua link trực tiếp
                    }} 
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Mô tả ngắn hiển thị ở danh sách</Label>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                rows={2} 
                placeholder="Mô tả tóm tắt nội dung chính để thu hút người xem..." 
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label>Nội dung chi tiết bài viết *</Label>
              <Textarea 
                value={form.content} 
                onChange={(e) => setForm({ ...form, content: e.target.value })} 
                rows={9} 
                placeholder="Nội dung chi tiết kiến thức giáo dục môi trường..." 
                disabled={saving}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại bài viết *</Label>
                <Select 
                  value={form.category} 
                  disabled={saving}
                  onValueChange={(v: EducationPost["category"]) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(catLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái phát hành *</Label>
                <Select 
                  value={form.status} 
                  disabled={saving}
                  onValueChange={(v: EducationPost["status"]) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bản nháp</SelectItem>
                    <SelectItem value="published">Xuất bản công khai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Khối cấu hình chỉ số sinh thái */}
            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-sm">Tác động sinh thái dự kiến (Mỗi lượt đọc)</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">CO₂ giảm phát thải (kg)</Label>
                  <Input 
                    type="number" min={0} step={0.1} value={form.co2SavedKg} disabled={saving}
                    onChange={(e) => setForm({ ...form, co2SavedKg: Number(e.target.value) })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Nước sạch tiết kiệm (lít)</Label>
                  <Input 
                    type="number" min={0} step={1} value={form.waterSavedL} disabled={saving}
                    onChange={(e) => setForm({ ...form, waterSavedL: Number(e.target.value) })} 
                  />
                </div>
              </div>
            </div>

            {/* Khối cấu hình cơ chế tính điểm thưởng */}
            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Điểm xanh Lá & Định mức thời gian</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Điểm xanh cộng thưởng</Label>
                  <Input 
                    type="number" min={0} value={form.greenPoints} disabled={saving}
                    onChange={(e) => setForm({ ...form, greenPoints: Number(e.target.value) })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Đọc tối thiểu (Phút)</Label>
                  <Input 
                    type="number" min={0} value={form.readMinutesForPoints} disabled={saving}
                    onChange={(e) => setForm({ ...form, readMinutesForPoints: Number(e.target.value) })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Dự kiến thời gian đọc</Label>
                  <Input 
                    type="number" min={0} value={form.readMinutes} disabled={saving}
                    onChange={(e) => setForm({ ...form, readMinutes: Number(e.target.value) })} 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Bài viết tiêu điểm/nổi bật</Label>
                <p className="text-xs text-muted-foreground">Đưa bài viết lên vị trí ưu tiên banner trang đầu</p>
              </div>
              <Switch checked={form.featured} disabled={saving} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
            </div>
          </CardContent>
        </Card>

        {/* Khung Column Mockup Điện Thoại Di Động Xem Trước (Sticky Preview) */}
        <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Xem trước ứng dụng di động</Label>
          <Card className="shadow-md border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center mb-3 relative border">
                {form.coverImage && !imgError ? (
                  <img 
                    src={form.coverImage} 
                    alt={form.title || "Preview"} 
                    className="w-full h-full object-cover" 
                    onError={() => setImgError(true)} 
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Chưa cài đặt cấu hình ảnh bìa</p>
                  </div>
                )}
              </div>
              <h3 className="font-semibold line-clamp-2 text-sm">{form.title || "Tiêu đề bài viết hiển thị..."}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                {form.description || "Mô tả ngắn của bài viết sẽ được bố cục render tại đây..."}
              </p>
              
              {/* Grid chỉ số xanh chân Card di động */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] border-t pt-2.5">
                <div className="flex items-center gap-1.5 text-muted-foreground"><Leaf className="h-3 w-3 text-emerald-600" />{form.co2SavedKg} kg CO₂</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Droplets className="h-3 w-3 text-blue-500" />{form.waterSavedL} L nước</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Coins className="h-3 w-3 text-amber-500" />+{form.greenPoints} điểm</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3" />{form.readMinutes} phút đọc</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}