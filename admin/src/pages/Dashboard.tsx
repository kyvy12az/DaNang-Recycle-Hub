import { Users, FileText, ArrowLeftRight, Wallet, Recycle, Clock, TrendingUp, Weight } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { mockUsers, mockWastePosts, mockTransactions, dailyWasteData, wasteByTypeData, monthlyRevenueData } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const COLORS = ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#0d9488", "#0891b2", "#6366f1"];

const formatVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

export default function Dashboard() {
  const pendingPosts = mockWastePosts.filter(p => p.status === "pending").length;
  const todayTxn = mockTransactions.filter(t => new Date(t.createdAt).getDate() === new Date().getDate()).length;
  const totalWallet = mockUsers.reduce((s, u) => s + u.walletBalance, 0);
  const totalKg = mockUsers.reduce((s, u) => s + u.totalKg, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Tổng quan hệ thống DaNang Recycle Hub</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng người dùng" value={mockUsers.length} icon={<Users className="h-5 w-5" />} change="+12% so với tháng trước" changeType="positive" />
        <StatCard title="Bài đăng bán rác" value={mockWastePosts.length} icon={<FileText className="h-5 w-5" />} change={`${pendingPosts} chờ duyệt`} changeType="neutral" />
        <StatCard title="Giao dịch hôm nay" value={todayTxn || mockTransactions.length} icon={<ArrowLeftRight className="h-5 w-5" />} change="+8% so với hôm qua" changeType="positive" />
        <StatCard title="Tổng tiền hệ thống" value={formatVND(totalWallet)} icon={<Wallet className="h-5 w-5" />} change="+5.2% tháng này" changeType="positive" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng kg tái chế" value={`${totalKg.toLocaleString()} kg`} icon={<Weight className="h-5 w-5" />} change="+15% so với tháng trước" changeType="positive" />
        <StatCard title="Yêu cầu pending" value={pendingPosts} icon={<Clock className="h-5 w-5" />} change="Cần xử lý" changeType="negative" />
        <StatCard title="Tỷ lệ tái chế" value="78%" icon={<Recycle className="h-5 w-5" />} change="+3% so với tháng trước" changeType="positive" />
        <StatCard title="Tăng trưởng" value="+22%" icon={<TrendingUp className="h-5 w-5" />} change="So với cùng kỳ" changeType="positive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-semibold text-card-foreground mb-4">Rác thu gom theo ngày (kg)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyWasteData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 15% 90%)" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="kg" fill="hsl(142 64% 38%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-lg p-5">
          <h3 className="font-semibold text-card-foreground mb-4">Phân loại rác</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={wasteByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                {wasteByTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-lg p-5 lg:col-span-2">
          <h3 className="font-semibold text-card-foreground mb-4">Doanh thu & người dùng mới theo tháng</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 15% 90%)" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis yAxisId="left" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <YAxis yAxisId="right" orientation="right" fontSize={12} />
              <Tooltip formatter={(value: number, name: string) => [name === "revenue" ? formatVND(value) : value, name === "revenue" ? "Doanh thu" : "Users mới"]} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(142 64% 38%)" name="Doanh thu" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="users" stroke="hsl(199 89% 48%)" name="Users mới" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
