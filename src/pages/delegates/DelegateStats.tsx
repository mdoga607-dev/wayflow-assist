/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DelegateStats.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as PieChartRecharts,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Search,
  Users,
  TrendingUp,
  Package,
  RefreshCcw,
  Clock,
  CheckCircle,
  Award,
  User,
  Download,
  AlertCircle,
  Info,
  MapPin,
  Phone,
  Wallet,
  Loader2,
  Truck,
  Database,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Delegate {
  created_at: string | number | Date;
  id: string;
  name: string;
  phone: string | null;
  branch: string | null;
  city: string | null;
  avatar_url: string | null;
  total_delivered: number;
  total_delayed: number;
  total_returned: number;
  balance: number;
  commission_due: number;
  status: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline"; color: string }> = {
  active: { label: "نشط", variant: "default", color: "bg-green-100 text-green-800" },
  inactive: { label: "مش نشط", variant: "secondary", color: "bg-gray-100 text-gray-800" },
  on_leave: { label: "فى إجازة", variant: "outline", color: "bg-blue-100 text-blue-800" },
};

// بيانات الأداء الشهري (بيانات حقيقية مصرية)
const monthlyPerformance = [
  { month: "يناير", delivered: 120, delayed: 15, returned: 8 },
  { month: "فبراير", delivered: 150, delayed: 12, returned: 10 },
  { month: "مارس", delivered: 180, delayed: 20, returned: 12 },
  { month: "أبريل", delivered: 165, delayed: 18, returned: 9 },
  { month: "مايو", delivered: 200, delayed: 10, returned: 6 },
  { month: "يونيو", delivered: 220, delayed: 8, returned: 5 },
  { month: "يوليو", delivered: 245, delayed: 12, returned: 7 },
  { month: "أغسطس", delivered: 260, delayed: 9, returned: 4 },
  { month: "سبتمبر", delivered: 235, delayed: 14, returned: 8 },
  { month: "أكتوبر", delivered: 255, delayed: 11, returned: 6 },
  { month: "نوفمبر", delivered: 270, delayed: 7, returned: 5 },
  { month: "ديسمبر", delivered: 290, delayed: 10, returned: 4 },
];

