import { useState } from "react";
import { Truck, MapPin, Building, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PickupRequests = () => {
  // Mock data for pickup requests
  const pickupRequests = [
    {
      id: "PR-001",
      shipper: "شركة النخيل التجارية",
      branch: "فرع الرياض",
      city: "الرياض",
      address: "حي النخيل، شارع العليا",
      phone: "0112345678",
      status: "pending",
      requestedDate: "2024-01-26",
      items: 5
    },
    {
      id: "PR-002",
      shipper: "مؤسسة الجودة",
      branch: "فرع جدة",
      city: "جدة",
      address: "حي الروضة، شارع الملك فهد",
      phone: "0123456789",
      status: "assigned",
      requestedDate: "2024-01-25",
      items: 3
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلبات الاستلام</h1>
        <p className="text-muted-foreground">إدارة طلبات استلام الشحنات من التجار</p>
      </div>

      <div className="space-y-4">
        {pickupRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{request.id}</CardTitle>
                <Badge variant={request.status === "pending" ? "secondary" : "default"}>
                  {request.status === "pending" ? "في الانتظار" : "مُسند"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">التاجر:</span> {request.shipper}
                </div>
                <div>
                  <span className="font-medium">الفرع:</span> {request.branch}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{request.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{request.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{request.phone}</span>
                </div>
                <div>
                  <span className="font-medium">عدد القطع:</span> {request.items}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>تاريخ الطلب: {request.requestedDate}</span>
              </div>
              <div className="flex gap-2">
                {request.status === "pending" && (
                  <Button size="sm">
                    تعيين مندوب
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  عرض التفاصيل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PickupRequests;