import { useState } from "react";
import { Download, FileSpreadsheet, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const mockShipments = [
  { id: "SHP-001", customer: "محمد أحمد", phone: "0512345678", city: "الرياض", address: "حي النخيل", status: "delivered", date: "2024-01-15", amount: 250 },
  { id: "SHP-002", customer: "فاطمة علي", phone: "0523456789", city: "جدة", address: "حي الروضة", status: "transit", date: "2024-01-15", amount: 180 },
  { id: "SHP-003", customer: "عبدالله سعيد", phone: "0534567890", city: "الدمام", address: "حي الفيصلية", status: "pending", date: "2024-01-14", amount: 320 },
  { id: "SHP-004", customer: "نورة خالد", phone: "0545678901", city: "مكة", address: "حي العزيزية", status: "delayed", date: "2024-01-14", amount: 150 },
  { id: "SHP-005", customer: "سارة محمد", phone: "0556789012", city: "المدينة", address: "حي السلام", status: "delivered", date: "2024-01-13", amount: 420 },
];

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
};

const cities = ["الرياض", "جدة", "الدمام", "مكة", "المدينة"];

const ExportShipments = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const getFilteredShipments = () => {
    return mockShipments.filter((shipment) => {
      const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
      const matchesCity = selectedCities.length === 0 || selectedCities.includes(shipment.city);
      
      const shipmentDate = new Date(shipment.date);
      const matchesDateFrom = !dateFrom || shipmentDate >= dateFrom;
      const matchesDateTo = !dateTo || shipmentDate <= dateTo;

      return matchesStatus && matchesCity && matchesDateFrom && matchesDateTo;
    });
  };

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      const filteredData = getFilteredShipments();
      
      const exportData = filteredData.map((s) => ({
        "رقم الشحنة": s.id,
        "اسم العميل": s.customer,
        "رقم الهاتف": s.phone,
        "المدينة": s.city,
        "العنوان": s.address,
        "الحالة": statusLabels[s.status],
        "التاريخ": s.date,
        "المبلغ": s.amount,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الشحنات");
      
      const fileName = `shipments_export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${filteredData.length} شحنة إلى ملف Excel`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCount = getFilteredShipments().length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تصدير الشحنات</h1>
        <p className="text-muted-foreground">تصدير بيانات الشحنات إلى ملف Excel</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Filters Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              خيارات التصفية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>من تاريخ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="ml-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>إلى تاريخ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="ml-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="transit">قيد التوصيل</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="delayed">متأخر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cities Filter */}
            <div className="space-y-3">
              <Label>المدن</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {cities.map((city) => (
                  <div key={city} className="flex items-center gap-2">
                    <Checkbox
                      id={city}
                      checked={selectedCities.includes(city)}
                      onCheckedChange={() => toggleCity(city)}
                    />
                    <Label htmlFor={city} className="cursor-pointer text-sm">
                      {city}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedCities.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  لم يتم تحديد مدن - سيتم تصدير جميع المدن
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              ملخص التصدير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">عدد الشحنات</span>
                <span className="font-bold">{filteredCount}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">الحالة</span>
                <span className="font-medium">
                  {statusFilter === "all" ? "الكل" : statusLabels[statusFilter]}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">المدن</span>
                <span className="font-medium">
                  {selectedCities.length === 0
                    ? "الكل"
                    : selectedCities.length === 1
                    ? selectedCities[0]
                    : `${selectedCities.length} مدن`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الفترة</span>
                <span className="font-medium text-sm">
                  {dateFrom || dateTo
                    ? `${dateFrom ? format(dateFrom, "dd/MM", { locale: ar }) : "..."} - ${dateTo ? format(dateTo, "dd/MM", { locale: ar }) : "..."}`
                    : "الكل"}
                </span>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting || filteredCount === 0}
              className="w-full gap-2 bg-accent hover:bg-accent/90"
              size="lg"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "جاري التصدير..." : "تصدير إلى Excel"}
            </Button>

            {filteredCount === 0 && (
              <p className="text-center text-sm text-destructive">
                لا توجد شحنات مطابقة للفلاتر المحددة
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>معاينة البيانات ({filteredCount} شحنة)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الشحنة</th>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>المدينة</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredShipments().slice(0, 5).map((shipment) => (
                  <tr key={shipment.id}>
                    <td className="font-medium text-primary">{shipment.id}</td>
                    <td>{shipment.customer}</td>
                    <td dir="ltr" className="text-right">{shipment.phone}</td>
                    <td>{shipment.city}</td>
                    <td>
                      <span className={cn("status-badge", `status-${shipment.status}`)}>
                        {statusLabels[shipment.status]}
                      </span>
                    </td>
                    <td>{shipment.date}</td>
                    <td className="font-semibold">{shipment.amount} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCount > 5 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                وأكثر من {filteredCount - 5} شحنات أخرى...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportShipments;
