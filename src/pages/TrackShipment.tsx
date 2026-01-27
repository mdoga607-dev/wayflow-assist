gimport { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { Icon } from "leaflet";
import { ArrowRight, Package, Truck, CheckCircle, Clock, MapPin, Phone, User, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  pending: "في الانتظار",
  transit: "قيد التوصيل",
  delivered: "تم التسليم",
  delayed: "متأخر",
  returned: "مرتجع",
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  transit: Truck,
  delivered: CheckCircle,
  delayed: Clock,
  returned: Package,
};

// Custom marker icons
const createIcon = (color: string) => new Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const originIcon = createIcon("blue");
const currentIcon = createIcon("green");
const destinationIcon = createIcon("red");

interface ShipmentData {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_city: string | null;
  recipient_address: string | null;
  status: string | null;
  cod_amount: number | null;
  created_at: string;
  current_lat: number | null;
  current_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  product_name: string | null;
  notes: string | null;
}

const TrackShipment = () => {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipment = async () => {
      if (!trackingNumber) {
        setError("رقم التتبع غير صالح");
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("shipments")
        .select("*")
        .eq("tracking_number", trackingNumber)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching shipment:", fetchError);
        setError("خطأ في جلب بيانات الشحنة");
      } else if (!data) {
        setError("الشحنة غير موجودة");
      } else {
        setShipment(data);
      }
      setIsLoading(false);
    };

    fetchShipment();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`shipment-${trackingNumber}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shipments",
          filter: `tracking_number=eq.${trackingNumber}`,
        },
        (payload) => {
          setShipment(payload.new as ShipmentData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackingNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{error || "الشحنة غير موجودة"}</h1>
        <p className="text-muted-foreground">تحقق من رقم التتبع وحاول مرة أخرى</p>
        <Button onClick={() => navigate(-1)}>العودة</Button>
      </div>
    );
  }

  const StatusIcon = statusIcons[shipment.status || "pending"];

  // Default coordinates for Saudi Arabia (Riyadh)
  const defaultCenter: [number, number] = [24.7136, 46.6753];
  const origin: [number, number] = [24.7136, 46.6753]; // Warehouse location
  const current: [number, number] = shipment.current_lat && shipment.current_lng 
    ? [shipment.current_lat, shipment.current_lng] 
    : origin;
  const destination: [number, number] = shipment.destination_lat && shipment.destination_lng 
    ? [shipment.destination_lat, shipment.destination_lng] 
    : [24.7500, 46.7200];

  const mapCenter = shipment.current_lat && shipment.current_lng ? current : defaultCenter;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تتبع الشحنة</h1>
          <p className="text-muted-foreground">رقم التتبع: {shipment.tracking_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              حالة الشحنة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              className={cn(
                "text-lg px-4 py-2",
                shipment.status === "delivered" && "bg-green-500",
                shipment.status === "transit" && "bg-blue-500",
                shipment.status === "pending" && "bg-yellow-500",
                shipment.status === "delayed" && "bg-red-500",
                shipment.status === "returned" && "bg-gray-500"
              )}
            >
              {statusLabels[shipment.status || "pending"]}
            </Badge>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">المستلم</p>
                  <p className="font-medium">{shipment.recipient_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium" dir="ltr">{shipment.recipient_phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">{shipment.recipient_city}</p>
                  <p className="text-sm text-muted-foreground">{shipment.recipient_address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium">{new Date(shipment.created_at).toLocaleDateString("ar-SA")}</p>
                </div>
              </div>

              {shipment.cod_amount && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">المبلغ المستحق</p>
                  <p className="text-2xl font-bold text-primary">{shipment.cod_amount} ر.س</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              موقع الشحنة على الخريطة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] rounded-b-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Origin marker */}
                <Marker position={origin} icon={originIcon}>
                  <Popup>نقطة الانطلاق (المستودع)</Popup>
                </Marker>

                {/* Current location marker */}
                {shipment.current_lat && shipment.current_lng && (
                  <Marker position={current} icon={currentIcon}>
                    <Popup>الموقع الحالي للشحنة</Popup>
                  </Marker>
                )}

                {/* Destination marker */}
                <Marker position={destination} icon={destinationIcon}>
                  <Popup>وجهة التسليم: {shipment.recipient_address || shipment.recipient_city}</Popup>
                </Marker>

                {/* Route line */}
                <Polyline
                  positions={[origin, current, destination]}
                  color="#3b82f6"
                  weight={3}
                  opacity={0.7}
                  dashArray="10, 10"
                />
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل تتبع الشحنة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-6">
              <TimelineItem
                icon={Package}
                title="تم استلام الشحنة"
                description="تم استلام الشحنة في المستودع"
                time={new Date(shipment.created_at).toLocaleString("ar-SA")}
                isActive={true}
              />
              
              {shipment.status !== "pending" && (
                <TimelineItem
                  icon={Truck}
                  title="خرجت للتوصيل"
                  description="الشحنة في الطريق إليك"
                  time="قيد التوصيل"
                  isActive={shipment.status === "transit" || shipment.status === "delivered"}
                />
              )}
              
              {shipment.status === "delivered" && (
                <TimelineItem
                  icon={CheckCircle}
                  title="تم التسليم"
                  description="تم تسليم الشحنة بنجاح"
                  time="تم التسليم"
                  isActive={true}
                  isCompleted={true}
                />
              )}
              
              {shipment.status === "delayed" && (
                <TimelineItem
                  icon={Clock}
                  title="تأخر في التسليم"
                  description="الشحنة متأخرة عن موعد التسليم المتوقع"
                  time="متأخر"
                  isActive={true}
                  isWarning={true}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface TimelineItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
  isActive: boolean;
  isCompleted?: boolean;
  isWarning?: boolean;
}

const TimelineItem = ({ icon: Icon, title, description, time, isActive, isCompleted, isWarning }: TimelineItemProps) => (
  <div className="relative pr-12">
    <div 
      className={cn(
        "absolute right-2 w-5 h-5 rounded-full flex items-center justify-center z-10",
        isCompleted ? "bg-green-500" : isWarning ? "bg-yellow-500" : isActive ? "bg-primary" : "bg-muted"
      )}
    >
      <Icon className="h-3 w-3 text-white" />
    </div>
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    </div>
  </div>
);

export default TrackShipment;
