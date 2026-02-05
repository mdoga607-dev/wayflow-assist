/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ShipperDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, Phone, Mail, MapPin, Store, Wallet, Package, CheckCircle, 
  XCircle, RefreshCcw, TrendingUp, BarChart3, Calendar, Download, 
  Edit, ChevronLeft, AlertCircle, Info, Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";

interface Shipper {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  branch: string | null;
  total_shipments: number;
  balance: number;
  status: string;
  created_at: string;
}

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  status: string;
  cod_amount: number | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  active: { 
    label: "نشط", 
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="h-4 w-4 text-green-500" />
  },
  inactive: { 
    label: "مش نشط", 
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: <XCircle className="h-4 w-4 text-gray-500" />
  },
};

const ShipperDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [shipper, setShipper] = useState<Shipper | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager', 'courier'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ماعندكش الصلاحية تشوف تفاصيل التاجر",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات التاجر والشحنات
  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      setError('معرف التاجر غير صالح');
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);

        // جلب بيانات التاجر
        const { data: shipperData, error: shipperError } = await supabase
          .from('shippers')
          .select('*')
          .eq('id', id)
          .single();

        // معالجة حالة عدم وجود التاجر
        if (shipperError?.code === 'PGRST116' || !shipperData) {
          setNotFound(true);
          setError('مفيش تاجر بهذا الرقم. ممكن يكون محذوف أو الرقم غلط.');
          toast({
            title: "مفيش تاجر",
            description: "مفيش تاجر بهذا الرقم. راجع الرقم وحاول تاني.",
            variant: "destructive"
          });
          return;
        }

        if (shipperError) {
          throw shipperError;
        }

        // جلب آخر 10 شحنات
        const { data: shipmentsData, error: shipmentsError } = await supabase
          .from('shipments')
          .select(`
            id,
            tracking_number,
            recipient_name,
            status,
            cod_amount,
            created_at
          `)
          .eq('shipper_id', id)
          .order('created_at', { ascending: false })
          .limit(10);

        setShipper(shipperData);
        setShipments(shipmentsData || []);
        
        toast({
          title: "تم التحميل",
          description: `تم تحميل بيانات ${shipperData.name} بنجاح`,
        });
      } catch (err: any) {
        console.error('Error fetching shipper details:', err);
        
        if (err?.code === 'PGRST116' || err?.message?.includes('No rows')) {
          setNotFound(true);
          setError('مفيش تاجر بهذا الرقم. ممكن يكون محذوف أو الرقم غلط.');
        } else if (err?.message?.includes('Invalid uuid')) {
          setNotFound(true);
          setError('الرقم التعريفي مش صح. راجع الرابط.');
        } else {
          const errorMessage = err?.message || 'حصل خطأ غير متوقع أثناء تحميل البيانات';
          setError(errorMessage);
          toast({
            title: "فشل التحميل",
            description: "حصل خطأ في التحميل. حاول تاني بعد شوية.",
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // معالجة حالة التحميل
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-dashed border-primary/20">
          <CardContent className="pt-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري تحميل بيانات التاجر...</h2>
            <p className="text-muted-foreground">برجاء الانتظار</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // معالجة حالة عدم العثور على التاجر
  if (notFound || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-amber-800 mb-3 flex items-center justify-center gap-2">
              <Store className="h-6 w-6" />
              مفيش تاجر
            </CardTitle>
            <CardDescription className="text-lg text-amber-700 font-medium">
              {error || 'المعرف المطلوب غير صحيح'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800">
                {notFound 
                  ? 'التاجر ده محذوف أو الرقم غلط. راجع الرقم وحاول تاني.' 
                  : 'حصل خطأ غير متوقع. حاول تاني بعد شوية.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate('/app/shippers')}
                className="gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 text-base"
              >
                <Store className="h-4 w-4" />
                رجوع لقائمة التجار
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-3 text-base"
              >
                <RefreshCcw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            </div>
            <div className="pt-4 border-t border-amber-200">
              <p className="text-sm text-amber-700">
                <span className="font-medium">تلميح:</span> لو الرقم صحيح والتاجر موجود، 
                ممكن يكون في مشكلة في الاتصال. تأكد من اتصالك بالإنترنت.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // التأكد من وجود بيانات التاجر قبل العرض
  if (!shipper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">بيانات غير متوفرة</h2>
            <p className="text-gray-500 mb-6">مفيش بيانات متاحة دلوقتي. حاول تاني بعد شوية.</p>
            <Button onClick={() => navigate('/app/shippers')} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              رجوع للتجار
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // حساب الإحصائيات
  const shipmentStats = {
    delivered: shipments.filter(s => s.status === 'delivered').length,
    pending: shipments.filter(s => s.status === 'pending' || s.status === 'transit').length,
    total: shipments.length,
  };

  // بيانات المخطط البياني
  const performanceData = [
    { name: "يناير", shipments: 45 },
    { name: "فبراير", shipments: 52 },
    { name: "مارس", shipments: 60 },
    { name: "أبريل", shipments: 58 },
    { name: "مايو", shipments: 65 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 py-6 px-4 sm:px-6 lg:px-8">
      {/* شريط التنقل العلوي */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/app/shippers')}
            className="gap-2 text-gray-700 hover:bg-primary/5 hover:text-primary font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            رجوع لقائمة التجار
          </Button>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              تصدير كـ PDF
            </Button>
            <Button 
              onClick={() => navigate(`/app/shippers/${shipper.id}/edit`)}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Edit className="h-4 w-4" />
              تعديل البيانات
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* الهيدر الرئيسي - تصميم عصري */}
        <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* معلومات التاجر الأساسية */}
              <div className="flex items-start gap-5">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-2xl">
                    <AvatarImage src={shipper.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${shipper.email}` : undefined} />
                    <AvatarFallback className="bg-white/20 text-4xl font-bold">
                      {shipper.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-lg">
                    {statusConfig[shipper.status]?.icon}
                  </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                      {shipper.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-white/90">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{shipper.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Store className="h-4 w-4" />
                        <span>{shipper.branch || 'بدون فرع'}</span>
                      </div>
                      <Badge className={cn(
                        "px-3 py-1 text-base font-bold rounded-full border",
                        statusConfig[shipper.status]?.color
                      )}>
                        {statusConfig[shipper.status]?.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/20 mt-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-white/90" />
                      <a href={`tel:${shipper.phone}`} className="text-lg font-bold hover:underline">
                        {shipper.phone || 'مش متاح'}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-white/90" />
                      <a href={`mailto:${shipper.email}`} className="text-lg font-bold hover:underline">
                        {shipper.email || 'مش متاح'}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-white/90" />
                      <span>انضم منذ {format(new Date(shipper.created_at), 'MMMM yyyy', { locale: ar })}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* مؤشر الأداء */}
              <div className="flex flex-col items-center md:items-end justify-center text-center md:text-right space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 w-full max-w-[250px] border border-white/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-6 w-6 text-yellow-300" />
                    <span className="text-lg font-bold">معدل النشاط</span>
                  </div>
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-100">
                    {shipper.total_shipments > 0 ? Math.round((shipmentStats.delivered / shipper.total_shipments) * 100) : 0}%
                  </div>
                  <Progress 
                    value={shipper.total_shipments > 0 ? Math.round((shipmentStats.delivered / shipper.total_shipments) * 100) : 0}
                    className={cn("h-3 rounded-full", 
                      shipper.total_shipments > 0 && (shipmentStats.delivered / shipper.total_shipments) * 100 >= 85 ? "bg-green-600" : 
                      shipper.total_shipments > 0 && (shipmentStats.delivered / shipper.total_shipments) * 100 >= 70 ? "bg-yellow-600" : "bg-red-600" 
                    )} 
                  />
                  <div className="mt-1 text-sm text-white/80">
                    {shipper.total_shipments > 0 && (shipmentStats.delivered / shipper.total_shipments) * 100 >= 85 ? "أداء ممتاز" : 
                     shipper.total_shipments > 0 && (shipmentStats.delivered / shipper.total_shipments) * 100 >= 70 ? "أداء جيد" : "يحتاج تحسين"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Package className="h-6 w-6 text-primary" />}
            label="إجمالي الشحنات" 
            value={shipper.total_shipments.toString()} 
            subValue={`${shipmentStats.delivered} مسلمة`}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <StatCard 
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            label="تم التسليم" 
            value={shipmentStats.delivered.toString()} 
            subValue={`${shipper.total_shipments > 0 ? Math.round((shipmentStats.delivered / shipper.total_shipments) * 100) : 0}% من الإجمالي`}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard 
            icon={<Clock className="h-6 w-6 text-yellow-600" />}
            label="قيد الانتظار" 
            value={shipmentStats.pending.toString()} 
            subValue={`${shipper.total_shipments > 0 ? Math.round((shipmentStats.pending / shipper.total_shipments) * 100) : 0}% من الإجمالي`}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
          />
          <StatCard 
            icon={<Wallet className="h-6 w-6 text-blue-600" />}
            label="الرصيد المستحق" 
            value={`${shipper.balance.toLocaleString()} ج.م`} 
            subValue="رصيد التاجر الحالي"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
        </div>

        {/* المخططات والشحنات الأخيرة */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* مخطط الأداء الشهري */}
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-5 w-5 text-primary" />
                أداء الشحنات الشهري
              </CardTitle>
              <CardDescription>تتبع أداء التاجر خلال الأشهر الأخيرة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        direction: "rtl",
                        fontSize: "14px"
                      }}
                      labelStyle={{ fontWeight: "bold" }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="shipments" 
                      name="عدد الشحنات" 
                      stroke="hsl(145, 65%, 42%)" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(145, 65%, 42%)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* معلومات العنوان */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                معلومات العنوان
              </CardTitle>
              <CardDescription>تفاصيل موقع التاجر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem 
                icon={<MapPin className="h-5 w-5 text-primary" />}
                label="العنوان الكامل"
                value={shipper.address || 'مش محدد'}
              />
              <InfoItem 
                icon={<Store className="h-5 w-5 text-primary" />}
                label="الفرع"
                value={shipper.branch || 'بدون فرع'}
              />
              <InfoItem 
                icon={<Calendar className="h-5 w-5 text-primary" />}
                label="انضم منذ"
                value={format(new Date(shipper.created_at), 'dd MMMM yyyy', { locale: ar })}
              />
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => toast({ title: "قيد التطوير", description: "ميزة عرض الموقع على الخريطة قيد التطوير" })}
                >
                  <MapPin className="h-4 w-4" />
                  عرض على الخريطة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* آخر الشحنات */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="h-5 w-5 text-primary" />
                آخر الشحنات
              </CardTitle>
              <CardDescription>آخر 10 شحنات أضافها هذا التاجر</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/app/shipments?shipper=${shipper.id}`)}
              className="mt-3 sm:mt-0"
            >
              عرض كل الشحنات
            </Button>
          </CardHeader>
          <CardContent>
            {shipments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xl font-medium text-muted-foreground mb-2">مفيش شحنات</p>
                <p className="text-muted-foreground">هتظهر الشحنات هنا لما يتم إضافتها للتاجر</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">رقم الشحنة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">العميل</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">المبلغ</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment) => (
                      <tr 
                        key={shipment.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/app/shipments/${shipment.id}`)}
                      >
                        <td className="py-3 px-4 font-mono font-medium text-primary">
                          {shipment.tracking_number}
                        </td>
                        <td className="py-3 px-4 font-medium">{shipment.recipient_name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full",
                            shipment.status === 'delivered' && "bg-green-100 text-green-800",
                            shipment.status === 'pending' && "bg-yellow-100 text-yellow-800",
                            shipment.status === 'transit' && "bg-blue-100 text-blue-800"
                          )}>
                            {shipment.status === 'delivered' && 'تم التسليم'}
                            {shipment.status === 'pending' && 'قيد الانتظار'}
                            {shipment.status === 'transit' && 'فى الطريق'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-bold text-green-600">
                          {shipment.cod_amount ? `${shipment.cod_amount.toLocaleString()} ج.م` : 'مدفوع'}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {format(new Date(shipment.created_at), 'dd/MM HH:mm', { locale: ar })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ملاحظات هامة */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">ملاحظات هامة:</p>
                <ul className="list-disc pr-5 mt-1 space-y-1">
                  <li>الشحنات المعروضة هنا هي آخر 10 شحنات فقط. لعرض كل الشحنات، اضغط على زر "عرض كل الشحنات"</li>
                  <li>التاجر ده عنده {shipper.total_shipments} شحنة إجمالى في النظام</li>
                  <li>الرصيد المستحق للتاجر هو {shipper.balance.toLocaleString()} ج.م</li>
                  <li>ممكن تعديل أي بيانات للتاجر من صفحة التعديل</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// مكون بطاقات الإحصائيات
const StatCard = ({ icon, label, value, subValue, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: string;
  bgColor: string;
}) => (
  <Card className="hover:shadow-lg transition-shadow border-0 overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className={cn("text-2xl md:text-3xl font-bold", color)}>{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        </div>
        <div className={cn("p-3 rounded-xl", bgColor)}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// مكون معلومات العنوان
const InfoItem = ({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
    <div className="flex-shrink-0 mt-1">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-1 break-words">{value}</p>
    </div>
  </div>
);

export default ShipperDetails;