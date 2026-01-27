"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Phone,
  MapPin,
  SearchX,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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
  {
    id: "SHP-101",
    customer: "محمد أحمد",
    phone: "0512345678",
    city: "الرياض",
    address: "حي النخيل",
    delegate: "أحمد",
    delayDays: 3,
    reason: "العميل غير متواجد",
    lastUpdate: "2024-01-15",
  },
  {
    id: "SHP-102",
    customer: "فاطمة علي",
    phone: "0523456789",
    city: "جدة",
    address: "حي الروضة",
    delegate: "خالد",
    delayDays: 5,
    reason: "عنوان غير صحيح",
    lastUpdate: "2024-01-14",
  },
  {
    id: "SHP-103",
    customer: "عبدالله سعيد",
    phone: "0534567890",
    city: "الدمام",
    address: "حي الفيصلية",
    delegate: "عمر",
    delayDays: 2,
    reason: "رفض الاستلام",
    lastUpdate: "2024-01-15",
  },
  {
    id: "SHP-104",
    customer: "نورة خالد",
    phone: "0545678901",
    city: "مكة",
    address: "حي العزيزية",
    delegate: "أحمد",
    delayDays: 7,
    reason: "الهاتف مغلق",
    lastUpdate: "2024-01-12",
  },
  {
    id: "SHP-105",
    customer: "سارة محمد",
    phone: "0556789012",
    city: "المدينة",
    address: "حي السلام",
    delegate: "سعيد",
    delayDays: 4,
    reason: "العميل طلب التأجيل",
    lastUpdate: "2024-01-14",
  },
  {
    id: "SHP-106",
    customer: "يوسف علي",
    phone: "0567890123",
    city: "الرياض",
    address: "حي الملز",
    delegate: "خالد",
    delayDays: 1,
    reason: "ازدحام المنطقة",
    lastUpdate: "2024-01-15",
  },
];

export default function DelayedShipments() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [cityFilter, setCityFilter] = useState("all");
  const [delegateFilter, setDelegateFilter] = useState("all");
  const [delayLevelFilter, setDelayLevelFilter] = useState("all");

  const filteredShipments = delayedShipments.filter((s) => {
    const matchesCity = cityFilter === "all" || s.city === cityFilter;
    const matchesDelegate = delegateFilter === "all" || s.delegate === delegateFilter;
    const matchesDelay =
      delayLevelFilter === "all" ||
      (delayLevelFilter === "critical" && s.delayDays >= 5) ||
      (delayLevelFilter === "warning" && s.delayDays >= 3 && s.delayDays < 5) ||
      (delayLevelFilter === "recent" && s.delayDays < 3);

    return matchesCity && matchesDelegate && matchesDelay;
  });

  const criticalCount = delayedShipments.filter((s) => s.delayDays >= 5).length;
  const warningCount = delayedShipments.filter(
    (s) => s.delayDays >= 3 && s.delayDays < 5
  ).length;
  const recentCount = delayedShipments.filter((s) => s.delayDays < 3).length;

  return (
    <div className="container mx-auto space-y-8 py-8 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الشحنات المتأخرة</h1>
          <p className="text-muted-foreground mt-1.5">
            متابعة الشحنات التي تجاوزت موعد التسليم المحدد
          </p>
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          {format(new Date(), "EEEE, dd MMMM yyyy", { locale: ar })}
        </div>
      </div>

      {/* Calendar Section - في الأعلى */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/40">
          <h2 className="text-xl font-semibold flex items-center gap-2.5">
            <CalendarIcon className="h-5 w-5 text-primary" />
            التقويم
          </h2>
        </div>
        <div className="p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className={cn("rounded-md border mx-auto w-full max-w-md")}
            locale={ar}
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-bold",
            }}
          />
        </div>
      </div>

      {/* Stats quick view */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-5 text-center">
          <div className="text-3xl font-bold text-destructive">{criticalCount}</div>
          <div className="text-sm text-destructive/80 mt-2">حرجة (≥ 5 أيام)</div>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-5 text-center">
          <div className="text-3xl font-bold text-yellow-700">{warningCount}</div>
          <div className="text-sm text-yellow-700/80 mt-2">متوسطة (3–4 أيام)</div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-5 text-center">
          <div className="text-3xl font-bold text-blue-700">{recentCount}</div>
          <div className="text-sm text-blue-700/80 mt-2">حديثة (  3 أيام)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border shadow-sm p-5">
        <div className="flex flex-wrap gap-4">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-44 min-w-[140px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="المدينة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المدن</SelectItem>
              {Array.from(new Set(delayedShipments.map((s) => s.city))).map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={delegateFilter} onValueChange={setDelegateFilter}>
            <SelectTrigger className="w-full sm:w-44 min-w-[140px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="المندوب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المناديب</SelectItem>
              {Array.from(new Set(delayedShipments.map((s) => s.delegate))).map((del) => (
                <SelectItem key={del} value={del}>
                  {del}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={delayLevelFilter} onValueChange={setDelayLevelFilter}>
            <SelectTrigger className="w-full sm:w-52 min-w-[160px]">
              <Clock className="h-4 w-4 ml-2" />
              <SelectValue placeholder="مستوى التأخير" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="critical">حرجة (≥5)</SelectItem>
              <SelectItem value="warning">متوسطة (3–4)</SelectItem>
              <SelectItem value="recent">حديثة ()</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground font-medium">
        عرض {filteredShipments.length} شحنة من إجمالي {delayedShipments.length}
      </div>

      {/* Cards */}
      {filteredShipments.length === 0 ? (
        <div className="bg-muted/30 rounded-xl border border-dashed p-12 text-center space-y-4">
          <SearchX className="h-14 w-14 mx-auto text-muted-foreground/60" />
          <h3 className="text-xl font-medium text-muted-foreground">
            لا توجد شحنات متأخرة مطابقة
          </h3>
          <p className="text-muted-foreground/80">
            جرب تغيير الفلاتر أو أضف بيانات جديدة
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredShipments.map((shipment) => (
            <div
              key={shipment.id}
              className={cn(
                "bg-card rounded-xl border shadow-sm p-6 transition-all hover:shadow-md",
                shipment.delayDays >= 5
                  ? "border-l-4 border-l-destructive"
                  : shipment.delayDays >= 3
                  ? "border-l-4 border-l-yellow-500"
                  : "border-l-4 border-l-blue-500"
              )}
            >
              <div className="flex flex-col sm:flex-row gap-6 sm:items-start sm:justify-between">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center flex-wrap gap-3">
                    <span className="font-bold text-xl text-primary">{shipment.id}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-sm font-medium",
                        shipment.delayDays >= 5
                          ? "bg-destructive/10 text-destructive"
                          : shipment.delayDays >= 3
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      )}
                    >
                      <Clock className="h-4 w-4" />
                      {shipment.delayDays} يوم تأخير
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg">{shipment.customer}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span dir="ltr">{shipment.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {shipment.city} • {shipment.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-right min-w-[220px]">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{shipment.reason}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">المندوب:</span> {shipment.delegate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    آخر تحديث: {shipment.lastUpdate}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t">
                <Button size="sm" variant="outline">
                  اتصال بالعميل
                </Button>
                <Button size="sm" variant="outline">
                  إعادة تعيين مندوب
                </Button>
                <Button size="sm">تحديث الحالة</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}