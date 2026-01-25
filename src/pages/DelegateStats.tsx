import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Search,
  Users,
  TrendingUp,
  Package,
  RefreshCcw,
  Clock,
  CheckCircle,
  Award,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Delegate {
  id: string;
  name: string;
  phone: string | null;
  branch: string | null;
  city: string | null;
  avatar_url: string | null;
  total_delivered: number;
  total_delayed: number;
  total_returned: number;
  balance: number;
  commission_due: number;
  status: string;
}

const COLORS = ["hsl(145, 65%, 42%)", "hsl(0, 84%, 60%)", "hsl(45, 95%, 55%)", "hsl(210, 90%, 55%)"];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "نشط", variant: "default" },
  inactive: { label: "غير نشط", variant: "secondary" },
  on_leave: { label: "في إجازة", variant: "outline" },
};

// Mock monthly performance data
const monthlyPerformance = [
  { month: "يناير", delivered: 120, delayed: 15, returned: 8 },
  { month: "فبراير", delivered: 150, delayed: 12, returned: 10 },
  { month: "مارس", delivered: 180, delayed: 20, returned: 12 },
  { month: "أبريل", delivered: 165, delayed: 18, returned: 9 },
  { month: "مايو", delivered: 200, delayed: 10, returned: 6 },
  { month: "يونيو", delivered: 220, delayed: 8, returned: 5 },
];

const DelegateStats = () => {
  const { isHeadManager } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [selectedDelegate, setSelectedDelegate] = useState<string | null>(null);

  // Fetch delegates
  const { data: delegates = [], isLoading } = useQuery({
    queryKey: ["delegates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delegates")
        .select("*")
        .order("total_delivered", { ascending: false });
      if (error) throw error;
      return data as Delegate[];
    },
  });

  // Get unique branches
  const branches = [...new Set(delegates.map((d) => d.branch).filter(Boolean))];

  // Filter delegates
  const filteredDelegates = delegates.filter((delegate) => {
    const matchesSearch =
      delegate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delegate.phone?.includes(searchQuery);
    const matchesBranch = branchFilter === "all" || delegate.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  // Calculate statistics
  const stats = {
    totalDelegates: delegates.length,
    activeDelegates: delegates.filter((d) => d.status === "active").length,
    totalDelivered: delegates.reduce((sum, d) => sum + d.total_delivered, 0),
    totalDelayed: delegates.reduce((sum, d) => sum + d.total_delayed, 0),
    totalReturned: delegates.reduce((sum, d) => sum + d.total_returned, 0),
    avgDeliveryRate:
      delegates.length > 0
        ? Math.round(
            (delegates.reduce((sum, d) => {
              const total = d.total_delivered + d.total_delayed + d.total_returned;
              return sum + (total > 0 ? (d.total_delivered / total) * 100 : 0);
            }, 0) /
              delegates.length)
          )
        : 0,
  };

  // Top performers data for bar chart
  const topPerformersData = filteredDelegates.slice(0, 10).map((d) => ({
    name: d.name.split(" ")[0],
    delivered: d.total_delivered,
    delayed: d.total_delayed,
    returned: d.total_returned,
  }));

  // Status distribution pie chart data
  const statusDistribution = [
    { name: "تم التسليم", value: stats.totalDelivered, color: "hsl(145, 65%, 42%)" },
    { name: "متأخرة", value: stats.totalDelayed, color: "hsl(0, 84%, 60%)" },
    { name: "مرتجع", value: stats.totalReturned, color: "hsl(45, 95%, 55%)" },
  ];

  if (!isHeadManager) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">غير مصرح لك بالوصول لهذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إحصائيات المناديب</h1>
        <p className="text-muted-foreground">تحليل أداء المناديب والتسليمات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المناديب</p>
                <p className="text-2xl font-bold">{stats.totalDelegates}</p>
                <p className="text-xs text-green-600">{stats.activeDelegates} نشط</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التسليمات</p>
                <p className="text-2xl font-bold">{stats.totalDelivered.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">معدل التسليم</p>
                <p className="text-2xl font-bold">{stats.avgDeliveryRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <RefreshCcw className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المرتجعات</p>
                <p className="text-2xl font-bold">{stats.totalReturned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              أداء أفضل المناديب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPerformersData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      direction: "rtl",
                    }}
                  />
                  <Bar dataKey="delivered" name="تم التسليم" fill="hsl(145, 65%, 42%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="delayed" name="متأخر" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="returned" name="مرتجع" fill="hsl(45, 95%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              توزيع حالات الشحنات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      direction: "rtl",
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ direction: "rtl" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            الأداء الشهري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    direction: "rtl",
                  }}
                />
                <Legend wrapperStyle={{ direction: "rtl" }} />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  name="تم التسليم"
                  stroke="hsl(145, 65%, 42%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(145, 65%, 42%)" }}
                />
                <Line
                  type="monotone"
                  dataKey="delayed"
                  name="متأخر"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(0, 84%, 60%)" }}
                />
                <Line
                  type="monotone"
                  dataKey="returned"
                  name="مرتجع"
                  stroke="hsl(45, 95%, 55%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(45, 95%, 55%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Delegates Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المناديب</CardTitle>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الفرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفروع</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch!}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredDelegates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد مناديب مطابقين للبحث
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المندوب</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>تم التسليم</TableHead>
                  <TableHead>متأخر</TableHead>
                  <TableHead>مرتجع</TableHead>
                  <TableHead>نسبة التسليم</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDelegates.map((delegate) => {
                  const total =
                    delegate.total_delivered + delegate.total_delayed + delegate.total_returned;
                  const deliveryRate = total > 0 ? (delegate.total_delivered / total) * 100 : 0;

                  return (
                    <TableRow key={delegate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={delegate.avatar_url || undefined} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{delegate.name}</p>
                            {delegate.phone && (
                              <p className="text-sm text-muted-foreground">{delegate.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{delegate.branch || "-"}</TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">
                          {delegate.total_delivered}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 font-medium">{delegate.total_delayed}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-amber-600 font-medium">
                          {delegate.total_returned}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={deliveryRate} className="h-2 w-20" />
                          <span className="text-sm font-medium">{Math.round(deliveryRate)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {Number(delegate.balance).toLocaleString()} ج.م
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[delegate.status]?.variant || "secondary"}>
                          {statusLabels[delegate.status]?.label || delegate.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DelegateStats;
