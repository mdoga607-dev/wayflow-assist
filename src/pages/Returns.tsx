import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Package,
  Search,
  Filter,
  RotateCcw,
  Phone,
  MapPin,
  Eye,
  Check,
  X,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Demo returns data
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
  {
    id: 2,
    trackingNumber: "TRK-2024-R002",
    originalTrackingNumber: "TRK-2024-015",
    customerName: "سارة أحمد",
    phone: "01098765432",
    city: "الإسكندرية",
    address: "شارع السلام، سموحة",
    returnDate: new Date(2024, 0, 19),
    status: "وصل المخزن",
    reason: "رفض الاستلام",
    delegate: "أحمد علي",
    amount: 320,
    attempts: 3,
  },
  {
    id: 3,
    trackingNumber: "TRK-2024-R003",
    originalTrackingNumber: "TRK-2024-022",
    customerName: "محمد علي",
    phone: "01123456789",
    city: "الجيزة",
    address: "شارع الهرم، فيصل",
    returnDate: new Date(2024, 0, 18),
    status: "قيد المراجعة",
    reason: "منتج تالف",
    delegate: "محمود سامح",
    amount: 580,
    attempts: 1,
  },
  {
    id: 4,
    trackingNumber: "TRK-2024-R004",
    originalTrackingNumber: "TRK-2024-033",
    customerName: "فاطمة حسن",
    phone: "01234567890",
    city: "المنصورة",
    address: "شارع الجمهورية",
    returnDate: new Date(2024, 0, 17),
    status: "تم الإرجاع للمرسل",
    reason: "عنوان خاطئ",
    delegate: "سامي محمد",
    amount: 720,
    attempts: 2,
  },
  {
    id: 5,
    trackingNumber: "TRK-2024-R005",
    originalTrackingNumber: "TRK-2024-044",
    customerName: "خالد إبراهيم",
    phone: "01156789012",
    city: "طنطا",
    address: "شارع سعيد",
    returnDate: new Date(2024, 0, 16),
    status: "في الطريق",
    reason: "العميل طلب إلغاء",
    delegate: "أحمد علي",
    amount: 890,
    attempts: 1,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "وصل المخزن":
      return "bg-green-500 text-white";
    case "في الطريق":
      return "bg-blue-500 text-white";
    case "قيد المراجعة":
      return "bg-yellow-500 text-white";
    case "تم الإرجاع للمرسل":
      return "bg-purple-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const Returns = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [delegateFilter, setDelegateFilter] = useState("all");
  const [selectedReturn, setSelectedReturn] = useState<typeof returnsData[0] | null>(null);

  // Get dates with returns for calendar highlighting
  const datesWithReturns = returnsData.map((r) => r.returnDate);

  // Filter returns
  const filteredReturns = returnsData.filter((r) => {
    const matchesSearch =
      r.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.includes(searchQuery) ||
      r.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesCity = cityFilter === "all" || r.city === cityFilter;
    const matchesDelegate = delegateFilter === "all" || r.delegate === delegateFilter;
    return matchesSearch && matchesStatus && matchesCity && matchesDelegate;
  });

  // Stats
  const stats = {
    total: returnsData.length,
    inTransit: returnsData.filter((r) => r.status === "في الطريق").length,
    inWarehouse: returnsData.filter((r) => r.status === "وصل المخزن").length,
    returned: returnsData.filter((r) => r.status === "تم الإرجاع للمرسل").length,
  };

  const cities = [...new Set(returnsData.map((r) => r.city))];
  const delegates = [...new Set(returnsData.map((r) => r.delegate))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-primary" />
            تتبع المرتجعات
          </h1>
          <p className="text-muted-foreground">متابعة الشحنات المرتجعة وإدارتها</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileSpreadsheet className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
          <Button>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-muted-foreground">إجمالي المرتجعات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.inTransit}</p>
            <p className="text-sm text-muted-foreground">في الطريق</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{stats.inWarehouse}</p>
            <p className="text-sm text-muted-foreground">وصل المخزن</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-500">{stats.returned}</p>
            <p className="text-sm text-muted-foreground">تم الإرجاع</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">التقويم</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                hasReturns: datesWithReturns,
              }}
              modifiersStyles={{
                hasReturns: {
                  backgroundColor: "hsl(var(--primary) / 0.2)",
                  fontWeight: "bold",
                },
              }}
            />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary/20"></div>
                <span>أيام بها مرتجعات</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>قائمة المرتجعات</CardTitle>
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 w-40"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
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
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المدن</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={delegateFilter} onValueChange={setDelegateFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="المندوب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المناديب</SelectItem>
                    {delegates.map((delegate) => (
                      <SelectItem key={delegate} value={delegate}>
                        {delegate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right">رقم التتبع</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">المدينة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المندوب</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        لا توجد مرتجعات مطابقة للبحث
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReturns.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-primary">{item.trackingNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              الأصلي: {item.originalTrackingNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.customerName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {item.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {item.city}
                          </div>
                        </TableCell>
                        <TableCell>{format(item.returnDate, "yyyy/MM/dd")}</TableCell>
                        <TableCell>
                          <span className="text-sm">{item.reason}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </TableCell>
                        <TableCell>{item.delegate}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedReturn(item)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>تفاصيل المرتجع</DialogTitle>
                                </DialogHeader>
                                {selectedReturn && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground">رقم التتبع</p>
                                        <p className="font-medium">{selectedReturn.trackingNumber}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">المبلغ</p>
                                        <p className="font-medium text-primary">
                                          {selectedReturn.amount} ج.م
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">العميل</p>
                                        <p className="font-medium">{selectedReturn.customerName}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">الهاتف</p>
                                        <p className="font-medium">{selectedReturn.phone}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-sm text-muted-foreground">العنوان</p>
                                        <p className="font-medium">
                                          {selectedReturn.city} - {selectedReturn.address}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">سبب الإرجاع</p>
                                        <p className="font-medium">{selectedReturn.reason}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">محاولات التسليم</p>
                                        <p className="font-medium">{selectedReturn.attempts}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                      <Button className="flex-1" variant="outline">
                                        <Phone className="w-4 h-4 ml-2" />
                                        اتصال
                                      </Button>
                                      <Button className="flex-1">
                                        <Check className="w-4 h-4 ml-2" />
                                        تأكيد الاستلام
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="icon" className="text-green-600">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                عرض {filteredReturns.length} من {returnsData.length} مرتجع
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Returns;
