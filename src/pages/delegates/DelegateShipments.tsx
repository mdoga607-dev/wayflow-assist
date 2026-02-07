/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DelegateShipments.tsx
import { useState, useEffect } from "react";
import { 
  User, Package, CheckCircle, Clock, TrendingUp, Phone, MapPin, 
  Filter, Eye, RefreshCcw, AlertCircle, PieChart as PieChartIcon, 
  Wallet as WalletIcon, Truck 
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
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
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

interface Delegate {
  id: string;
  name: string;
  phone: string;
  city: string;
  avatar_url: string | null; // ← استخدم avatar_url بدل avatar حرف
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
  transit: "في الطريق",
  pending: "منتظر",
  delayed: "متأخر",
  returned: "مرتجع",
};

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-800 border-green-200",
  transit: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  delayed: "bg-red-100 text-red-800 border-red-200",
  returned: "bg-purple-100 text-purple-800 border-purple-200",
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

  const selectedDelegate = selectedDelegateId 
    ? delegates.find(d => d.id === selectedDelegateId) || null 
    : null;

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
            phone: delegate.phone || 'غير متوفر',
            city: delegate.city || 'غير محدد',
            avatar_url: delegate.avatar_url,
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
      } catch (err: any) {
        console.error('خطأ في جلب المناديب:', err);
        setError(err.message || 'فشل تحميل بيانات المناديب');
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
        customer: s.recipient_name || 'غير معروف',
        city: s.recipient_city || 'غير محدد',
        status: s.status || 'pending',
        amount: s.cod_amount || 0,
        tracking_number: s.tracking_number || '---',
        recipient_address: s.recipient_address || 'غير محدد',
        created_at: s.created_at
      }));

      setDelegates(prev => prev.map(delegate => 
        delegate.id === delegateId 
          ? { ...delegate, shipments: newShipments }
          : delegate
      ));
    } catch (err: any) {
      console.error('خطأ في جلب الشحنات:', err);
      toast({
        title: "خطأ",
        description: "فشل تحميل شحنات المندوب",
        variant: "destructive",
      });
    } finally {
      setShipmentsLoading(false);
    }
  };

  const cities = [...new Set(delegates.map(d => d.city).filter(Boolean))];
  const filteredDelegates = delegates.filter(d => cityFilter === "all" || d.city === cityFilter);

  const chartData = selectedDelegate ? [
    { name: "تم التسليم", value: selectedDelegate.stats.delivered, color: "#22c55e" },
    { name: "في الطريق", value: selectedDelegate.stats.pending, color: "#3b82f6" },
    { name: "متأخر", value: selectedDelegate.stats.delayed, color: "#ef4444" },
  ].filter(item => item.value > 0) : [];

  const deliveryRate = selectedDelegate && selectedDelegate.stats.total > 0
    ? Math.round((selectedDelegate.stats.delivered / selectedDelegate.stats.total) * 100)
    : 0;

  const delayRate = selectedDelegate && selectedDelegate.stats.total > 0
    ? Math.round((selectedDelegate.stats.delayed / selectedDelegate.stats.total) * 100)
    : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full">
          <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">جاري تحميل بيانات المناديب...</h2>
          <p className="text-gray-600">يرجى الانتظار لحظات</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="w-full max-w-lg border-red-200 shadow-xl">
          <CardHeader className="text-center pb-2">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-700 font-bold">حدث خطأ</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-lg text-gray-700">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.reload()} 
                variant="destructive"
                size="lg"
                className="gap-2 px-8 py-6 text-lg"
              >
                <RefreshCcw className="h-5 w-5" />
                إعادة المحاولة
              </Button>
              <Button 
                onClick={() => navigate('/app/delegates')} 
                variant="outline"
                size="lg"
                className="gap-2 px-8 py-6 text-lg"
              >
                <User className="h-5 w-5" />
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="w-full max-w-lg border-dashed border-4 border-gray-300 shadow-xl">
          <CardContent className="py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Truck className="h-12 w-12 text-gray-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800 mb-4">لا يوجد مناديب نشطين</CardTitle>
            <CardDescription className="text-xl text-gray-600 mb-8">
              لا يوجد مناديب نشطين في النظام حاليًا. يمكنك إضافة مناديب جدد من صفحة إدارة المناديب.
            </CardDescription>
            <Button 
              onClick={() => navigate('/app/delegates')} 
              size="lg"
              className="gap-3 px-10 py-7 text-xl shadow-lg"
            >
              <User className="h-6 w-6" />
              إدارة المناديب
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-screen-2xl mx-auto space-y-10">
        {/* رأس الصفحة */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-4 text-gray-900">
              <Truck className="h-10 w-10 text-primary flex-shrink-0" />
              شحنات المندوبين
            </h1>
            <p className="text-lg text-gray-600">
              عرض ومتابعة شحنات جميع المناديب النشطين ({delegates.length} مندوب)
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/app/delegates')}
              className="gap-3 h-14 px-8 text-lg border-2"
            >
              <User className="h-5 w-5" />
              إدارة المناديب
            </Button>
            <Button 
              size="lg"
              onClick={() => navigate('/app/shipments/add')}
              className="gap-3 h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Package className="h-5 w-5" />
              إضافة شحنة جديدة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* قائمة المناديب */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <Card className="rounded-2xl shadow-xl border-gray-200 overflow-hidden h-full flex flex-col">
              <CardHeader className="px-6 py-5 bg-gray-50/80 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-900">المناديب النشطين</CardTitle>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-48 h-11 text-base border-2">
                      <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                      <SelectValue placeholder="جميع المحافظات" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <SelectItem value="all" className="text-base py-3">جميع المحافظات</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city} className="text-base py-3">{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 py-3 custom-scrollbar">
                  <div className="space-y-3">
                    {filteredDelegates.map(delegate => (
                      <button
                        key={delegate.id}
                        onClick={() => {
                          setSelectedDelegateId(delegate.id);
                          fetchDelegateShipments(delegate.id);
                        }}
                        className={cn(
                          "w-full p-5 rounded-2xl transition-all duration-200 flex items-center gap-5 border-2 hover:shadow-md",
                          selectedDelegateId === delegate.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-transparent hover:border-gray-200 bg-white"
                        )}
                      >
                        <Avatar className="h-16 w-16 border-2 border-gray-200 flex-shrink-0">
                          {delegate.avatar_url ? (
                            <AvatarImage src={delegate.avatar_url} alt={delegate.name} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                              {delegate.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-xl font-bold text-gray-900 truncate">{delegate.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-gray-600 text-base">
                              <MapPin className="h-4 w-4" />
                              {delegate.city}
                            </div>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "text-base px-3 py-1",
                                delegate.stats.delivered > delegate.stats.total * 0.75 ? "border-green-500 text-green-700" : ""
                              )}
                            >
                              {delegate.stats.delivered} / {delegate.stats.total}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    ))}

                    {filteredDelegates.length === 0 && (
                      <div className="text-center py-16 text-gray-500">
                        <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-xl font-medium">لا يوجد مناديب في هذه المحافظة</p>
                        <p className="mt-2">جرب اختيار محافظة أخرى</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* الجزء الرئيسي */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
            {selectedDelegate ? (
              <>
                {/* معلومات المندوب */}
                <Card className="rounded-2xl shadow-xl border-gray-200 overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                      <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-gray-100 shadow-xl flex-shrink-0">
                        {selectedDelegate.avatar_url ? (
                          <AvatarImage src={selectedDelegate.avatar_url} alt={selectedDelegate.name} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-5xl font-bold">
                            {selectedDelegate.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1 space-y-6">
                        <div>
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                            {selectedDelegate.name}
                          </h2>
                          <div className="flex flex-wrap gap-6 mt-5 text-gray-700 text-lg">
                            <div className="flex items-center gap-3">
                              <Phone className="h-6 w-6 text-primary" />
                              <span dir="ltr" className="font-medium">{selectedDelegate.phone}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <MapPin className="h-6 w-6 text-primary" />
                              <span className="font-medium">{selectedDelegate.city}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-6">
                          <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-center min-w-[180px]">
                            <p className="text-sm text-green-700 mb-1">معدل التسليم</p>
                            <p className="text-4xl font-bold text-green-700">{deliveryRate}%</p>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 text-center min-w-[180px]">
                            <p className="text-sm text-blue-700 mb-1">إجمالي الشحنات</p>
                            <p className="text-4xl font-bold text-blue-700">{selectedDelegate.stats.total}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* الإحصائيات */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    icon={<Package className="h-8 w-8 text-blue-600" />}
                    label="إجمالي الشحنات"
                    value={selectedDelegate.stats.total.toString()}
                    color="text-blue-700"
                    bgColor="bg-blue-50"
                  />
                  <StatCard 
                    icon={<CheckCircle className="h-8 w-8 text-green-600" />}
                    label="تم التسليم"
                    value={selectedDelegate.stats.delivered.toString()}
                    color="text-green-700"
                    bgColor="bg-green-50"
                  />
                  <StatCard 
                    icon={<Clock className="h-8 w-8 text-red-600" />}
                    label="متأخر"
                    value={selectedDelegate.stats.delayed.toString()}
                    color="text-red-700"
                    bgColor="bg-red-50"
                  />
                  <StatCard 
                    icon={<WalletIcon className="h-8 w-8 text-indigo-600" />}
                    label="الرصيد المستحق"
                    value={`${selectedDelegate.balance.toLocaleString()} ج.م`}
                    color="text-indigo-700"
                    bgColor="bg-indigo-50"
                  />
                </div>

                {/* المخططات */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="rounded-2xl shadow-xl border-gray-200">
                    <CardHeader className="pb-6 border-b bg-gray-50">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <PieChartIcon className="h-6 w-6 text-primary" />
                        توزيع حالات الشحنات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                      <div className="h-96">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white',
                                  borderRadius: '12px',
                                  border: '1px solid #e5e7eb',
                                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                  direction: 'rtl'
                                }}
                              />
                              <Legend 
                                verticalAlign="bottom" 
                                height={40}
                                iconSize={14}
                                iconType="circle"
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                              <p className="text-xl font-medium">لا توجد بيانات شحنات بعد</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-xl border-gray-200">
                    <CardHeader className="pb-6 border-b bg-gray-50">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        أداء المندوب
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-10 space-y-8">
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-3 text-lg font-medium">
                            <span>نسبة التسليم الناجح</span>
                            <span className="text-green-700 font-bold">{deliveryRate}%</span>
                          </div>
                          <Progress value={deliveryRate} className="h-4 rounded-full bg-green-100" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-3 text-lg font-medium">
                            <span>نسبة التأخير</span>
                            <span className="text-red-700 font-bold">{delayRate}%</span>
                          </div>
                          <Progress value={delayRate} className="h-4 rounded-full bg-red-100" />
                        </div>
                      </div>

                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <WalletIcon className="h-7 w-7 text-indigo-600" />
                          <span className="text-xl font-bold text-indigo-800">الرصيد المستحق</span>
                        </div>
                        <p className="text-4xl font-bold text-indigo-700">
                          {selectedDelegate.balance.toLocaleString()} <span className="text-2xl">ج.م</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* جدول الشحنات */}
                <Card className="rounded-2xl shadow-xl border-gray-200 overflow-hidden">
                  <CardHeader className="px-8 py-6 border-b bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">أحدث الشحنات</CardTitle>
                        <CardDescription className="text-lg mt-2">
                          آخر 10 شحنات تم تعيينها لهذا المندوب
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => selectedDelegate && navigate(`/app/delegate/${selectedDelegate.id}`)}
                        className="gap-3 h-14 px-8 text-lg border-2"
                        disabled={!selectedDelegate}
                      >
                        <Eye className="h-5 w-5" />
                        عرض التفاصيل الكاملة
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {shipmentsLoading ? (
                      <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50">
                        <Loader2 className="h-14 w-14 animate-spin text-primary mb-6" />
                        <p className="text-xl font-medium text-gray-700">جاري تحميل الشحنات...</p>
                      </div>
                    ) : selectedDelegate?.shipments?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                              <TableHead className="text-right px-8 py-5 text-lg font-semibold text-gray-800 w-[160px]">رقم الشحنة</TableHead>
                              <TableHead className="text-right px-8 py-5 text-lg font-semibold text-gray-800 w-[220px]">العميل</TableHead>
                              <TableHead className="text-right px-8 py-5 text-lg font-semibold text-gray-800 min-w-[300px]">العنوان</TableHead>
                              <TableHead className="text-right px-8 py-5 text-lg font-semibold text-gray-800 w-[140px]">الحالة</TableHead>
                              <TableHead className="text-right px-8 py-5 text-lg font-semibold text-gray-800 w-[140px]">المبلغ</TableHead>
                              <TableHead className="text-right px-8 py-5 text-lg font-semibold text-gray-800 w-[180px]">التاريخ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedDelegate.shipments.map(shipment => (
                              <TableRow 
                                key={shipment.id}
                                className="hover:bg-gray-50/80 transition-colors border-b border-gray-100 cursor-pointer"
                                onClick={() => navigate(`/app/shipments/${shipment.id}`)}
                              >
                                <TableCell className="px-8 py-5 font-mono text-lg font-semibold text-primary">
                                  {shipment.tracking_number}
                                </TableCell>
                                <TableCell className="px-8 py-5 text-lg font-medium text-gray-900">
                                  {shipment.customer}
                                </TableCell>
                                <TableCell className="px-8 py-5 text-base text-gray-700">
                                  {shipment.recipient_address}
                                </TableCell>
                                <TableCell className="px-8 py-5">
                                  <Badge 
                                    variant="outline"
                                    className={cn(
                                      "px-4 py-2 text-base font-medium rounded-full",
                                      statusColors[shipment.status] || "bg-gray-100 text-gray-800 border-gray-200"
                                    )}
                                  >
                                    {statusLabels[shipment.status] || shipment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-8 py-5 text-lg font-bold text-green-700">
                                  {shipment.amount.toLocaleString()} ج.م
                                </TableCell>
                                <TableCell className="px-8 py-5 text-base text-gray-600 font-medium">
                                  {format(new Date(shipment.created_at), 'dd/MM HH:mm', { locale: ar })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-32 text-center bg-gray-50/50">
                        <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-8">
                          <Package className="h-14 w-14 text-gray-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-800 mb-4">لا توجد شحنات بعد</p>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                          سيتم عرض الشحنات هنا بمجرد تعيين شحنات جديدة لهذا المندوب
                        </p>
                        <Button 
                          size="lg"
                          className="gap-3 px-10 py-7 text-xl shadow-lg"
                          onClick={() => navigate('/app/shipments/add')}
                        >
                          <Package className="h-6 w-6" />
                          إضافة شحنة جديدة
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl shadow-xl border border-gray-200">
                <Truck className="h-24 w-24 text-gray-400 mb-8" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">اختر مندوبًا</h2>
                <p className="text-xl text-gray-600 max-w-xl text-center">
                  اختر أحد المناديب من القائمة على اليسار لعرض شحناته وإحصائياته
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) => (
  <Card className="rounded-2xl shadow-lg border-gray-200 hover:shadow-xl transition-shadow">
    <CardContent className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg text-gray-600 font-medium mb-2">{label}</p>
          <p className={cn("text-4xl font-bold", color)}>{value}</p>
        </div>
        <div className={cn("p-5 rounded-2xl", bgColor)}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default DelegateShipments;