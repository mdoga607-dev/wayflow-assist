/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DelegateShipments.tsx
import { useState, useEffect } from "react";
import { User, Package, CheckCircle, Clock, TrendingUp, Phone, MapPin, Filter, Eye, RefreshCcw, AlertCircle, PieChart as PieChartIconLucide, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from "lucide-react";

interface Delegate {
  id: string;
  name: string;
  phone: string;
  city: string;
  avatar: string;
  balance: number;
  commission_due: number;
  stats: {
    total: number;
    delivered: number;
    pending: number;
    delayed: number;
  };
  shipments: {
    id: string;
    customer: string;
    city: string;
    status: string;
    amount: number;
    tracking_number: string;
    recipient_address: string;
    created_at: string;
  }[];
}

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_city: string;
  recipient_area: string;
  recipient_address: string;
  status: string;
  cod_amount: number | null;
  created_at: string;
  delegate_id: string;
}

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "فى الطريق",
  pending: "منتظر",
  delayed: "متأخر",
  returned: "مرتجع",
};

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-800",
  transit: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  delayed: "bg-red-100 text-red-800",
  returned: "bg-purple-100 text-purple-800",
};

const DelegateShipments = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [selectedDelegateId, setSelectedDelegateId] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);

  // اشتقاق المندوب المحدد من المعرف
  const selectedDelegate = selectedDelegateId 
    ? delegates.find(d => d.id === selectedDelegateId) || null 
    : null;

  // جلب بيانات المناديب من قاعدة البيانات
  useEffect(() => {
    if (authLoading) return;

    const fetchDelegates = async () => {
      try {
        setLoading(true);
        
        const { data: delegatesData, error: delegatesError } = await supabase
          .from('delegates')
          .select(`
            id,
            name,
            phone,
            city,
            avatar_url,
            status,
            balance,
            commission_due,
            total_delivered,
            total_delayed,
            total_returned
          `)
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (delegatesError) throw delegatesError;

        const processedDelegates = delegatesData.map(delegate => {
          const total = (delegate.total_delivered || 0) + (delegate.total_delayed || 0) + (delegate.total_returned || 0);
          return {
            id: delegate.id,
            name: delegate.name,
            phone: delegate.phone || 'مش متاح',
            city: delegate.city || 'مش محدد',
            avatar: delegate.name.charAt(0).toUpperCase() || 'م',
            balance: delegate.balance || 0,
            commission_due: delegate.commission_due || 0,
            stats: {
              total: total || 0,
              delivered: delegate.total_delivered || 0,
              pending: Math.max(0, total - (delegate.total_delivered || 0) - (delegate.total_delayed || 0) - (delegate.total_returned || 0)),
              delayed: delegate.total_delayed || 0,
            },
            shipments: []
          };
        });

        setDelegates(processedDelegates);
        
        if (processedDelegates.length > 0) {
          setSelectedDelegateId(processedDelegates[0].id);
          fetchDelegateShipments(processedDelegates[0].id);
        }
      } catch (err) {
        console.error('خطأ في جلب بيانات المناديب:', err);
        setError('فشل تحميل بيانات المناديب. يرجى المحاولة مرة تانية.');
        toast({
          title: "خطأ",
          description: "فشل تحميل بيانات المناديب",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDelegates();
  }, [authLoading]);

  // جلب شحنات المندوب المحدد
  const fetchDelegateShipments = async (delegateId: string) => {
    try {
      setShipmentsLoading(true);
      
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select(`
          id,
          tracking_number,
          recipient_name,
          recipient_phone,
          recipient_city,
          recipient_area,
          recipient_address,
          status,
          cod_amount,
          created_at
        `)
        .eq('delegate_id', delegateId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (shipmentsError) throw shipmentsError;

      const newShipments = shipmentsData.map(s => ({
        id: s.id,
        customer: s.recipient_name || 'مش معروف',
        city: s.recipient_city || 'مش محدد',
        status: s.status || 'pending',
        amount: s.cod_amount || 0,
        tracking_number: s.tracking_number || '---',
        recipient_address: s.recipient_address || 'مش محدد',
        created_at: s.created_at
      }));

      setDelegates(prev => prev.map(delegate => 
        delegate.id === delegateId 
          ? { ...delegate, shipments: newShipments }
          : delegate
      ));
    } catch (err) {
      console.error('خطأ في جلب شحنات المندوب:', err);
      toast({
        title: "خطأ",
        description: "فشل تحميل شحنات المندوب",
        variant: "destructive",
      });
    } finally {
      setShipmentsLoading(false);
    }
  };

  // الحصول على المحافظات الفريدة من المناديب
  const cities = [...new Set(delegates.map(d => d.city).filter(Boolean))];
  
  // تصفية المناديب حسب المدينة
  const filteredDelegates = delegates.filter((d) => 
    cityFilter === "all" || d.city === cityFilter
  );

  // بيانات المخطط البياني
  const chartData = selectedDelegate ? [
    { name: "تم التسليم", value: selectedDelegate.stats.delivered, color: "hsl(145, 65%, 42%)" },
    { name: "فى الطريق", value: selectedDelegate.stats.pending, color: "hsl(210, 90%, 55%)" },
    { name: "متأخر", value: selectedDelegate.stats.delayed, color: "hsl(0, 84%, 60%)" },
  ].filter(item => item.value > 0) : [];

  // حساب النسب
  const deliveryRate = selectedDelegate && selectedDelegate.stats.total > 0
    ? Math.round((selectedDelegate.stats.delivered / selectedDelegate.stats.total) * 100)
    : 0;

  const delayRate = selectedDelegate && selectedDelegate.stats.total > 0
    ? Math.round((selectedDelegate.stats.delayed / selectedDelegate.stats.total) * 100)
    : 0;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8 bg-card rounded-xl shadow-lg border border-border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">جاري تحميل بيانات المناديب...</p>
          <p className="text-sm text-muted-foreground mt-1">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2 justify-center">
              <AlertCircle className="h-6 w-6" />
              خطأ في التحميل
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-6 text-lg max-w-2xl mx-auto">{error}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="destructive"
                className="gap-2 px-6 py-3"
              >
                <RefreshCcw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
              <Button 
                onClick={() => navigate('/app/delegates')} 
                variant="outline"
                className="gap-2 px-6 py-3"
              >
                <User className="h-4 w-4" />
                إدارة المناديب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (delegates.length === 0) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto border-dashed border-2 border-border">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl mb-3">مفيش مناديب نشطين</CardTitle>
            <CardDescription className="max-w-md mx-auto text-balance">
              مفيش مناديب نشطين في النظام حالياً. يرجى إضافة مناديب جدد من صفحة إدارة المناديب.
            </CardDescription>
            <div className="mt-8">
              <Button 
                onClick={() => navigate('/app/delegates')} 
                size="lg"
                className="gap-2 px-8 py-4 text-lg"
              >
                <User className="h-5 w-5" />
                الذهاب إلى إدارة المناديب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-foreground">
            <TruckIcon className="h-9 w-9 text-primary" />
            شحنات المندوبين
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            عرض وإدارة شحنات كل مندوب في النظام ({delegates.length} مندوب نشط)
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => navigate('/app/delegates')} className="gap-2 h-12 px-6 text-base">
            <User className="h-5 w-5" />
            إدارة المناديب
          </Button>
          <Button onClick={() => navigate('/app/shipments/add')} className="gap-2 bg-primary hover:bg-primary/90 h-12 px-6 text-base">
            <Package className="h-5 w-5" />
            إضافة شحنة جديدة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* قائمة المناديب - عمود أيسر */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl shadow-lg border-border/50 h-full flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/50 bg-muted/30 px-6 py-4">
              <CardTitle className="text-xl font-semibold text-foreground">المندوبين</CardTitle>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[160px] h-10 text-base">
                  <MapPin className="h-4 w-4 ml-2 text-muted-foreground flex-shrink-0" />
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المحافظات</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={`city-${city}`} value={city} className="cursor-pointer text-base py-2">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden pt-4 px-0">
              <div className="h-full overflow-y-auto px-4 pb-4 custom-scrollbar">
                <div className="space-y-3">
                  {filteredDelegates.map((delegate) => (
                    <button
                      key={delegate.id}
                      onClick={() => {
                        setSelectedDelegateId(delegate.id);
                        fetchDelegateShipments(delegate.id);
                      }}
                      className={cn(
                        "w-full p-4 rounded-xl text-right transition-all duration-200 flex items-center gap-4 hover:bg-muted/50 border border-transparent hover:shadow-md",
                        selectedDelegateId === delegate.id
                          ? "bg-primary/10 border-primary/30 shadow-md"
                          : "hover:border-border/50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 border-2",
                        selectedDelegateId === delegate.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-primary/10 text-primary border-primary/20"
                      )}>
                        {delegate.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg truncate text-foreground">{delegate.name}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className={cn(
                            "text-sm truncate",
                            selectedDelegateId === delegate.id
                              ? "text-primary font-medium"
                              : "text-muted-foreground"
                          )}>
                            <MapPin className="h-4 w-4 inline-block mr-1.5 align-middle" />
                            {delegate.city} • {delegate.stats.total} شحنة
                          </p>
                          <Badge 
                            variant={delegate.stats.delivered > 0 ? "default" : "secondary"}
                            className={cn(
                              "px-3 py-1 text-xs h-6 font-medium",
                              delegate.stats.delivered > delegate.stats.total * 0.8 && "bg-green-600 hover:bg-green-600"
                            )}
                          >
                            {delegate.stats.delivered} مُسلّم
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredDelegates.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MapPin className="h-10 w-10 mx-auto mb-4 opacity-50" />
                      <p className="font-medium text-lg">مفيش مناديب في المحافظة دي</p>
                      <p className="text-base mt-2">جرب اختيار محافظة تانية</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* معلومات المندوب والإحصائيات - عمود أيمن */}
        <div className="lg:col-span-3 space-y-8">
          {/* رأس الصفحة - معلومات المندوب */}
          <Card className="rounded-2xl shadow-lg border-border/50 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex items-start gap-5 md:gap-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center text-3xl md:text-4xl font-bold text-primary-foreground border-2 border-primary/20 shadow-md flex-shrink-0">
                    {selectedDelegate?.avatar}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {selectedDelegate?.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-base">
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                        <span dir="ltr" className="font-mono font-medium">{selectedDelegate?.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium">{selectedDelegate?.city}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                        <Package className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">إجمالى الشحنات: {selectedDelegate?.stats.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-end justify-center text-center md:text-right w-full md:w-auto mt-6 md:mt-0">
                  <div className="flex items-end gap-3 mb-3">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <span className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {deliveryRate}%
                    </span>
                  </div>
                  <p className="text-base font-medium text-muted-foreground mb-3">معدل التسليم الناجح</p>
                  <div className="w-full max-w-[240px]">
                    <Progress value={deliveryRate} className="h-3 rounded-full bg-primary/10" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={<Package className="h-7 w-7 text-primary" />}
              label="إجمالى الشحنات" 
              value={selectedDelegate?.stats.total.toString() || "0"} 
              color="text-primary"
              bgColor="bg-primary/10"
            />
            <StatCard 
              icon={<CheckCircle className="h-7 w-7 text-green-600" />}
              label="تم التسليم" 
              value={selectedDelegate?.stats.delivered.toString() || "0"} 
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard 
              icon={<TruckIcon className="h-7 w-7 text-blue-600" />}
              label="فى الطريق" 
              value={selectedDelegate?.stats.pending.toString() || "0"} 
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatCard 
              icon={<Clock className="h-7 w-7 text-red-600" />}
              label="متأخرة" 
              value={selectedDelegate?.stats.delayed.toString() || "0"} 
              color="text-red-600"
              bgColor="bg-red-100"
            />
          </div>

          {/* المخططات البيانية */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* مخطط توزيع الشحنات */}
            <Card className="rounded-2xl shadow-lg border-border/50 h-full flex flex-col overflow-hidden">
              <CardHeader className="pb-6 border-b border-border/50 bg-muted/30 px-6 py-4">
                <CardTitle className="flex items-center gap-2.5 text-xl font-semibold text-foreground">
                  <PieChartIconLucide className="h-6 w-6 text-primary" />
                  توزيع الشحنات حسب الحالة
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-2">
                  نسب الشحنات حسب حالة التوصيل للمندوب المحدد
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pt-6 px-6 pb-6">
                <div className="h-full min-h-[320px] flex items-center justify-center">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart width={400} height={400}>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={3}
                          dataKey="value"
                          labelLine={false}
                        >
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              stroke="hsl(var(--background))"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "10px",
                            direction: "rtl",
                            fontSize: "14px",
                            padding: "10px"
                          }}
                          formatter={(value: number) => [`${value.toLocaleString()} شحنة`, "العدد"]}
                          labelFormatter={(label) => label}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-muted-foreground p-6">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium text-xl">مفيش شحنات لعرضها</p>
                      <p className="text-base mt-2">المندوب ماعندوش شحنات حالية</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                  {chartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2.5 text-base">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* أداء المندوب */}
            <Card className="rounded-2xl shadow-lg border-border/50 h-full flex flex-col overflow-hidden">
              <CardHeader className="pb-6 border-b border-border/50 bg-muted/30 px-6 py-4">
                <CardTitle className="flex items-center gap-2.5 text-xl font-semibold text-foreground">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  أداء المندوب
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-2">
                  مؤشرات الأداء الرئيسية للمندوب المحدد
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pt-6 px-6 pb-6 space-y-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-base font-medium mb-2.5">
                      <span className="text-foreground">نسبة التسليم الناجح</span>
                      <span className="font-bold text-green-600">{deliveryRate}%</span>
                    </div>
                    <Progress 
                      value={deliveryRate} 
                      className="h-3 rounded-full bg-green-100"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-base font-medium mb-2.5">
                      <span className="text-foreground">نسبة التأخير</span>
                      <span className="font-bold text-red-600">{delayRate}%</span>
                    </div>
                    <Progress 
                      value={delayRate}
                      className="h-3 rounded-full bg-red-100"
                    />
                  </div>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl border border-blue-200 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <WalletIcon className="h-6 w-6 text-primary" />
                      <span className="text-lg font-semibold text-foreground">الرصيد المستحق</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {selectedDelegate?.balance?.toLocaleString() || '0'} <span className="text-lg">ج.م</span>
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-3 text-right">
                    يشمل عمولات الشحنات المسلمة خلال الأسبوع الماضي
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* جدول الشحنات */}
          <Card className="rounded-2xl shadow-lg border-border/50 overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 px-6 py-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold text-foreground">أحدث الشحنات</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    آخر 10 شحنات تم تعيينها لهذا المندوب
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => selectedDelegate && navigate(`/app/delegate/${selectedDelegate.id}`)}
                  className="gap-2 h-12 px-6 text-base"
                  disabled={!selectedDelegate}
                >
                  <Eye className="h-5 w-5" />
                  عرض التفاصيل الكاملة
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {shipmentsLoading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-muted/30">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
                  <p className="text-xl font-medium text-foreground">جاري تحميل الشحنات...</p>
                </div>
              ) : selectedDelegate?.shipments && selectedDelegate.shipments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-right w-[150px] px-6 py-4 font-medium text-lg">رقم الشحنة</TableHead>
                        <TableHead className="text-right w-[200px] px-6 py-4 font-medium text-lg">العميل</TableHead>
                        <TableHead className="text-right min-w-[250px] px-6 py-4 font-medium text-lg">العنوان</TableHead>
                        <TableHead className="text-right w-[120px] px-6 py-4 font-medium text-lg">الحالة</TableHead>
                        <TableHead className="text-right w-[120px] px-6 py-4 font-medium text-lg">المبلغ</TableHead>
                        <TableHead className="text-right w-[150px] px-6 py-4 font-medium text-lg">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDelegate.shipments.map((shipment) => (
                        <TableRow 
                          key={shipment.id}
                          className="hover:bg-muted/40 transition-colors cursor-pointer border-b border-border/50"
                          onClick={() => navigate(`/app/shipments/${shipment.id}`)}
                        >
                          <TableCell className="px-6 py-4 font-mono font-medium text-primary text-lg">{shipment.tracking_number}</TableCell>
                          <TableCell className="px-6 py-4 font-medium text-foreground text-lg">{shipment.customer}</TableCell>
                          <TableCell className="px-6 py-4 text-base text-muted-foreground max-w-[300px] truncate">
                            {shipment.recipient_address}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge variant="outline" className={cn(
                              "px-3 py-1.5 text-base font-medium rounded-full whitespace-nowrap",
                              statusColors[shipment.status] || "bg-gray-100 text-gray-800"
                            )}>
                              {statusLabels[shipment.status] || "مش معروف"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 font-bold text-green-600 text-lg">{shipment.amount.toLocaleString()} ج.م</TableCell>
                          <TableCell className="px-6 py-4 text-base text-muted-foreground font-medium">
                            {format(new Date(shipment.created_at), 'dd/MM HH:mm', { locale: ar })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground bg-muted/30">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-medium mb-3">مفيش شحنات لهذا المندوب</p>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                    يمكن إضافة شحنات جديدة من خلال صفحة إضافة شحنة. المندوب هيبدأ يستقبل شحنات فور إضافته للنظام.
                  </p>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="gap-2 px-8 py-5 text-lg"
                    onClick={() => navigate('/app/shipments/add')}
                  >
                    <Package className="h-5 w-5" />
                    إضافة شحنة جديدة
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// مكون بطاقات الإحصائيات
const StatCard = ({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) => (
  <Card className="rounded-xl shadow-sm border-border hover:shadow-md transition-shadow">
    <CardContent className="p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base text-muted-foreground mb-1.5 font-medium">{label}</p>
          <p className={cn("text-3xl font-bold", color)}>{value}</p>
        </div>
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", bgColor)}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// أيقونة الشاحنة المخصصة
const TruckIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <rect x="3" y="11" width="18" height="8" rx="2" />
    <path d="M7 11V7a3 3 0 0 1 6 0v4" />
    <path d="M17 11V7a3 3 0 0 1 6 0v4" />
  </svg>
);

export default DelegateShipments;