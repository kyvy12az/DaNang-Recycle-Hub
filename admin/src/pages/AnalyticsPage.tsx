import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Recycle, Users, Banknote, Leaf } from "lucide-react";

const monthlyRevenue = [
  { month: "T1", revenue: 42, expenses: 28, profit: 14 },
  { month: "T2", revenue: 38, expenses: 25, profit: 13 },
  { month: "T3", revenue: 55, expenses: 30, profit: 25 },
  { month: "T4", revenue: 48, expenses: 32, profit: 16 },
  { month: "T5", revenue: 62, expenses: 35, profit: 27 },
  { month: "T6", revenue: 58, expenses: 33, profit: 25 },
  { month: "T7", revenue: 71, expenses: 38, profit: 33 },
  { month: "T8", revenue: 68, expenses: 36, profit: 32 },
  { month: "T9", revenue: 80, expenses: 40, profit: 40 },
  { month: "T10", revenue: 75, expenses: 42, profit: 33 },
  { month: "T11", revenue: 88, expenses: 45, profit: 43 },
  { month: "T12", revenue: 95, expenses: 48, profit: 47 },
];

const wasteByType = [
  { name: "Nhựa", value: 35, fill: "hsl(142, 64%, 38%)" },
  { name: "Giấy", value: 25, fill: "hsl(160, 50%, 45%)" },
  { name: "Kim loại", value: 18, fill: "hsl(200, 60%, 50%)" },
  { name: "Thủy tinh", value: 12, fill: "hsl(45, 80%, 55%)" },
  { name: "Điện tử", value: 10, fill: "hsl(280, 50%, 55%)" },
];

const weeklyCollection = [
  { day: "T2", kg: 120, posts: 18 },
  { day: "T3", kg: 145, posts: 22 },
  { day: "T4", kg: 98, posts: 15 },
  { day: "T5", kg: 167, posts: 25 },
  { day: "T6", kg: 189, posts: 30 },
  { day: "T7", kg: 210, posts: 35 },
  { day: "CN", kg: 78, posts: 12 },
];

const userGrowth = [
  { month: "T1", users: 120, active: 95 },
  { month: "T2", users: 180, active: 140 },
  { month: "T3", users: 250, active: 200 },
  { month: "T4", users: 340, active: 280 },
  { month: "T5", users: 420, active: 350 },
  { month: "T6", users: 530, active: 430 },
  { month: "T7", users: 650, active: 520 },
  { month: "T8", users: 780, active: 620 },
  { month: "T9", users: 900, active: 710 },
  { month: "T10", users: 1050, active: 830 },
  { month: "T11", users: 1200, active: 960 },
  { month: "T12", users: 1380, active: 1100 },
];

const districtData = [
  { district: "Hải Châu", kg: 450, points: 12 },
  { district: "Thanh Khê", kg: 380, points: 9 },
  { district: "Sơn Trà", kg: 320, points: 8 },
  { district: "Ngũ Hành Sơn", kg: 280, points: 6 },
  { district: "Liên Chiểu", kg: 350, points: 10 },
  { district: "Cẩm Lệ", kg: 260, points: 5 },
  { district: "Hòa Vang", kg: 190, points: 4 },
];

const radarData = [
  { metric: "Thu gom", A: 85 },
  { metric: "Tái chế", A: 72 },
  { metric: "Giáo dục", A: 90 },
  { metric: "Cộng đồng", A: 78 },
  { metric: "AI phân loại", A: 88 },
  { metric: "Phần thưởng", A: 65 },
];

const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}h`,
  posts: Math.round(Math.sin((i - 6) * Math.PI / 12) * 15 + 18 + Math.random() * 5),
  transactions: Math.round(Math.sin((i - 8) * Math.PI / 12) * 10 + 12 + Math.random() * 4),
}));

const COLORS = ["hsl(142,64%,38%)", "hsl(160,50%,45%)", "hsl(200,60%,50%)", "hsl(45,80%,55%)", "hsl(280,50%,55%)"];

function KpiCard({ title, value, change, positive, icon: Icon }: { title: string; value: string; change: string; positive: boolean; icon: typeof TrendingUp }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className={`flex items-center gap-1 text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change} so với tháng trước
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thống kê & Phân tích</h1>
        <p className="text-muted-foreground">Tổng quan dữ liệu hoạt động hệ thống DaNang Recycle Hub</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Tổng rác thu gom" value="12.8 tấn" change="+18.2%" positive icon={Recycle} />
        <KpiCard title="Người dùng mới" value="1,380" change="+15.4%" positive icon={Users} />
        <KpiCard title="Doanh thu tháng" value="95M ₫" change="+8.1%" positive icon={Banknote} />
        <KpiCard title="Điểm xanh phát hành" value="45,200" change="+22.5%" positive icon={Leaf} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="waste">Rác thải</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Doanh thu & Chi phí</CardTitle>
                <CardDescription>Biểu đồ theo tháng (triệu VNĐ)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(140,15%,90%)" }} />
                    <Legend />
                    <Bar dataKey="revenue" name="Doanh thu" fill="hsl(142,64%,38%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Chi phí" fill="hsl(200,60%,50%)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="hsl(45,80%,55%)" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hiệu suất hệ thống</CardTitle>
                <CardDescription>Đánh giá tổng thể</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(140,15%,85%)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Hiệu suất" dataKey="A" stroke="hsl(142,64%,38%)" fill="hsl(142,64%,38%)" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Thu gom theo quận</CardTitle>
                <CardDescription>Khối lượng rác (kg) và số điểm thu gom</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={districtData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="district" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="kg" name="Kg thu gom" fill="hsl(142,64%,38%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thu gom trong tuần</CardTitle>
                <CardDescription>Khối lượng (kg) và số bài đăng</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyCollection}>
                    <defs>
                      <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142,64%,38%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142,64%,38%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Legend />
                    <Area type="monotone" dataKey="kg" name="Kg" stroke="hsl(142,64%,38%)" fill="url(#colorKg)" strokeWidth={2} />
                    <Line type="monotone" dataKey="posts" name="Bài đăng" stroke="hsl(200,60%,50%)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="waste" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Phân loại rác thải</CardTitle>
                <CardDescription>Tỷ lệ theo loại (%)</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={wasteByType} cx="50%" cy="50%" outerRadius={120} innerRadius={60} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                      {wasteByType.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xu hướng thu gom theo tháng</CardTitle>
                <CardDescription>Khối lượng tái chế qua các tháng</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142,64%,38%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(142,64%,38%)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Area type="monotone" dataKey="revenue" name="Thu gom (tấn)" stroke="hsl(142,64%,38%)" fill="url(#colorRevenue)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tăng trưởng người dùng</CardTitle>
              <CardDescription>Tổng đăng ký và người dùng hoạt động</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142,64%,38%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142,64%,38%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(200,60%,50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(200,60%,50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="users" name="Tổng đăng ký" stroke="hsl(142,64%,38%)" fill="url(#colorUsers)" strokeWidth={2} />
                  <Area type="monotone" dataKey="active" name="Hoạt động" stroke="hsl(200,60%,50%)" fill="url(#colorActive)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động theo giờ</CardTitle>
              <CardDescription>Số bài đăng và giao dịch trong ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,90%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="posts" name="Bài đăng" stroke="hsl(142,64%,38%)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="transactions" name="Giao dịch" stroke="hsl(280,50%,55%)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
