import { useParams } from "react-router-dom";
import { useState } from "react";
import { MapPin, Phone, Truck, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const DelegateDetails = () => {
  const { id } = useParams();
  const [delegate] = useState({
    id: parseInt(id || "1"),
    name: "أحمد محمد",
    phone: "0512345678",
    email: "ahmed@example.com",
    city: "الرياض",
    rating: 4.8,
    totalShipments: 245,
    completedShipments: 230,
    activeShipments: 5,
    status: "active",
    joinDate: "2023-06-15",
    vehicle: "تويوتا كورولا - أبيض",
    licensePlate: "ABC 123"
  });

  const currentShipments = [
    { id: "SHP-001", customer: "محمد أحمد", address: "حي النخيل", status: "in_transit" },
    { id: "SHP-002", customer: "فاطمة علي", address: "حي الروضة", status: "delivered" },
    { id: "SHP-003", customer: "عبدالله سعيد", address: "حي الفيصلية", status: "pending" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تفاصيل المندوب</h1>
        <p className="text-muted-foreground">معلومات شاملة عن المندوب {delegate.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Delegate Info */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-20 h-20 mx-auto mb-4">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg">{delegate.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <CardTitle>{delegate.name}</CardTitle>
            <Badge variant={delegate.status === "active" ? "default" : "secondary"}>
              {delegate.status === "active" ? "نشط" : "غير نشط"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{delegate.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{delegate.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">{delegate.rating} تقييم</span>
            </div>
            <div className="text-sm text-muted-foreground">
              انضم في: {delegate.joinDate}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{delegate.totalShipments}</div>
                <div className="text-sm text-muted-foreground">إجمالي الشحنات</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{delegate.completedShipments}</div>
                <div className="text-sm text-muted-foreground">مكتملة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{delegate.activeShipments}</div>
                <div className="text-sm text-muted-foreground">نشطة</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>معدل الإنجاز</span>
                <span>{Math.round((delegate.completedShipments / delegate.totalShipments) * 100)}%</span>
              </div>
              <Progress value={(delegate.completedShipments / delegate.totalShipments) * 100} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Shipments */}
      <Card>
        <CardHeader>
          <CardTitle>الشحنات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentShipments.map((shipment) => (
              <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{shipment.id}</div>
                    <div className="text-sm text-muted-foreground">{shipment.customer}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">{shipment.address}</div>
                  <Badge variant={
                    shipment.status === "delivered" ? "default" :
                    shipment.status === "in_transit" ? "secondary" : "outline"
                  }>
                    {shipment.status === "delivered" ? "تم التسليم" :
                     shipment.status === "in_transit" ? "قيد التوصيل" : "في الانتظار"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DelegateDetails;