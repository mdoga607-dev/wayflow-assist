import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  RefreshCcw,
  Phone,
  MapPin,
  Navigation,
  Search,
  AlertCircle,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string | null;
  recipient_city: string | null;
  recipient_area: string | null;
  cod_amount: number | null;
  status: string | null;
  notes: string | null;
  product_name: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" /> },
  transit: { label: "في الطريق", color: "bg-blue-100 text-blue-800", icon: <Truck className="h-4 w-4" /> },
  delivered: { label: "تم التسليم", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> },
  delayed: { label: "متأخر", color: "bg-red-100 text-red-800", icon: <AlertCircle className="h-4 w-4" /> },
  returned: { label: "مرتجع", color: "bg-gray-100 text-gray-800", icon: <RefreshCcw className="h-4 w-4" /> },
};

const DelegateDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [returnReason, setReturnReason] = useState("");

  // Fetch delegate info
  const { data: delegate } = useQuery({
    queryKey: ["delegate-info", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("delegates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch shipments for delegate
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["delegate-shipments", delegate?.id],
    queryFn: async () => {
      if (!delegate?.id) return [];
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("delegate_id", delegate.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Shipment[];
    },
    enabled: !!delegate?.id,
  });

  // Update shipment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, return_reason }: { id: string; status: string; return_reason?: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === "returned" && return_reason) {
        updateData.return_reason = return_reason;
      }
      const { error } = await supabase.from("shipments").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegate-shipments"] });
      toast({ title: "تم تحديث حالة الشحنة بنجاح" });
      setSelectedShipment(null);
      setNewStatus("");
      setReturnReason("");
    },
    onError: (error) => {
      toast({ title: "خطأ في تحديث الحالة", description: error.message, variant: "destructive" });
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedShipment || !newStatus) return;
    updateStatusMutation.mutate({
      id: selectedShipment.id,
      status: newStatus,
      return_reason: newStatus === "returned" ? returnReason : undefined,
    });
  };

  const openStatusDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setNewStatus(shipment.status || "pending");
    setReturnReason("");
  };

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient_phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const todayShipments = shipments.filter(
    (s) => format(new Date(s.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  );
  const stats = {
    total: shipments.length,
    today: todayShipments.length,
    pending: shipments.filter((s) => s.status === "pending" || s.status === "transit").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    totalCOD: shipments
      .filter((s) => s.status === "delivered")
      .reduce((sum, s) => sum + (s.cod_amount || 0), 0),
  };

  const openGoogleMaps = (address: string, city: string | null) => {
    const query = encodeURIComponent(`${address}, ${city || ""}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const callPhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  if (!delegate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <Truck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">لوحة تحكم المندوب</h2>
            <p className="text-muted-foreground">
              يجب ربط حسابك بمندوب للوصول لهذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Welcome Header */}
      <div className="bg-gradient-to-l from-primary/10 to-primary/5 rounded-xl p-4">
        <h1 className="text-xl font-bold">مرحباً، {delegate.name}</h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}
        </p>
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">للتوصيل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">تم التسليم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">{stats.today}</p>
            <p className="text-xs text-muted-foreground">شحنات اليوم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="h-6 w-6 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-bold">{stats.totalCOD.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">تحصيلات (ج.م)</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="transit">في الطريق</SelectItem>
            <SelectItem value="delivered">تم التسليم</SelectItem>
            <SelectItem value="delayed">متأخر</SelectItem>
            <SelectItem value="returned">مرتجع</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shipments List - Mobile Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent" />
          </div>
        ) : filteredShipments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              لا توجد شحنات
            </CardContent>
          </Card>
        ) : (
          filteredShipments.map((shipment) => (
            <Card key={shipment.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Status Bar */}
                <div className={`px-4 py-2 flex items-center justify-between ${statusConfig[shipment.status || "pending"].color}`}>
                  <div className="flex items-center gap-2">
                    {statusConfig[shipment.status || "pending"].icon}
                    <span className="font-medium text-sm">
                      {statusConfig[shipment.status || "pending"].label}
                    </span>
                  </div>
                  <span className="font-mono text-xs">{shipment.tracking_number}</span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Recipient Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold">{shipment.recipient_name}</p>
                      <p className="text-sm text-muted-foreground">{shipment.product_name}</p>
                    </div>
                    {shipment.cod_amount ? (
                      <Badge variant="outline" className="text-lg font-bold">
                        {shipment.cod_amount} ج.م
                      </Badge>
                    ) : (
                      <Badge variant="secondary">مدفوع</Badge>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">
                      {shipment.recipient_address}
                      {shipment.recipient_area && ` - ${shipment.recipient_area}`}
                      {shipment.recipient_city && ` - ${shipment.recipient_city}`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => callPhone(shipment.recipient_phone)}
                    >
                      <Phone className="h-4 w-4 ml-1" />
                      اتصال
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openGoogleMaps(shipment.recipient_address || "", shipment.recipient_city)}
                    >
                      <Navigation className="h-4 w-4 ml-1" />
                      الخريطة
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => openStatusDialog(shipment)}
                    >
                      تحديث
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={!!selectedShipment} onOpenChange={(open) => !open && setSelectedShipment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة الشحنة</DialogTitle>
          </DialogHeader>
          
          {selectedShipment && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-mono text-sm">{selectedShipment.tracking_number}</p>
                <p className="font-medium">{selectedShipment.recipient_name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الحالة الجديدة</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="transit">في الطريق</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                    <SelectItem value="delayed">متأخر</SelectItem>
                    <SelectItem value="returned">مرتجع</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === "returned" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">سبب الإرجاع</label>
                  <Textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="أدخل سبب إرجاع الشحنة..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedShipment(null)}>
              إلغاء
            </Button>
            <Button onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "جاري التحديث..." : "تحديث الحالة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DelegateDashboard;
