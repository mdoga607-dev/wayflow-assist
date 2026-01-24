import { useState } from "react";
import { Calendar, Filter, Clock, AlertTriangle, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DelayedShipment {
  id: string;
  customer: string;
  phone: string;
  city: string;
  address: string;
  delegate: string;
  delayDays: number;
  reason: string;
  lastUpdate: string;
}

const delayedShipments: DelayedShipment[] = [
  { id: "SHP-101", customer: "محمد أحمد", phone: "0512345678", city: "الرياض", address: "حي النخيل", delegate: "أحمد", delayDays: 3, reason: "العميل غير متواجد", lastUpdate: "2024-01-15" },
  { id: "SHP-102", customer: "فاطمة علي", phone: "0523456789", city: "جدة", address: "حي الروضة", delegate: "خالد", delayDays: 5, reason: "عنوان غير صحيح", lastUpdate: "2024-01-14" },
  { id: "SHP-103", customer: "عبدالله سعيد", phone: "0534567890", city: "الدمام", address: "حي الفيصلية", delegate: "عمر", delayDays: 2, reason: "رفض الاستلام", lastUpdate: "2024-01-15" },
  { id: "SHP-104", customer: "نورة خالد", phone: "0545678901", city: "مكة", address: "حي العزيزية", delegate: "أحمد", delayDays: 7, reason: "الهاتف مغلق", lastUpdate: "2024-01-12" },
  { id: "SHP-105", customer: "سارة محمد", phone: "0556789012", city: "المدينة", address: "حي السلام", delegate: "سعيد", delayDays: 4, reason: "العميل طلب التأجيل", lastUpdate: "2024-01-14" },
  { id: "SHP-106", customer: "يوسف علي", phone: "0567890123", city: "الرياض", address: "حي الملز", delegate: "خالد", delayDays: 1, reason: "ازدحام المنطقة", lastUpdate: "2024-01-15" },
];

const DelayedShipments = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [cityFilter, setCityFilter] = useState("all");
  const [delegateFilter, setDelegateFilter] = useState("all");

  const filteredShipments = delayedShipments.filter((s) => {
    const matchesCity = cityFilter === "all" || s.city === cityFilter;
    const matchesDelegate = delegateFilter === "all" || s.delegate === delegateFilter;
    return matchesCity && matchesDelegate;
  });

  const criticalCount = delayedShipments.filter(s => s.delayDays >= 5).length;
  const warningCount = delayedShipments.filter(s => s.delayDays >= 3 && s.delayDays < 5).length;
  const recentCount = delayedShipments.filter(s => s.delayDays < 3).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الشحنات المتأخرة</h1>
          <p className="text-muted-foreground">متابعة الشحنات التي تجاوزت موعد التسليم</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              التقويم
            </h3>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                delayed: [new Date(2024, 0, 12), new Date(2024, 0, 14), new Date(2024, 0, 15)],
              }}
              modifiersStyles={{
                delayed: { backgroundColor: "hsl(45, 95%, 85%)", borderRadius: "4px" },
              }}
            />
            
            {/* Stats */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                <span className="text-sm">حرجة (+5 أيام)</span>
                <span className="font-bold text-destructive">{criticalCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10">
                <span className="text-sm">متوسطة (3-5 أيام)</span>
                <span className="font-bold text-yellow-600">{warningCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10">
                <span className="text-sm">حديثة (&lt;3 أيام)</span>
                <span className="font-bold text-blue-600">{recentCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-wrap gap-4">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المدن</SelectItem>
                <SelectItem value="الرياض">الرياض</SelectItem>
                <SelectItem value="جدة">جدة</SelectItem>
                <SelectItem value="الدمام">الدمام</SelectItem>
                <SelectItem value="مكة">مكة</SelectItem>
                <SelectItem value="المدينة">المدينة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={delegateFilter} onValueChange={setDelegateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="المندوب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المناديب</SelectItem>
                <SelectItem value="أحمد">أحمد</SelectItem>
                <SelectItem value="خالد">خالد</SelectItem>
                <SelectItem value="عمر">عمر</SelectItem>
                <SelectItem value="سعيد">سعيد</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delayed Shipments Cards */}
          <div className="grid gap-4">
            {filteredShipments.map((shipment, index) => (
              <div
                key={shipment.id}
                className={cn(
                  "bg-card rounded-xl p-4 shadow-sm border-r-4 animate-fade-in",
                  shipment.delayDays >= 5 ? "border-r-destructive bg-destructive/5" :
                  shipment.delayDays >= 3 ? "border-r-yellow-500 bg-yellow-50" :
                  "border-r-blue-500 bg-blue-50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary">{shipment.id}</span>
                      <span className={cn(
                        "status-badge",
                        shipment.delayDays >= 5 ? "bg-destructive/20 text-destructive" :
                        shipment.delayDays >= 3 ? "bg-yellow-200 text-yellow-700" :
                        "bg-blue-200 text-blue-700"
                      )}>
                        <Clock className="h-3 w-3 ml-1" />
                        {shipment.delayDays} أيام تأخير
                      </span>
                    </div>
                    <p className="font-semibold text-lg">{shipment.customer}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span dir="ltr">{shipment.phone}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {shipment.city} - {shipment.address}
                      </span>
                    </div>
                  </div>
                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{shipment.reason}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">المندوب: {shipment.delegate}</p>
                    <p className="text-xs text-muted-foreground">آخر تحديث: {shipment.lastUpdate}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button size="sm" variant="outline">اتصال</Button>
                  <Button size="sm" variant="outline">إعادة تعيين</Button>
                  <Button size="sm" className="bg-accent hover:bg-accent/90">تحديث الحالة</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelayedShipments;
