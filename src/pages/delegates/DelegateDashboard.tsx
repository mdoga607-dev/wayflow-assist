// src/pages/DelegateDashboard.tsx
import { useState, useEffect } from "react";
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
  Loader2,
  AlertTriangle,
  X,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  return_reason?: string | null;
}

// ✅ التصحيح: استخدام لهجة مصرية حقيقية في حالة الشحنات
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "منتظر", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4 text-yellow-600" /> },
  transit: { label: "فى الطريق", color: "bg-blue-100 text-blue-800", icon: <Truck className="h-4 w-4 text-blue-600" /> },
  delivered: { label: "تم التسليم", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
  delayed: { label: "متأخر", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
  returned: { label: "مرتجع", color: "bg-gray-100 text-gray-800", icon: <RefreshCcw className="h-4 w-4 text-gray-600" /> },
};

const DelegateDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [returnReason, setReturnReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // جلب معلومات المندوب
  const { data: delegate, isLoading: delegateLoading } = useQuery({
    queryKey: ["delegate-info", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("مفيش مستخدم");
      
      // ✅ التصحيح: جلب البيانات بدون أعمدة غير موجودة
      const { data, error } = await supabase
        .from("delegates")
        .select("id, name, phone, city, branch, status, total_delivered, total_delayed, total_returned, balance, commission_due, created_at")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error || !data) throw new Error("مفيش مندوب مرتبط بحسابك");
      return data;
    },
    enabled: !!user?.id,
    retry: 1,
  });

  // جلب شحنات المندوب
  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ["delegate-shipments", delegate?.id],
    queryFn: async () => {
      if (!delegate?.id) return [];
      
      // ✅ التصحيح: جلب الشحنات بدون أعمدة غير موجودة
      const { data, error } = await supabase
        .from("shipments")
        .select(`
          id,
          tracking_number,
          recipient_name,
          recipient_phone,
          recipient_address,
          recipient_city,
          recipient_area,
          cod_amount,
          status,
          notes,
          product_name,
          created_at,
          return_reason
        `)
        .eq("delegate_id", delegate.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Shipment[];
    },
    enabled: !!delegate?.id,
    staleTime: 30000, // تحديث كل 30 ثانية
  });

  // تحديث حالة الشحنة
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, return_reason }: { id: string; status: string; return_reason?: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      // إضافة سبب الإرجاع فقط إذا كانت الشحنة مرتجعة
      if (status === "returned" && return_reason) {
        updateData.return_reason = return_reason;
      }
      
      const { error } = await supabase
        .from("shipments")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegate-shipments"] });
      toast({ 
        title: "تم التحديث", 
        description: "تم تحديث حالة الشحنة بنجاح" 
      });
      setIsDialogOpen(false);
      setSelectedShipment(null);
      setNewStatus("");
      setReturnReason("");
    },
    onError: (error) => {
      toast({ 
        title: "خطأ في التحديث", 
        description: error.message || "فشل تحديث حالة الشحنة. حاول تاني بعد شوية", 
        variant: "destructive" 
      });
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedShipment || !newStatus) return;
    
    // منع تحديث الحالة لنفس القيمة
    if (selectedShipment.status === newStatus) {
      toast({ title: "مفيش تغيير", description: "الحالة دي نفسها" });
      return;
    }
    
    updateStatusMutation.mutate({
      id: selectedShipment.id,
      status: newStatus,
      return_reason: newStatus === "returned" ? returnReason : undefined,
    });
  };

  const openStatusDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setNewStatus(shipment.status || "pending");
    setReturnReason(shipment.return_reason || "");
    setIsDialogOpen(true);
  };

  // تصفية الشحنات
  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient_phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // حساب الإحصائيات
  const today = format(new Date(), "yyyy-MM-dd");
  const todayShipments = shipments.filter(
    (s) => format(new Date(s.created_at), "yyyy-MM-dd") === today
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

  // فتح خرائط جوجل
  const openGoogleMaps = (address: string, city: string | null) => {
    const fullAddress = `${address}, ${city || ""}, مصر`;
    const query = encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  // الاتصال برقم التليفون
  const callPhone = (phone: string) => {
    if (confirm(`هل تريد الاتصال برقم: ${phone}`)) {
      window.location.href = `tel:${phone}`;
    }
  };

  // معالجة حالة التحميل
  if (delegateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">جاري تحميل لوحة التحكم...</p>
          <p className="text-sm text-muted-foreground mt-1">برجاء الانتظار</p>
        </div>
      </div>
    );
  }

  // معالجة حالة عدم وجود مندوب
  if (!delegate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-destructive/20">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive mb-3">مفيش مندوب</CardTitle>
            <p className="text-muted-foreground mb-6 px-4">
              مفيش مندوب مرتبط بحسابك ده. راجع المدير عشان يضيفك في النظام.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                الرجوع للرئيسية
              </Button>
              <Button 
                onClick={() => window.location.href = 'tel:+201000000000'} 
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Phone className="h-4 w-4" />
                اتصل بالمدير
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 pb-24">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-5 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Truck className="h-7 w-7" />
                <span>أهلاً يا {delegate.name}</span>
              </h1>
              <p className="text-primary-foreground/90 mt-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}
              </p>
            </div>
            <Badge className="bg-white/20 text-white text-lg px-4 py-1.5">
              <Wallet className="h-4 w-4 ml-1.5" />
              {delegate.balance?.toLocaleString() || '0'} ج.م
            </Badge>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات - متوافقة مع الجوال */}
      <div className="max-w-7xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Card className="border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-yellow-600 mb-1.5" />
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              <p className="text-xs text-muted-foreground mt-0.5">للتوصيل</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-1.5" />
              <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
              <p className="text-xs text-muted-foreground mt-0.5">اتسلمت</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto text-blue-600 mb-1.5" />
              <p className="text-2xl font-bold text-blue-700">{stats.today}</p>
              <p className="text-xs text-muted-foreground mt-0.5">شحنات النهاردة</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Wallet className="h-6 w-6 mx-auto text-amber-600 mb-1.5" />
              <p className="text-2xl font-bold text-amber-700">{stats.totalCOD.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">تحصيلات (ج.م)</p>
            </CardContent>
          </Card>
        </div>

        {/* شريط البحث والفلاتر */}
        <div className="bg-card rounded-xl shadow-md p-3 mb-4 border border-border">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="دور على رقم الشحنة أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-background"
                dir="rtl"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 bg-background">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="pending">منتظر</SelectItem>
                <SelectItem value="transit">فى الطريق</SelectItem>
                <SelectItem value="delivered">اتسلمت</SelectItem>
                <SelectItem value="delayed">متأخر</SelectItem>
                <SelectItem value="returned">مرتجع</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* قائمة الشحنات - تصميم كروت للجوال */}
        <div className="space-y-3">
          {shipmentsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-10 w-10 border-3 border-primary rounded-full border-t-transparent" />
            </div>
          ) : filteredShipments.length === 0 ? (
            <Card className="shadow-md border-dashed">
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-1">مفيش شحنات</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'مفيش شحنات تطابق معايير البحث اللي اخترتها' 
                    : 'هتظهر الشحنات هنا لما يتم تعيينها ليك'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredShipments.map((shipment) => {
              const config = statusConfig[shipment.status || "pending"];
              return (
                <Card 
                  key={shipment.id} 
                  className="overflow-hidden shadow-md hover:shadow-lg transition-shadow border-l-4"
                  style={{ borderColor: config.color.split(' ')[0].replace('bg-', '').replace('/10', '') }}
                >
                  <CardContent className="p-0">
                    {/* شريط الحالة الملون */}
                    <div className={cn("px-4 py-3 flex items-center justify-between", config.color)}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="font-bold text-sm">{config.label}</span>
                      </div>
                      <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
                        #{shipment.tracking_number.slice(-6)}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 bg-background">
                      {/* معلومات المستلم */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg text-gray-900 truncate">{shipment.recipient_name}</p>
                            {shipment.product_name && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {shipment.product_name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span dir="ltr" className="font-mono">{shipment.recipient_phone}</span>
                          </p>
                        </div>
                        
                        {shipment.cod_amount ? (
                          <Badge className="bg-amber-100 text-amber-800 text-lg font-bold px-3.5 py-1.5 shadow">
                            {shipment.cod_amount.toLocaleString()} ج.م
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 font-bold px-3 py-1.5">
                            مدفوع
                          </Badge>
                        )}
                      </div>

                      {/* العنوان */}
                      <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-800">{shipment.recipient_address}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {shipment.recipient_area && (
                              <Badge variant="outline" className="px-2 py-0.5 text-xs">
                                {shipment.recipient_area}
                              </Badge>
                            )}
                            {shipment.recipient_city && (
                              <Badge variant="secondary" className="px-2 py-0.5 text-xs bg-blue-50">
                                {shipment.recipient_city}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* أزرار الإجراءات */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex flex-col sm:flex-row items-center gap-1.5 h-auto py-2.5"
                          onClick={() => callPhone(shipment.recipient_phone)}
                        >
                          <Phone className="h-4 w-4" />
                          <span className="text-xs sm:text-sm">اتصل</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex flex-col sm:flex-row items-center gap-1.5 h-auto py-2.5"
                          onClick={() => openGoogleMaps(shipment.recipient_address || "", shipment.recipient_city)}
                        >
                          <Navigation className="h-4 w-4" />
                          <span className="text-xs sm:text-sm">الخريطة</span>
                        </Button>
                        <Button
                          size="sm"
                          className="flex flex-col sm:flex-row items-center gap-1.5 h-auto py-2.5 bg-primary hover:bg-primary/90 text-white"
                          onClick={() => openStatusDialog(shipment)}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          <span className="text-xs sm:text-sm">حدّث</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* نافذة تحديث الحالة */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold text-gray-800 flex items-center gap-2">
              <RefreshCcw className="h-6 w-6 text-primary" />
              حدّث حالة الشحنة
            </DialogTitle>
          </DialogHeader>
          
          {selectedShipment && (
            <div className="space-y-5 py-4">
              {/* معلومات الشحنة */}
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3 pb-3 border-b">
                  <span className="text-sm text-muted-foreground">رقم الشحنة</span>
                  <span className="font-mono font-bold text-lg">#{selectedShipment.tracking_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">اسم العميل</span>
                  <span className="font-bold">{selectedShipment.recipient_name}</span>
                </div>
              </div>

              {/* اختيار الحالة الجديدة */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-primary" />
                  الحالة الجديدة
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">منتظر</SelectItem>
                    <SelectItem value="transit">فى الطريق</SelectItem>
                    <SelectItem value="delivered">اتسلمت</SelectItem>
                    <SelectItem value="delayed">متأخر</SelectItem>
                    <SelectItem value="returned">مرتجع</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* سبب الإرجاع (يظهر فقط عند اختيار مرتجع) */}
              {newStatus === "returned" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    سبب الإرجاع
                  </label>
                  <Textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="اكتب سبب إرجاع الشحنة بالتفصيل..."
                    rows={3}
                    className="resize-none bg-background"
                    dir="rtl"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ سبب الإرجاع هيظهر في تقرير المدير
                  </p>
                </div>
              )}

              {/* ملاحظة هامة */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  بعد التحديث، هتتغير حالة الشحنة فوراً ولن تقدر ترجعها. تأكد قبل التحديث.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 sm:flex-initial px-6"
              disabled={updateStatusMutation.isPending}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleStatusUpdate} 
              disabled={updateStatusMutation.isPending || !newStatus}
              className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-white px-6 gap-2"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  حدّث الحالة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* شريط تنقل ثابت في الأسفل للجوال */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-3 shadow-lg sm:hidden z-50">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-2">
          <Button 
            variant="ghost" 
            className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="h-5 w-5" />
            <span>تحديث</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
            onClick={() => setSearchQuery('')}
          >
            <Search className="h-5 w-5" />
            <span>بحث</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
            onClick={() => setStatusFilter('all')}
          >
            <Package className="h-5 w-5" />
            <span>الكل</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center gap-1 h-auto py-2 text-xs text-primary"
            onClick={() => window.location.href = '/app/profile'}
          >
            <User className="h-5 w-5" />
            <span>الملف</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DelegateDashboard;