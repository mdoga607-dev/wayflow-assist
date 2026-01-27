import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Printer,
  Package,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line, Area, AreaChart 
} from "recharts";
import { useReportsData } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  delivered: "#10b981",
  pending: "#f59e0b",
  transit: "#3b82f6",
  delayed: "#ef4444",
  returned: "#8b5cf6",
};

const Reports = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useReportsData();

  const handleExportExcel = (type: string) => {
    console.log(`Exporting ${type} to Excel...`);
  };

  const handleExportPDF = (type: string) => {
    console.log(`Exporting ${type} to PDF...`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const { stats, monthlyData, delegateReports } = data || {
    stats: { totalRevenue: 0, totalCommissions: 0, totalShipments: 0, deliveredCount: 0, pendingCount: 0, delayedCount: 0, returnedCount: 0, transitCount: 0 },
    monthlyData: [],
    delegateReports: [],
  };

  const statusData = [
    { name: "تم التسليم", value: stats.deliveredCount, color: statusColors.delivered },
    { name: "في الانتظار", value: stats.pendingCount, color: statusColors.pending },
    { name: "قيد التوصيل", value: stats.transitCount, color: statusColors.transit },
    { name: "متأخر", value: stats.delayedCount, color: statusColors.delayed },
    { name: "مرتجع", value: stats.returnedCount, color: statusColors.returned },
  ].filter(s => s.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>
          <p className="text-muted-foreground">تقارير شاملة للإيرادات والعمولات والشحنات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} ر.س</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">إجمالي العمولات</p>
                <p className="text-2xl font-bold">{stats.totalCommissions.toLocaleString()} ر.س</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">إجمالي الشحنات</p>
                <p className="text-2xl font-bold">{stats.totalShipments}</p>
              </div>
              <Package className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">نسبة التسليم</p>
                <p className="text-2xl font-bold">
                  {stats.totalShipments > 0 
                    ? Math.round((stats.deliveredCount / stats.totalShipments) * 100) 
                    : 0}%
                </p>
              </div>
              <Truck className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>الإيرادات والعمولات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCommissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} ر.س`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="commissions" name="العمولات" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCommissions)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع حالات الشحنات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Delegate Performance */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              أداء المناديب والعمولات
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportExcel("delegates")}>
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                تصدير Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportPDF("delegates")}>
                <FileText className="w-4 h-4 ml-2" />
                تصدير PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">المندوب</TableHead>
                  <TableHead className="text-right">تم التسليم</TableHead>
                  <TableHead className="text-right">متأخر</TableHead>
                  <TableHead className="text-right">مرتجع</TableHead>
                  <TableHead className="text-right">نسبة النجاح</TableHead>
                  <TableHead className="text-right">العمولة المستحقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegateReports.map((delegate) => (
                  <TableRow key={delegate.id}>
                    <TableCell className="font-medium">{delegate.name}</TableCell>
                    <TableCell className="text-green-600 font-semibold">{delegate.totalDelivered}</TableCell>
                    <TableCell className="text-yellow-600">{delegate.totalDelayed}</TableCell>
                    <TableCell className="text-red-600">{delegate.totalReturned}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={delegate.successRate >= 80 ? "default" : delegate.successRate >= 60 ? "secondary" : "destructive"}
                      >
                        {delegate.successRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      {delegate.commissionDue.toLocaleString()} ر.س
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <p className="text-muted-foreground">إجمالي {delegateReports.length} مناديب</p>
            <p className="font-bold text-lg">
              إجمالي العمولات: <span className="text-primary">{stats.totalCommissions.toLocaleString()} ر.س</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Shipments Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>عدد الشحنات الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="shipments" name="عدد الشحنات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
