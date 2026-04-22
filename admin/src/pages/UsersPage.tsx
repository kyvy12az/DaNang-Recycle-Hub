import { useState } from "react";
import { mockUsers, User } from "@/data/mockData";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [selected, setSelected] = useState<User | null>(null);

  const toggleLock = (id: string) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'locked' as const : 'active' as const } : u));
    if (selected?.id === id) setSelected(s => s ? { ...s, status: s.status === 'active' ? 'locked' : 'active' } : null);
  };

  const changeRole = (id: string, role: User['role']) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, role } : u));
    if (selected?.id === id) setSelected(s => s ? { ...s, role } : null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <p className="text-muted-foreground text-sm mt-1">{users.length} người dùng trong hệ thống</p>
      </div>

      <DataTable<User>
        data={users}
        searchPlaceholder="Tìm theo tên, email, SĐT..."
        searchKey="name"
        filterOptions={[
          { key: "role", label: "Vai trò", options: [{ value: "user", label: "User" }, { value: "seller", label: "Seller" }, { value: "buyer", label: "Buyer" }, { value: "admin", label: "Admin" }] },
          { key: "status", label: "Trạng thái", options: [{ value: "active", label: "Hoạt động" }, { value: "locked", label: "Đã khóa" }] },
        ]}
        onRowClick={setSelected}
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Tên", render: (u) => <div className="flex items-center gap-2"><img src={u.avatar} className="h-7 w-7 rounded-full" alt="" /><span className="font-medium">{u.name}</span></div> },
          { key: "email", label: "Email" },
          { key: "role", label: "Vai trò", render: (u) => <Badge variant="secondary" className="capitalize">{u.role}</Badge> },
          { key: "greenPoints", label: "Điểm xanh", render: (u) => <span className="text-primary font-medium">{u.greenPoints}</span> },
          { key: "totalKg", label: "Tổng kg", render: (u) => `${u.totalKg} kg` },
          { key: "status", label: "Trạng thái", render: (u) => <StatusBadge status={u.status} /> },
        ]}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết người dùng</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={selected.avatar} className="h-14 w-14 rounded-full" alt="" />
                <div>
                  <h3 className="font-bold text-lg">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                  <p className="text-sm text-muted-foreground">{selected.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground">Điểm xanh</span><p className="font-bold text-primary text-lg">{selected.greenPoints}</p></div>
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground">Tổng kg</span><p className="font-bold text-lg">{selected.totalKg} kg</p></div>
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground">Giao dịch</span><p className="font-bold text-lg">{selected.totalTransactions}</p></div>
                <div className="bg-muted rounded-lg p-3"><span className="text-muted-foreground">Số dư ví</span><p className="font-bold text-lg">{new Intl.NumberFormat("vi-VN").format(selected.walletBalance)}đ</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">Vai trò:</span>
                <Select value={selected.role} onValueChange={(v) => changeRole(selected.id, v as User['role'])}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['user', 'seller', 'buyer', 'admin'].map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant={selected.status === 'active' ? 'destructive' : 'default'} onClick={() => toggleLock(selected.id)}>
                  {selected.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
