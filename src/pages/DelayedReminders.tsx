import { useState } from "react";
import { Bell, Clock, AlertTriangle, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // ← افترض إنك مستخدم shadcn/ui calendar
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const DelayedReminders = () => {
  const [date, setDate] = useState(new Date());

  // Mock data for delayed shipments
  const delayedShipments = [
    {
      id: "SHP-001",
      customer: "محمد أحمد",
      phone: "0512345678",
      city: "الرياض",
      delayDays: 2,
      delegate: "أحمد محمد",
      lastUpdate: "2024-01-24",
    },
    {
      id: "SHP-004",
      customer: "نورة خالد",
      phone: "0545678901",
      city: "مكة",
      delayDays: 3,
      delegate: "محمد علي",
      lastUpdate: "2024-01-23",
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* العنوان */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">تذكيرات الشحنات المتأخرة</h1>
        <p className="text-muted-foreground mt-1">
          تذكيرات للشحنات المتأخرة وإشعارات التأخير
        </p>
      </div>

      {/* التقويم في الأعلى */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            التقويم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ar}
              className="rounded-md border shadow-sm"
            />
            <div className="text-sm space-y-2">
              <p>
                التاريخ المختار:{" "}
                <span className="font-medium">
                  {format(date, "PPPP", { locale: ar })}
                </span>
              </p>
              <p className="text-muted-foreground">
                يمكنك استخدام التاريخ لتصفية الشحنات أو عرض مواعيد محددة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الشحنات المتأخرة */}
      <div className="space-y-4">
        {delayedShipments.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-muted-foreground">لا توجد شحنات متأخرة حالياً</p>
          </Card>
        ) : (
          delayedShipments.map((shipment) => (
            <Card
              key={shipment.id}
              className="border-destructive/30 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    شحنة {shipment.id}
                  </CardTitle>
                  <Badge variant="destructive" className="text-base px-3 py-1">
                    متأخر {shipment.delayDays} أيام
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium block">العميل</span>
                    {shipment.customer}
                  </div>
                  <div>
                    <span className="font-medium block">الهاتف</span>
                    {shipment.phone}
                  </div>
                  <div>
                    <span className="font-medium block">المدينة</span>
                    {shipment.city}
                  </div>
                  <div>
                    <span className="font-medium block">المندوب</span>
                    {shipment.delegate}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>آخر تحديث: {shipment.lastUpdate}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Bell className="h-4 w-4 ml-1.5" />
                    إرسال تذكير
                  </Button>
                  <Button size="sm">
                    تحديث الحالة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DelayedReminders;