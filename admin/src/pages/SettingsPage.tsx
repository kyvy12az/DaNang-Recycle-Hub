import { Leaf } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground text-sm mt-1">Cấu hình chung cho DaNang Recycle Hub</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Thông tin hệ thống</h3>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <img src="/logo.png" alt="Logo Admin" />
            </div>
            <div>
              <p className="font-bold">DaNang Recycle Hub</p>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
          <div className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Môi trường</span><span className="font-medium">Production</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Khu vực</span><span className="font-medium">Đà Nẵng, Việt Nam</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Ngôn ngữ</span><span className="font-medium">Tiếng Việt</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Múi giờ</span><span className="font-medium">UTC+7</span></div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Quy đổi điểm</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">1 kg rác nhựa</span><span className="font-medium text-primary">10 điểm xanh</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">1 kg giấy</span><span className="font-medium text-primary">5 điểm xanh</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">1 kg kim loại</span><span className="font-medium text-primary">15 điểm xanh</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">1 kg thủy tinh</span><span className="font-medium text-primary">8 điểm xanh</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">100 điểm xanh</span><span className="font-medium text-primary">= 10,000đ</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