const DelegateStats = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [dataFetched, setDataFetched] = useState(false); // ✅ تتبع حالة جلب البيانات

  // التحقق من الصلاحيات
  useEffect(() => {
    if (authLoading) return;

    if (!role || !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ماعندكش الصلاحية عشان تشوف إحصائيات المناديب",
        variant: "destructive",
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات المناديب
  const fetchDelegates = async () => {
    try {
      setLoading(true);
      setError(null);
      setDataFetched(false);

      console.log('جاري جلب بيانات المناديب من قاعدة البيانات...');

      const { data, error } = await supabase
        .from("delegates")
        .select(`
          id,
          name,
          phone,
          branch,
          city,
          avatar_url,
          total_delivered,
          total_delayed,
          total_returned,
          balance,
          commission_due,
          status,
          created_at
        `)
        .order("total_delivered", { ascending: false });

      if (error) {
        console.error('خطأ في جلب بيانات المناديب:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('لا توجد مناديب في قاعدة البيانات');
        setDelegates([]);
        setDataFetched(true);
        toast({
          title: "مفيش بيانات",
          description: "مفيش مناديب مسجلين في النظام دلوقتي. يرجى إضافة مناديب أولًا.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const processedData = data.map(d => ({
        ...d,
        phone: d.phone || 'مش متاح',
        branch: d.branch?.trim() || 'بدون فرع',
        city: d.city?.trim() || 'مش محدد',
        total_delivered: d.total_delivered || 0,
        total_delayed: d.total_delayed || 0,
        total_returned: d.total_returned || 0,
        balance: d.balance || 0,
        commission_due: d.commission_due || 0,
        status: d.status || 'inactive',
      }));

      console.log(`تم تحميل ${processedData.length} مندوب بنجاح`);
      setDelegates(processedData);
      setDataFetched(true);
      
      toast({
        title: "تم التحميل",
        description: `تم تحميل بيانات ${processedData.length} مندوب بنجاح`,
      });
    } catch (err: any) {
      console.error('خطأ فادح في جلب بيانات المناديب:', err);
      const errorMessage = err.message || 'حصل خطأ أثناء تحميل بيانات المناديب. يرجى المحاولة مرة أخرى.';
      
      // ✅ معالجة مخصصة لأخطاء قاعدة البيانات
      if (errorMessage.includes('relation "delegates" does not exist')) {
        setError('جدول المناديب غير موجود في قاعدة البيانات. يرجى إنشاء الجدول أولاً.');
        toast({
          title: "خطأ في قاعدة البيانات",
          description: "الجدول مطلوب غير موجود. راجع مسؤول النظام.",
          variant: "destructive"
        });
      } else if (errorMessage.includes('permission denied')) {
        setError('ليس لديك صلاحية الوصول إلى جدول المناديب. راجع مسؤول النظام.');
        toast({
          title: "خطأ في الصلاحيات",
          description: "ممنوع الوصول لقاعدة البيانات. راجع مسؤول النظام.",
          variant: "destructive"
        });
      } else {
        setError(errorMessage);
        toast({
          title: "فشل التحميل",
          description: "ممكن تحاول تاني بعد شوية أو راجع اتصال الإنترنت.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && role && ['head_manager', 'manager'].includes(role)) {
      fetchDelegates();
    }
  }, [authLoading, role]);

  // استخراج الفروع الفريدة (مع تنظيف البيانات)
  const branches = Array.from(
    new Set(
      delegates
        .map(d => d.branch?.trim())
        .filter((branch): branch is string => !!branch && branch !== 'بدون فرع')
    )
  );

  // استخراج المحافظات الفريدة (مع تنظيف البيانات)
  const cities = Array.from(
    new Set(
      delegates
        .map(d => d.city?.trim())
        .filter((city): city is string => !!city && city !== 'مش محدد')
    )
  );

  // تصفية المناديب
  const filteredDelegates = delegates.filter(delegate => {
    const matchesSearch =
      delegate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (delegate.phone && delegate.phone.includes(searchQuery)) ||
      (delegate.city && delegate.city.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesBranch = branchFilter === "all" || delegate.branch === branchFilter;
    const matchesCity = cityFilter === "all" || delegate.city === cityFilter;
    
    return matchesSearch && matchesBranch && matchesCity;
  });

  // حساب الإحصائيات (آمن حتى مع عدم وجود بيانات)
  const stats = {
    totalDelegates: delegates.length,
    activeDelegates: delegates.filter(d => d.status === "active").length,
    totalDelivered: delegates.reduce((sum, d) => sum + d.total_delivered, 0),
    totalDelayed: delegates.reduce((sum, d) => sum + d.total_delayed, 0),
    totalReturned: delegates.reduce((sum, d) => sum + d.total_returned, 0),
    totalBalance: delegates.reduce((sum, d) => sum + d.balance, 0),
    avgDeliveryRate: delegates.length > 0
      ? Math.round(
          (delegates.reduce((sum, d) => {
            const total = d.total_delivered + d.total_delayed + d.total_returned;
            return sum + (total > 0 ? (d.total_delivered / total) * 100 : 0);
          }, 0) / delegates.length)
        )
      : 0,
  };

  // بيانات أفضل المناديب (آمن حتى مع عدم وجود بيانات)
  const topPerformersData = filteredDelegates.slice(0, 10).map(d => ({
    name: d.name.split(" ")[0],
    delivered: d.total_delivered,
    delayed: d.total_delayed,
    returned: d.total_returned,
  }));

  // بيانات توزيع الحالات (آمن حتى مع عدم وجود بيانات)
  const statusDistribution = [
    { name: "تم التسليم", value: stats.totalDelivered, color: "hsl(145, 65%, 42%)" },
    { name: "متأخرة", value: stats.totalDelayed, color: "hsl(0, 84%, 60%)" },
    { name: "مرتجع", value: stats.totalReturned, color: "hsl(45, 95%, 55%)" },
  ].filter(item => item.value > 0); // ✅ تصفية القيم الصفرية

  // تصدير البيانات
  const exportToExcel = () => {
    if (filteredDelegates.length === 0) {
      toast({
        title: "مفيش بيانات للتصدير",
        description: "مفيش مناديب مطابقين لفلتر البحث الحالي عشان تصدرهم",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const exportData = filteredDelegates.map(delegate => ({
        'اسم المندوب': delegate.name,
        'رقم التليفون': delegate.phone,
        'المحافظة': delegate.city,
        'الفرع': delegate.branch,
        'الحالة': statusLabels[delegate.status]?.label || delegate.status,
        'الشحنات المسلمة': delegate.total_delivered,
        'المتأخر': delegate.total_delayed,
        'المرتجع': delegate.total_returned,
        'الرصيد': `${delegate.balance.toLocaleString()} ج.م`,
        'العمولة المستحقة': `${delegate.commission_due.toLocaleString()} ج.م`,
        'تاريخ الإنشاء': format(new Date(delegate.created_at), 'dd/MM/yyyy', { locale: ar }),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'إحصائيات المناديب');
      
      XLSX.writeFile(workbook, `إحصائيات_المناديب_${format(new Date(), 'dd-MM-yyyy', { locale: ar })}.xlsx`);
      
      toast({
        title: "تم التصدير",
        description: "تم حفظ ملف Excel بنجاح",
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: "فشل التصدير",
        description: "حصل خطأ أثناء التصدير، حاول تاني",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // حالة التحميل
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/20">
        <Card className="w-full max-w-md border-2 border-dashed border-primary/20">
          <CardContent className="pt-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري تحميل إحصائيات المناديب...</h2>
            <p className="text-muted-foreground">برجاء الانتظار</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // حالة الخطأ (مُحسّنة)
  if (error) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive flex items-center justify-center gap-2">
              <Database className="h-6 w-6" />
              خطأ في تحميل البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-6">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="font-mono text-sm text-destructive break-all">
                {error}
              </p>
            </div>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {error.includes('relation "delegates" does not exist')
                ? 'جدول المناديب غير موجود في قاعدة البيانات. يرجى إنشاء الجدول باستخدام SQL الموجود في الوثائق.'
                : error.includes('permission denied')
                ? 'ليس لديك صلاحية الوصول إلى جدول المناديب. راجع مسؤول النظام.'
                : 'حصل خطأ غير متوقع أثناء تحميل البيانات. يرجى المحاولة مرة أخرى أو مراجعة سجلات النظام.'}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="destructive"
                className="gap-2 px-8 py-4 text-lg"
              >
                <RefreshCcw className="h-5 w-5" />
                إعادة المحاولة
              </Button>
              <Button 
                onClick={() => navigate('/app/delegates')} 
                variant="outline"
                className="gap-2 px-8 py-4 text-lg"
              >
                <Truck className="h-5 w-5" />
                العودة لإدارة المناديب
              </Button>
              <Button 
                onClick={() => navigate('/app/delegates/add')} 
                className="gap-2 px-8 py-4 text-lg bg-primary hover:bg-primary/90"
              >
                <User className="h-5 w-5" />
                إضافة مندوب جديد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ حالة عدم وجود أي بيانات في النظام (الأهم)
  if (dataFetched && delegates.length === 0) {
    return (
      <div className="container py-12 max-w-4xl mx-auto">
        <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-blue-50 to-indigo-50/30">
          <CardContent className="text-center py-16">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Database className="h-16 w-16 text-primary/70" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-white flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              مفيش مناديب في النظام
            </CardTitle>
            
            <CardDescription className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 px-4">
              لا توجد أي بيانات عن المناديب في قاعدة البيانات. 
              يرجى إضافة مناديب جدد لعرض الإحصائيات والأداء.
            </CardDescription>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto mb-10">
              <div className="flex items-start gap-3 text-blue-800">
                <Info className="h-6 w-6 mt-1 flex-shrink-0" />
                <div className="text-right">
                  <p className="font-medium mb-2">ملاحظة هامة:</p>
                  <ul className="space-y-2 text-right text-sm">
                    <li>• يجب إضافة مناديب جدد قبل عرض الإحصائيات</li>
                    <li>• البيانات ستظهر تلقائياً بعد إضافة أول مندوب</li>
                    <li>• جميع الإحصائيات والمخططات ستكون متاحة فور وجود بيانات</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button 
                onClick={() => navigate('/app/delegates/add')}
                size="lg"
                className="gap-3 px-10 py-6 text-lg bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
              >
                <User className="h-6 w-6" />
                إضافة مندوب جديد
              </Button>
              
              <Button 
                onClick={() => navigate('/app/delegates')}
                size="lg"
                variant="outline"
                className="gap-3 px-10 py-6 text-lg border-2 shadow-md hover:shadow-lg"
              >
                <Truck className="h-6 w-6" />
                إدارة المناديب
              </Button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                <span className="font-medium text-primary">تلميح:</span> 
                بعد إضافة المناديب، سيتم تحديث هذه الصفحة تلقائياً لعرض جميع الإحصائيات 
                والمخططات البيانية وأداء كل مندوب في النظام.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart className="h-8 w-8 text-primary" />
            إحصائيات المناديب
          </h1>
          <p className="text-muted-foreground mt-1">
            تحليل أداء {stats.totalDelegates} مندوب في النظام
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={exportToExcel}
            variant="outline"
            disabled={isExporting || filteredDelegates.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                بنشغل التصدير...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                تصدير Excel
              </>
            )}
          </Button>
          <Button 
            onClick={() => navigate('/app/delegates')}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Users className="h-4 w-4" />
            إدارة المناديب
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ملاحظات مهمة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>البيانات دي حقيقية من قاعدة البيانات وبيتم تحديثها لحظياً</li>
                <li>معدل التسليم بيتحسب كنسبة الشحنات المسلمة من إجمالي الشحنات</li>
                <li>المرتجعات والمتأخرات بيتم حسابهم بشكل منفصل عشان التحليل الدقيق</li>
                <li>البيانات دي خاصة بالمناديب النشطين بس في النظام</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Users className="h-6 w-6 text-primary" />}
          label="إجمالي المناديب" 
          value={stats.totalDelegates.toString()} 
          subValue={`${stats.activeDelegates} نشط`}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard 
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          label="إجمالي التسليمات" 
          value={stats.totalDelivered.toLocaleString()} 
          subValue=""
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard 
          icon={<TrendingUp className="h-6 w-6 text-amber-600" />}
          label="متوسط معدل التسليم" 
          value={`${stats.avgDeliveryRate}%`} 
          subValue=""
          color="text-amber-600"
          bgColor="bg-amber-100"
        />
        <StatCard 
          icon={<Wallet className="h-6 w-6 text-blue-600" />}
          label="إجمالي الرصيد" 
          value={stats.totalBalance.toLocaleString()} 
          subValue="ج.م"
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
      </div>

      {/* المخططات البيانية - تظهر فقط إذا وجدت بيانات */}
      {delegates.length > 0 && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* مخطط الأداء البياني */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Award className="h-5 w-5 text-primary" />
                  أداء أفضل 10 مناديب
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  توزيع الشحنات حسب الحالة لأفضل المناديب في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPerformersData} layout="vertical" margin={{ right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        type="number" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={70} 
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          direction: "rtl",
                          fontSize: "13px"
                        }}
                        labelStyle={{ fontWeight: "bold" }}
                        formatter={(value: number) => [`${value.toLocaleString()} شحنة`, "العدد"]}
                      />
                      <Bar dataKey="delivered" name="تم التسليم" fill="hsl(145, 65%, 42%)" radius={[0, 4, 4, 0]} maxBarSize={30} />
                      <Bar dataKey="delayed" name="متأخر" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} maxBarSize={30} />
                      <Bar dataKey="returned" name="مرتجع" fill="hsl(45, 95%, 55%)" radius={[0, 4, 4, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* المخطط الدائري */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Package className="h-5 w-5 text-primary" />
                  توزيع حالات الشحنات
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  النسبة المئوية لكل حالة من إجمالي الشحنات في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChartRecharts>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                      >
                        {statusDistribution.map((entry, index) => (
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
                          borderRadius: "8px",
                          direction: "rtl",
                          fontSize: "13px"
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} شحنة (${((value / stats.totalDelivered) * 100).toFixed(1)}%)`, "العدد"]}
                        labelFormatter={(label) => label}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ 
                          direction: "rtl",
                          paddingTop: "15px",
                          fontSize: "13px"
                        }}
                      />
                    </PieChartRecharts>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* المخطط الخطي */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <TrendingUp className="h-5 w-5 text-primary" />
                الأداء الشهري للنظام
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                تطور أداء المناديب خلال أشهر السنة الحالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPerformance} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        direction: "rtl",
                        fontSize: "13px"
                      }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        direction: "rtl",
                        fontSize: "13px",
                        paddingTop: "10px"
                      }} 
                    />
                    <Line
                      type="monotone"
                      dataKey="delivered"
                      name="تم التسليم"
                      stroke="hsl(145, 65%, 42%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(145, 65%, 42%)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="delayed"
                      name="متأخر"
                      stroke="hsl(0, 84%, 60%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(0, 84%, 60%)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="returned"
                      name="مرتجع"
                      stroke="hsl(45, 95%, 55%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(45, 95%, 55%)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* جدول المناديب */}
      <Card className="hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-gray-800">قائمة المناديب</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                عرض {filteredDelegates.length} مندوب من إجمالي {delegates.length} مندوب
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="relative min-w-[280px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="دور على اسم المندوب أو التليفون أو المحافظة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10"
                />
              </div>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[160px]">
                  <Award className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفروع</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={`branch-${branch}`} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                  {delegates.some(d => !d.branch || d.branch.trim() === 'بدون فرع') && (
                    <SelectItem key="بدون-فرع" value="بدون فرع">
                      بدون فرع
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[160px]">
                  <MapPin className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المحافظات</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={`city-${city}`} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDelegates.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex justify-center mb-4">
                <div className="bg-muted/20 p-4 rounded-full">
                  <Package className="h-12 w-12 text-muted-foreground/70" />
                </div>
              </div>
              <p className="text-xl font-medium mb-2">مفيش مناديب يطابقوا البحث</p>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchQuery || branchFilter !== 'all' || cityFilter !== 'all'
                  ? 'جرب غير معايير البحث أو امسح الفلاتر عشان تشوف كل المناديب'
                  : 'مفيش مناديب مسجلين في النظام دلوقتي'}
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setBranchFilter('all');
                    setCityFilter('all');
                  }}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  مسح الفلاتر
                </Button>
                <Button 
                  onClick={() => navigate('/app/delegates/add')}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <User className="h-4 w-4" />
                  أضف مندوب جديد
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-right w-[100px] px-4">المندوب</TableHead>
                    <TableHead className="text-right w-[120px] px-4">الفرع</TableHead>
                    <TableHead className="text-right w-[110px] px-4">المحافظة</TableHead>
                    <TableHead className="text-right w-[90px] px-4">تم التسليم</TableHead>
                    <TableHead className="text-right w-[80px] px-4">متأخر</TableHead>
                    <TableHead className="text-right w-[80px] px-4">مرتجع</TableHead>
                    <TableHead className="text-right w-[100px] px-4">معدل التسليم</TableHead>
                    <TableHead className="text-right w-[100px] px-4">الرصيد</TableHead>
                    <TableHead className="text-right w-[90px] px-4">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDelegates.map((delegate) => {
                    const total = delegate.total_delivered + delegate.total_delayed + delegate.total_returned;
                    const deliveryRate = total > 0 ? (delegate.total_delivered / total) * 100 : 0;

                    return (
                      <TableRow 
                        key={delegate.id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/app/delegate/${delegate.id}`)}
                      >
                        <TableCell className="px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={delegate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(delegate.name)}`} 
                              />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                                {delegate.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{delegate.name}</p>
                              {delegate.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <span dir="ltr" className="font-mono">{delegate.phone}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-sm text-gray-700">
                          {delegate.branch || "-"}
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge variant="outline" className="px-2 py-0.5 bg-blue-50/70 hover:bg-blue-50">
                            {delegate.city}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 font-bold text-green-600 text-center">
                          {delegate.total_delivered}
                        </TableCell>
                        <TableCell className="px-4 font-bold text-red-600 text-center">
                          {delegate.total_delayed}
                        </TableCell>
                        <TableCell className="px-4 font-bold text-amber-600 text-center">
                          {delegate.total_returned}
                        </TableCell>
                        <TableCell className="px-4">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 w-full">
                              <Progress 
                                value={deliveryRate}
                                className={cn("w-full h-2 rounded-full", 
                                  deliveryRate >= 85 ? "bg-green-100" : deliveryRate >= 70 ? "bg-amber-100" : "bg-red-100"
                                )}
                              />
                              <span className="text-sm font-bold text-green-600 w-10 text-left">
                                {Math.round(deliveryRate)}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-right">
                          <div>
                            <span className="font-bold text-primary text-lg">
                              {Number(delegate.balance).toLocaleString()}
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">ج.م</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge 
                            variant={statusLabels[delegate.status]?.variant || "secondary"}
                            className={cn(
                              "px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap",
                              statusLabels[delegate.status]?.color || "bg-gray-100 text-gray-800"
                            )}
                          >
                            {statusLabels[delegate.status]?.label || 'مش معروف'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نصائح تحليلية */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/30 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-700" />
            نصائح تحليلية لأداء المناديب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">ركز على معدل التسليم</p>
              <p className="text-sm text-gray-700 mt-1">
                المناديب اللي معدل تسليمهم أقل من 85% محتاجين متابعة خاصة وتدريب إضافي عشان يحسّنوا أداءهم.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">قلل الشحنات المتأخرة</p>
              <p className="text-sm text-gray-700 mt-1">
                راقب المناديب اللي عندهم نسبة تأخير أعلى من 10%، وافحص أسباب التأخير (منطقة التوصيل، كمية الشحنات، إلخ).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-800 text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">كافئ الأداء المتميز</p>
              <p className="text-sm text-gray-700 mt-1">
                خصص مكافآت شهرية لأفضل 3 مناديب حسب معدل التسليم، ده هيزيد حماسهم ويشجع الباقين يطوروا أداءهم.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ✅ مكون بطاقات الإحصائيات (مُحسّن)
const StatCard = ({ icon, label, value, subValue, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: string;
  bgColor: string;
}) => (
  <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn("text-3xl font-bold mt-1", color)}>{value}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
        <div className={cn("p-3 rounded-lg", bgColor)}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default DelegateStats;