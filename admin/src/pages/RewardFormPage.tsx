import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload, Link2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useRewards } from "@/contexts/RewardsContext";
import { Reward, RewardGroup, REWARD_GROUP_LABELS } from "@/data/mockData";

type RewardForm = Omit<Reward, "id" | "totalRedeemed">;

const emptyForm: RewardForm = {
  name: "", description: "", pointsRequired: 100, stock: 10,
  status: "available", image: "", category: "Quà tặng", group: "green_gift",
};

export default function RewardFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getReward, addReward, updateReward } = useRewards();
  const isEdit = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<RewardForm>(emptyForm);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      const r = getReward(id);
      if (!r) {
        toast.error("Không tìm thấy quà thưởng");
        navigate("/rewards");
        return;
      }
      setForm({
        name: r.name, description: r.description, pointsRequired: r.pointsRequired,
        stock: r.stock, status: r.status, image: r.image, category: r.category, group: r.group,
      });
      setImageTab(r.image.startsWith("data:") ? "upload" : "url");
    }
  }, [id, isEdit, getReward, navigate]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh tối đa 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm((f) => ({ ...f, image: String(e.target?.result || "") }));
      setImgError(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên quà");
      return;
    }
    const status: Reward["status"] = form.stock <= 0 ? "out_of_stock" : "available";
    if (isEdit && id) {
      updateReward(id, { ...form, status });
      toast.success("Đã cập nhật quà thưởng");
    } else {
      addReward({ ...form, status });
      toast.success("Đã thêm quà thưởng mới");
    }
    navigate("/rewards");
  };

  return (
    <div className="flex flex-col h-full animate-fade-in -m-4 md:-m-6">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/rewards")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight">{isEdit ? "Chỉnh sửa quà thưởng" : "Thêm quà thưởng mới"}</h1>
          <p className="text-muted-foreground text-xs">
            {isEdit ? "Cập nhật thông tin phần thưởng" : "Tạo phần thưởng mới cho người dùng đổi điểm"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/rewards")}>Hủy</Button>
        <Button size="sm" onClick={handleSave}>
          {isEdit ? "Lưu thay đổi" : "Thêm quà"}
        </Button>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_300px] gap-4 p-4 md:p-6 overflow-auto">
        {/* Form */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-2">
              <Label>Tên quà *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Voucher Grab 50K" />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Mô tả chi tiết về phần thưởng..." />
            </div>

            <div className="space-y-2">
              <Label>Ảnh quà thưởng</Label>
              <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as "upload" | "url")}>
                <TabsList className="grid grid-cols-2 w-full max-w-xs">
                  <TabsTrigger value="upload"><Upload className="h-3.5 w-3.5 mr-1.5" />Upload</TabsTrigger>
                  <TabsTrigger value="url"><Link2 className="h-3.5 w-3.5 mr-1.5" />Dán link</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFile(f);
                    }}
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1.5" />
                    <p className="text-sm font-medium">Click hoặc kéo thả ảnh vào đây</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG tối đa 2MB</p>
                  </div>
                </TabsContent>
                <TabsContent value="url" className="mt-3">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={form.image.startsWith("data:") ? "" : form.image}
                    onChange={(e) => { setForm({ ...form, image: e.target.value }); setImgError(false); }}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nhóm quà *</Label>
                <Select value={form.group} onValueChange={(v: RewardGroup) => setForm({ ...form, group: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(REWARD_GROUP_LABELS) as RewardGroup[]).map((g) => (
                      <SelectItem key={g} value={g}>{REWARD_GROUP_LABELS[g]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Điểm cần *</Label>
                <Input type="number" min={0} value={form.pointsRequired} onChange={(e) => setForm({ ...form, pointsRequired: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Tồn kho *</Label>
                <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-2 lg:sticky lg:top-0 lg:self-start">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Xem trước</Label>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="aspect-square rounded-lg bg-muted overflow-hidden flex items-center justify-center mb-3">
                {form.image && !imgError ? (
                  <img
                    src={form.image}
                    alt={form.name || "Preview"}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Chưa có ảnh</p>
                  </div>
                )}
              </div>
              <h3 className="font-semibold truncate">{form.name || "Tên quà thưởng"}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                {form.description || "Mô tả phần thưởng..."}
              </p>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-primary font-bold">{form.pointsRequired} điểm</span>
                <span className="text-muted-foreground">Còn: {form.stock}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}