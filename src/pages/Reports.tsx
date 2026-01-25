import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Download,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Demo data for collection reports
const collectionReports = [
  { id: 1, date: "2024-01-20", amount: 5200, collector: "أحمد محمد", customer: "شركة النور", status: "مكتمل", notes: "دفعة كاملة" },
  { id: 2, date: "2024-01-19", amount: 3500, collector: "محمد علي", customer: "مؤسسة الفجر", status: "مكتمل", notes: "دفعة جزئية" },
  { id: 3, date: "2024-01-18", amount: 8900, collector: "أحمد محمد", customer: "شركة البركة", status: "معلق", notes: "في انتظار التحويل" },
  { id: 4, date: "2024-01-17", amount: 2100, collector: "سامي أحمد", customer: "متجر السلام", status: "مكتمل", notes: "" },
  { id: 5, date: "2024-01-16", amount: 6700, collector: "محمد علي", customer: "شركة الأمل", status: "مكتمل", notes: "دفعة نقدية" },
];

// Demo data for payment reports
const paymentReports = [
  { id: 1, date: "2024-01-20", amount: 4500, payer: "أحمد محمد", type: "نقدي", notes: "راتب المندوب", status: "مكتمل" },
  { id: 2, date: "2024-01-19", amount: 2000, payer: "الإدارة", type: "تحويل", notes: "مصاريف نقل", status: "مكتمل" },
  { id: 3, date: "2024-01-18", amount: 1500, payer: "محمد علي", type: "نقدي", notes: "عمولة", status: "معلق" },
  { id: 4, date: "2024-01-17", amount: 3200, payer: "الإدارة", type: "شيك", notes: "فواتير", status: "مكتمل" },
  { id: 5, date: "2024-01-16", amount: 800, payer: "سامي أحمد", type: "نقدي", notes: "بدل انتقال", status: "مكتمل" },
];

// Chart data
const monthlyData = [
  { name: "يناير", collection: 45000, payment: 32000 },
  { name: "فبراير", collection: 52000, payment: 38000 },
  { name: "مارس", collection: 48000, payment: 35000 },
  { name: "أبريل", collection: 61000, payment: 42000 },
  { name: "مايو", collection: 55000, payment: 40000 },
  { name: "يونيو", collection: 67000, payment: 45000 },
];

const statusData = [
  { name: "مكتمل", value: 75, color: "#10b981" },
  { name: "معلق", value: 15, color: "#f59e0b" },
  { name: "ملغي", value: 10, color: "#ef4444" },
];

const Reports = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [collectorFilter, setCollectorFilter] = useState("all");

  const totalCollection = collectionReports.reduce((sum, r) => sum + r.amount, 0);
  const totalPayment = paymentReports.reduce((sum, r) => sum + r.amount, 0);

  const handleExportExcel = (type: string) => {
    // Simulate Excel export
    console.log(`Exporting ${type} to Excel...`);
  };

  const handleExportPDF = (type: string) => {
    // Simulate PDF export
    console.log(`Exporting ${type} to PDF...`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التقارير</h1>
          <p className="text-muted-foreground">تقارير الجمع والدفع مع إمكانية التصدير</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">إجمالي الجمع</p>
                <p className="text-2xl font-bold">{totalCollection.toLocaleString()} ج.م</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">إجمالي الدفع</p>
                <p className="text-2xl font-bold">{totalPayment.toLocaleString()} ج.م</p>
              </div>
              <TrendingDown className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">صافي الرصيد</p>
                <p className="text-2xl font-bold">{(totalCollection - totalPayment).toLocaleString()} ج.م</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">عدد العمليات</p>
                <p className="text-2xl font-bold">{collectionReports.length + paymentReports.length}</p>
              </div>
              <Users className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>مقارنة الجمع والدفع الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="collection" name="الجمع" fill="#10b981" />
                <Bar dataKey="payment" name="الدفع" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حالة العمليات</CardTitle>
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

      {/* Reports Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>تفاصيل التقارير</CardTitle>
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="w-4 h-4 ml-2" />
                    {dateFrom ? format(dateFrom, "yyyy/MM/dd") : "من تاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="w-4 h-4 ml-2" />
                    {dateTo ? format(dateTo, "yyyy/MM/dd") : "إلى تاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="collection" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="collection">تقرير الجمع</TabsTrigger>
                <TabsTrigger value="payment">تقرير الدفع</TabsTrigger>
              </TabsList>
            </div>

            {/* Collection Report */}
            <TabsContent value="collection" className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportExcel("collection")}>
                  <FileSpreadsheet className="w-4 h-4 ml-2" />
                  تصدير Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportPDF("collection")}>
                  <FileText className="w-4 h-4 ml-2" />
                  تصدير PDF
                </Button>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الجامع</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectionReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.date}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {report.amount.toLocaleString()} ج.م
                        </TableCell>
                        <TableCell>{report.collector}</TableCell>
                        <TableCell>{report.customer}</TableCell>
                        <TableCell>
                          <Badge variant={report.status === "مكتمل" ? "default" : "secondary"}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{report.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-muted-foreground">إجمالي {collectionReports.length} عمليات</p>
                <p className="font-bold text-lg">
                  الإجمالي: <span className="text-green-600">{totalCollection.toLocaleString()} ج.م</span>
                </p>
              </div>
            </TabsContent>

            {/* Payment Report */}
            <TabsContent value="payment" className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportExcel("payment")}>
                  <FileSpreadsheet className="w-4 h-4 ml-2" />
                  تصدير Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportPDF("payment")}>
                  <FileText className="w-4 h-4 ml-2" />
                  تصدير PDF
                </Button>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الدافع</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.date}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          {report.amount.toLocaleString()} ج.م
                        </TableCell>
                        <TableCell>{report.payer}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.status === "مكتمل" ? "default" : "secondary"}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{report.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-muted-foreground">إجمالي {paymentReports.length} عمليات</p>
                <p className="font-bold text-lg">
                  الإجمالي: <span className="text-red-600">{totalPayment.toLocaleString()} ج.م</span>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
