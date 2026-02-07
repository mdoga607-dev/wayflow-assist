/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DelegateDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  User,
  Phone,
  MapPin,
  Truck,
  Wallet,
  Clock,
  AlertCircle,
  Package,
  CheckCircle,
  XCircle,
  RefreshCcw,
  TrendingUp,
  BarChart3,
  Calendar,
  Star,
  Download,
  Edit,
  ChevronLeft,
  PhoneCall,
  Navigation,
  Map,
  FileText,
  Printer,
  Share2,
  MoreVertical,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface Delegate {
  id: string;
  name: string;
  phone: string;
  city: string;
  branch: string;
  avatar_url: string | null;
  status: 'active' | 'inactive' | 'on_leave' | 'busy';
  total_delivered: number;
  total_delayed: number;
  total_returned: number;
  balance: number;
  commission_due: number;
  created_at: string;
}

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  status: string;
  cod_amount: number | null;
  created_at: string;
  recipient_city: string;
  recipient_area: string | null;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: JSX.Element }
> = {
  active: {
    label: 'نشط',
    color: 'text-green-700',
    bg: 'bg-green-100',
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
  },
  inactive: {
    label: 'مش نشط',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    icon: <XCircle className="h-5 w-5 text-gray-500" />,
  },
  on_leave: {
    label: 'فى إجازة',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    icon: <Clock className="h-5 w-5 text-blue-500" />,
  },
  busy: {
    label: 'مشغول',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    icon: <Clock className="h-5 w-5 text-yellow-500" />,
  },
};

const DelegateDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth() ?? {
    role: null,
    loading: true,
  };

  const [delegate, setDelegate] = useState<Delegate | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // ✅ حماية إضافية ضد القيم غير الصالحة لـ ID
  useEffect(() => {
    if (id === 'undefined' || id === 'null' || id === '' || !id) {
      console.warn('DelegateDetails: تم اكتشاف ID غير صالح:', id);
      setPageError('الرابط غير صحيح. مفيش رقم تعريفي للمندوب.');
      setNotFound(true);
      toast({
        title: 'رابط غير صحيح',
        description: 'الرابط ده مش صح. راجع الرابط وحاول تاني.',
        variant: 'destructive'
      });
      const timer = setTimeout(() => {
        navigate('/app/delegates');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [id, navigate]);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (authLoading) return;

    if (!role || !['head_manager', 'manager', 'courier'].includes(role as string)) {
      toast({
        title: 'غير مصرح',
        description: 'ماعندكش الصلاحية تشوف تفاصيل المندوب',
        variant: 'destructive',
      });
      navigate('/unauthorized', { replace: true });
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات المندوب
  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null' || authLoading) {
      console.log('DelegateDetails: لا يوجد ID صالح أو لا يزال يتحقق من الصلاحيات', { id, authLoading });
      return;
    }

    const fetchDelegate = async () => {
      try {
        setLoading(true);
        setPageError(null);
        setNotFound(false);

        console.log('DelegateDetails: جاري جلب بيانات المندوب ID:', id);

        const {  data:delegateData, error: delegateError } = await supabase
          .from('delegates')
          .select(`
            id,
            name,
            phone,
            city,
            branch,
            avatar_url,
            status,
            total_delivered,
            total_delayed,
            total_returned,
            balance,
            commission_due,
            created_at
          `)
          .eq('id', id)
          .single();

        if (delegateError || !delegateData) {
          console.log('DelegateDetails: خطأ أو عدم وجود المندوب:', delegateError);
          setNotFound(true);
          setPageError('مفيش مندوب بهذا الرقم. ممكن يكون محذوف أو الرقم غلط.');
          toast({
            title: 'مفيش مندوب',
            description: 'مفيش مندوب بهذا الرقم. راجع الرقم وحاول تاني.',
            variant: 'destructive'
          });
          return;
        }

        setDelegate({
          ...delegateData,
          branch: delegateData.branch || 'بدون فرع',
          city: delegateData.city || 'مش محدد',
          avatar_url: delegateData.avatar_url || null,
        });

        fetchShipments(id);
      } catch (err: any) {
        console.error('DelegateDetails: خطأ في جلب بيانات المندوب:', err);
        const errorMessage = err?.message || 'حصل خطأ أثناء تحميل بيانات المندوب';
        setPageError(errorMessage);
        toast({
          title: 'فشل التحميل',
          description: 'حصل خطأ في تحميل بيانات المندوب. حاول تاني بعد شوية.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDelegate();
  }, [id, authLoading]);

  // جلب شحنات المندوب
  const fetchShipments = async (delegateId: string) => {
    try {
      setShipmentsLoading(true);

      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select(`
          id,
          tracking_number,
          recipient_name,
          status,
          cod_amount,
          created_at,
          recipient_city,
          recipient_area
        `)
        .eq('delegate_id', delegateId)
        .order('created_at', { ascending: false })
        .limit(15);

      if (shipmentsError) {
        console.error('DelegateDetails: خطأ في جلب الشحنات:', shipmentsError);
        setShipments([]);
        return;
      }

      setShipments(shipmentsData || []);
    } catch (err: any) {
      console.error('DelegateDetails: خطأ عام في جلب الشحنات:', err);
      setShipments([]);
    } finally {
      setShipmentsLoading(false);
    }
  };

  // معالجة حالة التحميل
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/20">
        <Card className="w-full max-w-md border-2 border-dashed border-primary/20">
          <CardContent className="pt-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري تحميل بيانات المندوب...</h2>
            <p className="text-muted-foreground">برجاء الانتظار</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // معالجة حالة عدم العثور على المندوب
  if (notFound || pageError || !delegate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-amber-800 mb-3 flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              {notFound ? 'مفيش مندوب' : 'حصل خطأ'}
            </CardTitle>
            <CardDescription className="text-lg text-amber-700 font-medium">
              {pageError || 'المعرف المطلوب غير صحيح'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800">
                {notFound 
                  ? 'المندوب ده محذوف أو الرقم غلط. راجع الرقم وحاول تاني.' 
                  : 'حصل خطأ غير متوقع. حاول تاني بعد شوية.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate('/app/delegates')}
                className="gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 text-base"
              >
                <Truck className="h-4 w-4" />
                رجوع لقائمة المناديب
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // الحسابات
  const totalShipments =
    delegate.total_delivered + delegate.total_delayed + delegate.total_returned;

  const deliveryRate = totalShipments > 0
    ? Math.round((delegate.total_delivered / totalShipments) * 100)
    : 0;

  // بيانات المخطط الشهري
  const monthlyPerformance = [
    { month: 'يناير', delivered: 42, delayed: 6 },
    { month: 'فبراير', delivered: 55, delayed: 4 },
    { month: 'مارس', delivered: 68, delayed: 9 },
    { month: 'أبريل', delivered: 72, delayed: 5 },
    { month: 'مايو', delivered: 81, delayed: 3 },
    { month: 'يونيو', delivered: 95, delayed: 2 },
  ];

  const statusDistribution = [
    { name: 'تم التسليم', value: delegate.total_delivered, color: '#22c55e' },
    { name: 'متأخر', value: delegate.total_delayed, color: '#ef4444' },
    { name: 'مرتجع', value: delegate.total_returned, color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 py-6 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* شريط التحكم العلوي */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/app/delegates')}
            className="gap-2 text-gray-700 hover:bg-primary/5 hover:text-primary font-medium text-lg px-6 py-5"
          >
            <ChevronLeft className="h-5 w-5" />
            رجوع للمناديب
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.print()}
              className="gap-2 border-2 hover:bg-gray-100 text-lg px-6 py-5 shadow-sm hover:shadow-md transition-all"
            >
              <Printer className="h-5 w-5" />
              طباعة التقرير
            </Button>

            <Button
              size="lg"
              onClick={() => navigate(`/app/delegate/${delegate.id}/edit`)}
              className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all text-lg px-8 py-5"
            >
              <Edit className="h-5 w-5" />
              تعديل البيانات
            </Button>
          </div>
        </div>

        {/* بطاقة الهيدر الرئيسية */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-blue-50/40">
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* الصورة + المعلومات */}
              <div className="flex flex-col md:flex-row items-start gap-6 flex-1">
                <div className="relative group">
                  <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-2xl transition-transform group-hover:scale-105 duration-300">
                    <AvatarImage 
                      // ✅ التصحيح الأهم: إزالة المسافة الزائدة بعد ?seed=
                      src={delegate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(delegate.name)}`} 
                      alt={delegate.name} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white text-4xl md:text-5xl font-bold">
                      {delegate.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <Badge
                    className={cn(
                      'absolute -bottom-3 -left-1 md:-bottom-4 md:-left-2 px-4 py-1.5 text-base md:text-lg font-bold rounded-full border-2 shadow-lg',
                      statusConfig[delegate.status]?.bg,
                      statusConfig[delegate.status]?.color
                    )}
                  >
                    {statusConfig[delegate.status]?.icon}
                    <span className="mr-1.5">{statusConfig[delegate.status]?.label}</span>
                  </Badge>
                </div>

                <div className="space-y-5 flex-1 pt-2">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-primary">
                      {delegate.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4">
                      <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-gray-800 text-sm md:text-base">{delegate.city}</span>
                      </div>

                      <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm md:text-base">{delegate.branch}</span>
                      </div>

                      <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm md:text-base">
                          انضم منذ {format(new Date(delegate.created_at), 'MMMM yyyy', { locale: ar })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-3 rounded-xl shadow-md border border-green-100">
                      <PhoneCall className="h-6 w-6 text-green-700 flex-shrink-0" />
                      <a
                        href={`tel:${delegate.phone}`}
                        className="text-lg md:text-xl font-bold text-green-800 hover:underline"
                      >
                        {delegate.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* مؤشر الأداء */}
              <div className="flex flex-col items-center lg:items-end gap-6 w-full lg:w-auto mt-6 lg:mt-0">
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/60 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-gray-800">معدل التسليم</span>
                    <TrendingUp className="h-7 w-7 text-green-600" />
                  </div>

                  <div className="text-center">
                    <div className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500">
                      {deliveryRate}%
                    </div>
                    <Progress
                      value={deliveryRate}
                      className={cn(
                        'h-4 mt-4 rounded-full shadow-inner',
                        deliveryRate >= 90
                          ? '[&>div]:bg-gradient-to-r from-green-500 to-emerald-600'
                          : deliveryRate >= 75
                          ? '[&>div]:bg-gradient-to-r from-yellow-500 to-amber-600'
                          : '[&>div]:bg-gradient-to-r from-red-500 to-rose-600'
                      )}
                    />
                    <p className="mt-3 text-base md:text-lg font-semibold text-gray-700">
                      {deliveryRate >= 90
                        ? 'أداء ممتاز 🌟'
                        : deliveryRate >= 75
                        ? 'أداء جيد 👍'
                        : 'يحتاج تحسين ⚠️'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 text-center shadow-lg border border-blue-100">
                    <p className="text-xs md:text-sm text-gray-600 mb-1">الرصيد</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-700">
                      {delegate.balance.toLocaleString()} <span className="text-base">ج.م</span>
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 text-center shadow-lg border border-purple-100">
                    <p className="text-xs md:text-sm text-gray-600 mb-1">العمولة</p>
                    <p className="text-2xl md:text-3xl font-bold text-purple-700">
                      {delegate.commission_due.toLocaleString()} <span className="text-base">ج.م</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<Package className="h-7 w-7 text-blue-600" />}
            title="إجمالي الشحنات"
            value={totalShipments.toLocaleString()}
            subtitle={`${delegate.total_delivered} مسلمة`}
            gradient="from-blue-500 to-blue-700"
          />

          <StatCard
            icon={<CheckCircle className="h-7 w-7 text-green-600" />}
            title="تم التسليم"
            value={delegate.total_delivered.toLocaleString()}
            subtitle={`${deliveryRate}% نجاح`}
            gradient="from-green-500 to-emerald-700"
          />

          <StatCard
            icon={<Clock className="h-7 w-7 text-yellow-600" />}
            title="متأخر"
            value={delegate.total_delayed.toLocaleString()}
            subtitle={
              totalShipments > 0
                ? `${Math.round((delegate.total_delayed / totalShipments) * 100)}%`
                : '0%'
            }
            gradient="from-yellow-500 to-amber-700"
          />

          <StatCard
            icon={<Wallet className="h-7 w-7 text-indigo-600" />}
            title="الرصيد المستحق"
            value={`${delegate.balance.toLocaleString()} ج.م`}
            subtitle={`${delegate.commission_due.toLocaleString()} عمولة`}
            gradient="from-indigo-500 to-purple-700"
          />
        </div>

        {/* المخططات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          {/* مخطط الأداء الشهري */}
          <Card className="shadow-2xl border-0 overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-5 border-b">
              <CardTitle className="text-xl md:text-2xl flex items-center gap-3 text-gray-800 font-bold">
                <BarChart3 className="h-6 w-6 text-primary" />
                أداء التسليم الشهري
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                تتبع أداء المندوب خلال الأشهر الأخيرة
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPerformance} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b" 
                      fontSize={13}
                      tickLine={false}
                      tick={{ fill: '#64748b' }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={13}
                      tickLine={false}
                      tick={{ fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        padding: '12px',
                        direction: 'rtl',
                        fontSize: '14px'
                      }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="delivered"
                      name="تم التسليم"
                      stroke="#10b981"
                      strokeWidth={4}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 10, strokeWidth: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="delayed"
                      name="متأخر"
                      stroke="#ef4444"
                      strokeWidth={4}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 10, strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* دائرة توزيع الحالات */}
          <Card className="shadow-2xl border-0 overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-5 border-b">
              <CardTitle className="text-xl md:text-2xl flex items-center gap-3 text-gray-800 font-bold">
                <BarChart3 className="h-6 w-6 text-primary" />
                توزيع حالات الشحنات
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                نسبة كل حالة من إجمالي الشحنات
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="h-[380px] flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <RechartsPieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="white" 
                          strokeWidth={2} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        padding: '12px',
                        direction: 'rtl',
                        fontSize: '14px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} شحنة`, "العدد"]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={40}
                      iconSize={14}
                      iconType="circle"
                      wrapperStyle={{ 
                        fontSize: '13px', 
                        fontWeight: 500,
                        direction: 'rtl'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>

                <div className="mt-6 grid grid-cols-3 gap-5 w-full max-w-xl px-2">
                  {statusDistribution.map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div
                        className="w-4 h-4 rounded-full mb-2"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                      <span className="text-xs text-gray-600 mt-0.5">
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* آخر الشحنات */}
        <Card className="shadow-2xl border-0 overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50/80 pb-5 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl md:text-2xl flex items-center gap-3 text-gray-800 font-bold">
                  <Package className="h-6 w-6 text-primary" />
                  آخر الشحنات المعينة
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-gray-600">
                  آخر {shipments.length} شحنة تم تعيينها لهذا المندوب
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/app/shipments?delegate_id=${id}`)}
                className="gap-2 border-2 text-base px-6 py-5 shadow-sm hover:shadow-md transition-all"
              >
                عرض كل الشحنات
                <Truck className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {shipmentsLoading ? (
              <div className="flex items-center justify-center py-16 bg-muted/30">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">جاري تحميل الشحنات...</p>
                </div>
              </div>
            ) : shipments.length === 0 ? (
              <div className="py-20 text-center bg-gray-50/50">
                <div className="mx-auto w-24 h-24 rounded-full bg-muted/60 flex items-center justify-center mb-6">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">مفيش شحنات</h3>
                <p className="text-gray-500 max-w-md mx-auto px-4">
                  هتظهر الشحنات هنا لما يتم تعيينها للمندوب. المندوب الجديد ممكن ميكونش عنده شحنات بعد.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-right py-4 px-5 font-semibold text-gray-700 text-sm">رقم الشحنة</th>
                      <th className="text-right py-4 px-5 font-semibold text-gray-700 text-sm">العميل</th>
                      <th className="text-right py-4 px-5 font-semibold text-gray-700 text-sm">المدينة</th>
                      <th className="text-right py-4 px-5 font-semibold text-gray-700 text-sm">الحالة</th>
                      <th className="text-right py-4 px-5 font-semibold text-gray-700 text-sm">المبلغ</th>
                      <th className="text-right py-4 px-5 font-semibold text-gray-700 text-sm">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        className="border-b border-border/50 hover:bg-muted/40 transition-colors duration-200 cursor-pointer"
                        onClick={() => navigate(`/app/shipments/${shipment.id}`)}
                      >
                        <td className="py-4 px-5 font-mono font-medium text-primary text-base">
                          {shipment.tracking_number}
                        </td>
                        <td className="py-4 px-5 font-medium text-gray-800 text-base">{shipment.recipient_name}</td>
                        <td className="py-4 px-5 text-gray-700 text-sm">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span>{shipment.recipient_city}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-3 py-1 text-sm font-medium rounded-full",
                              shipment.status === 'delivered' && 'bg-green-100 text-green-800 border-green-200',
                              shipment.status === 'delayed' && 'bg-red-100 text-red-800 border-red-200',
                              shipment.status === 'returned' && 'bg-amber-100 text-amber-800 border-amber-200',
                              shipment.status === 'transit' && 'bg-blue-100 text-blue-800 border-blue-200',
                              shipment.status === 'pending' && 'bg-gray-100 text-gray-800 border-gray-200'
                            )}
                          >
                            {shipment.status === 'delivered' && 'تم التسليم'}
                            {shipment.status === 'delayed' && 'متأخر'}
                            {shipment.status === 'returned' && 'مرتجع'}
                            {shipment.status === 'transit' && 'فى الطريق'}
                            {shipment.status === 'pending' && 'منتظر'}
                          </Badge>
                        </td>
                        <td className="py-4 px-5 font-bold text-green-700 text-base">
                          {shipment.cod_amount
                            ? `${shipment.cod_amount.toLocaleString()} ج.م`
                            : 'مدفوع'}
                        </td>
                        <td className="py-4 px-5 text-gray-600 text-sm">
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

        {/* أزرار الإجراءات السريعة */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <QuickActionButton
                icon={<PhoneCall className="h-6 w-6" />}
                label="اتصل بالمندوب"
                onClick={() => window.location.href = `tel:${delegate.phone}`}
                gradient="from-green-500 to-emerald-600"
              />
              <QuickActionButton
                icon={<Navigation className="h-6 w-6" />}
                label="اتبع على الخريطة"
                onClick={() => toast({ title: "قيد التطوير", description: "ميزة تتبع الموقع قيد التطوير" })}
                gradient="from-blue-500 to-indigo-600"
              />
              <QuickActionButton
                icon={<Package className="h-6 w-6" />}
                label="تعيين شحنة"
                onClick={() => navigate('/app/shipments/add')}
                gradient="from-purple-500 to-violet-600"
              />
              <QuickActionButton
                icon={<Map className="h-6 w-6" />}
                label="عرض المناطق"
                onClick={() => navigate('/app/areas')}
                gradient="from-amber-500 to-orange-600"
              />
              <QuickActionButton
                icon={<Printer className="h-6 w-6" />}
                label="طباعة تقرير"
                onClick={() => window.print()}
                gradient="from-pink-500 to-rose-600"
              />
              <QuickActionButton
                icon={<Info className="h-6 w-6" />}
                label="إحصائيات مفصلة"
                onClick={() => navigate(`/app/delegates/stats`)}
                gradient="from-gray-600 to-slate-700"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// مكون بطاقة الإحصائية
const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
}) => (
  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white border border-border">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>
            {value}
          </p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-4 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-10`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// مكون زر الإجراء السريع
const QuickActionButton = ({
  icon,
  label,
  onClick,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  gradient: string;
}) => (
  <Button
    variant="outline"
    onClick={onClick}
    className={cn(
      'h-24 flex flex-col gap-3 border-2 shadow-md hover:shadow-xl transition-all duration-300 text-white text-sm font-medium',
      `bg-gradient-to-br ${gradient} hover:brightness-110 hover:scale-[1.02] border-transparent`
    )}
  >
    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
      {icon}
    </div>
    <span className="text-center px-1">{label}</span>
  </Button>
);

export default DelegateDetails;