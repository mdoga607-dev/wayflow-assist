import { useState } from "react";
import { MapPin, Truck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TrackDelegates = () => {
  // Static data for delegates (يمكنك تعديلها يدويًا هنا)
  const delegates = [
    {
      id: 1,
      name: "أحمد محمد", // أدخل الاسم هنا
      status: "active", // أدخل الحالة هنا (active أو inactive)
      currentLocation: "الرياض، حي النخيل", // أدخل الموقع هنا
      shipments: 5, // أدخل عدد الشحنات هنا
      lastUpdate: "2024-01-26 14:30" // أدخل آخر تحديث هنا
    },
    {
      id: 2,
      name: "محمد علي", // أدخل الاسم هنا
      status: "active",
      currentLocation: "جدة، حي الروضة",
      shipments: 3,
      lastUpdate: "2024-01-26 13:45"
    },
    {
      id: 3,
      name: "خالد سعد",
      status: "inactive",
      currentLocation: "الدمام، حي الفيصلية",
      shipments: 0,
      lastUpdate: "2024-01-25 16:20"
    }
    // }
  ];

  return (
    <div className="space-y-6 w-full"> {/* جعلت الـ div الرئيسي full width */}
      <div className="w-full"> {/* الـ header يأخذ كامل المساحة */}
        <h1 className="text-2xl font-bold">تتبع المناديب</h1>
        <p className="text-muted-foreground">تتبع موقع وحالة المناديب في الوقت الفعلي</p>
      </div>

      <div className="grid gap-4 grid-cols-1 w-full"> {/* عرض البيانات full width، عمود واحد ليكون كامل العرض */}
        {delegates.map((delegate) => (
          <Card key={delegate.id} className="hover:shadow-lg transition-shadow w-full"> {/* كل بطاقة full width */}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{delegate.name}</CardTitle>
                <Badge variant={delegate.status === "active" ? "default" : "secondary"}>
                  {delegate.status === "active" ? "نشط" : "غير نشط"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{delegate.currentLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>{delegate.shipments} شحنات</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>آخر تحديث: {delegate.lastUpdate}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrackDelegates;