import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Search,
  RotateCcw,
  Phone,
  MapPin,
  Eye,
  Check,
  X,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// نفس البيانات (يمكن توسيعها)
const returnsData = [
  {
    id: 1,
    trackingNumber: "TRK-2024-R001",
    originalTrackingNumber: "TRK-2024-001",
    customerName: "أحمد محمد",
    phone: "01012345678",
    city: "القاهرة",
    address: "شارع التحرير، الدقي",
    returnDate: new Date(2024, 0, 20),
    status: "في الطريق",
    reason: "العميل غير موجود",
    delegate: "محمود سامح",
    amount: 450,
    attempts: 2,
  },
  // ... أضف باقي السجلات هنا
];

const getStatusColor = (status: string) => {
  const map = {
    "في الطريق": "bg-blue-600/90 text-white border-blue-700",
    "وصل المخزن": "bg-emerald-600/90 text-white border-emerald-700",
    "قيد المراجعة": "bg-amber-600/90 text-white border-amber-700",
    "تم الإرجاع للمرسل": "bg-violet-600/90 text-white border-violet-700",
  };
  return map[status] || "bg-slate-600/90 text-white border-slate-700";
};

export default function ReturnsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [delegateFilter, setDelegateFilter] = useState("all");
  const [selectedReturn, setSelectedReturn] = useState<(typeof returnsData)[0] | null>(null);

  const datesWithReturns = returnsData.map((r) => r.returnDate);

  const filteredReturns = returnsData.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.trackingNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.phone.includes(q);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesCity = cityFilter === "all" || r.city === cityFilter;
    const matchesDelegate = delegateFilter === "all" || r.delegate === delegateFilter;
    return matchesSearch && matchesStatus && matchesCity && matchesDelegate;
  });

  const stats = {
    total: returnsData.length,
    inTransit: returnsData.filter((r) => r.status === "في الطريق").length,
    inWarehouse: returnsData.filter((r) => r.status === "وصل المخزن").length,
    underReview: returnsData.filter((r) => r.status === "قيد المراجعة").length,
    returned: returnsData.filter((r) => r.status === "تم الإرجاع للمرسل").length,
  };

  const cities = [...new Set(returnsData.map((r) => r.city))];
  const delegates = [...new Set(returnsData.map((r) => r.delegate))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8 max-w-7xl">
        {/* Header + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <RotateCcw className="h-8 w-8 text-violet-600" />
              المرتجعات
            </h1>
            <p className="text-muted-foreground mt-1.5">
              متابعة وإدارة الشحنات المرتجعة
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              تصدير Excel
            </Button>
            <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700">
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>
        </div>

        {/* Calendar – في الأعلى كما طلبت */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-indigo-50 pb-3">
            <CardTitle className="flex items-center gap-2.5 text-xl">
              <CalendarIcon className="h-5 w-5 text-violet-700" />
              تقويم المرتجعات
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 pb-6 flex flex-col md:flex-row gap-6 md:items-start">
            <div className="md:w-80 lg:w-96 shrink-0 mx-auto md:mx-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-lg border shadow-sm w-full"
                locale={ar}
                modifiers={{ hasReturn: datesWithReturns }}
                modifiersStyles={{
                  hasReturn: {
                    fontWeight: "bold",
                    backgroundColor: "hsl(var(--violet-100))",
                    color: "hsl(var(--violet-800))",
                    borderRadius: "6px",
                  },
                }}
              />
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{stats.inTransit}</div>
                <div className="text-xs text-blue-800 mt-1">في الطريق</div>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700">{stats.inWarehouse}</div>
                <div className="text-xs text-emerald-800 mt-1">وصل المخزن</div>
              </div>
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{stats.underReview}</div>
                <div className="text-xs text-amber-800 mt-1">قيد المراجعة</div>
              </div>
              <div className="bg-violet-50/70 border border-violet-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-violet-700">{stats.returned}</div>
                <div className="text-xs text-violet-800 mt-1">تم الإرجاع</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters + Table */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <CardTitle className="text-xl">قائمة المرتجعات</CardTitle>

              <div className="flex flex-wrap gap-3">
                <div className="relative min-w-[240px] flex-1 lg:flex-none">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث برقم التتبع – الاسم – الهاتف"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-white"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="في الطريق">في الطريق</SelectItem>
                    <SelectItem value="وصل المخزن">وصل المخزن</SelectItem>
                    <SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem>
                    <SelectItem value="تم الإرجاع للمرسل">تم الإرجاع</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المدن</SelectItem>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={delegateFilter} onValueChange={setDelegateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="المندوب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المناديب</SelectItem>
                    {delegates.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg border overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-right font-medium">رقم التتبع</TableHead>
                      <TableHead className="text-right font-medium">العميل</TableHead>
                      <TableHead className="text-right font-medium">المدينة</TableHead>
                      <TableHead className="text-right font-medium">التاريخ</TableHead>
                      <TableHead className="text-right font-medium">السبب</TableHead>
                      <TableHead className="text-right font-medium">الحالة</TableHead>
                      <TableHead className="text-right font-medium">المندوب</TableHead>
                      <TableHead className="text-right font-medium w-24">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReturns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                          لا توجد مرتجعات مطابقة للفلاتر الحالية
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReturns.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/70">
                          <TableCell className="font-medium text-violet-700">
                            {item.trackingNumber}
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.originalTrackingNumber}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.customerName}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Phone className="h-3 w-3" />
                              {item.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              {item.city}
                            </div>
                          </TableCell>
                          <TableCell>{format(item.returnDate, "dd/MM/yyyy")}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {item.reason}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`px-3 py-1 text-xs font-medium border ${getStatusColor(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{item.delegate}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setSelectedReturn(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle className="text-xl">
                                      تفاصيل المرتجع • {item.trackingNumber}
                                    </DialogTitle>
                                  </DialogHeader>
                                  {/* هنا يمكنك إضافة تفاصيل أكثر تفصيلاً كما كان في الكود الأصلي */}
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="px-6 py-3.5 text-sm text-muted-foreground bg-slate-50 border-t">
                عرض {filteredReturns.length} مرتجع من إجمالي {returnsData.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}