/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/stores/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Package,
  Truck,
  Wallet,
  MapPin,
  RefreshCcw,
  Loader2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  PieChart,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Branch {
  id: string;
  name: string;
  governorate: string;
  city: string | null;
  phone: string | null;
  status: string;
  opening_time: string | null;
  closing_time: string | null;
  shipments_count?: number;
  revenue?: number;
  delegates_count?: number;
}

interface Stats {
  totalBranches: number;
  activeBranches: number;
  totalShipments: number;
  totalDelegates: number;
  totalRevenue: number;
  totalGovernorates: number;
  todayShipments: number;
  pendingShipments: number;
  growthRate: number;
}

interface GovernorateStats {
  governorate: string;
  branch_count: number;
  shipment_count: number;
  revenue: number;
}

const StoresDashboardPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalBranches: 0,
    activeBranches: 0,
    totalShipments: 0,
    totalDelegates: 0,
    totalRevenue: 0,
    totalGovernorates: 0,
    todayShipments: 0,
    pendingShipments: 0,
    growthRate: 0
  });
  const [governorateStats, setGovernorateStats] = useState<GovernorateStats[]>([]);
  const [exporting, setExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لعرض داشبورد الفروع",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب البيانات
  const fetchData = async () => {
    try {
      setLoading(true);

      // جلب الفروع مع الإحصائيات
      const {  data: branchesData, error: branchesError } = await supabase
        .rpc('get_branches_dashboard');

      if (branchesError) throw branchesError;

      // جلب إحصائيات المحافظات
      const {  data: governoratesData, error: governoratesError } = await supabase
        .rpc('get_governorate_statistics');

      if (governoratesError) throw governoratesError;

      // حساب الإحصائيات العامة
      const totalBranches = branchesData?.length || 0;
      const activeBranches = branchesData?.filter((b: any) => b.status === 'active').length || 0;
      
      const totalShipments = branchesData?.reduce((sum: number, b: any) => sum + (b.shipments_count || 0), 0) || 0;
      const totalRevenue = branchesData?.reduce((sum: number, b: any) => sum + (b.revenue || 0), 0) || 0;
      const totalDelegates = branchesData?.reduce((sum: number, b: any) => sum + (b.delegates_count || 0), 0) || 0;
      
      // حساب الشحنات اليوم
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const {  data: todayData, error: todayError } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;
      
      // حساب الشحنات المعلقة
      const {  data: pendingData, error: pendingError } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'transit']);

      if (pendingError) throw pendingError;
      
      // حساب معدل النمو (مقارنة بالأسبوع الماضي)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const {  data: lastWeekData, error: lastWeekError } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', lastWeek.toISOString())
        .lt('created_at', today.toISOString());
      if (lastWeekError) throw lastWeekError;
      
      const lastWeekCount = lastWeekData?.count || 0;
      const growthRate = lastWeekCount > 0 
        ? Math.round(((todayData?.count || 0) - lastWeekCount) / lastWeekCount * 100) 
        : 0;

      setBranches(branchesData || []);
      setGovernorateStats(governoratesData || []);
      
      setStats({
        totalBranches,
        activeBranches,
        totalShipments,
        totalDelegates,
        totalRevenue,
        totalGovernorates: governoratesData?.length || 0,
        todayShipments: todayData?.count || 0,
        pendingShipments: pendingData?.count || 0,
        growthRate
      });
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchData();
    }
  }, [authLoading, role]);

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // تحضير البيانات
      const worksheetData = [
        ['داشبورد الفروع - تقرير مفصل'],
        ['تاريخ التصدير:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['الإحصائيات العامة'],
        ['إجمالي الفروع', 'الفرع النشطة', 'إجمالي الشحنات', 'المناديب النشطين', 'إجمالي الإيرادات', 'عدد المحافظات', 'شحنات اليوم', 'معدل النمو'],
        [
          stats.totalBranches,
          stats.activeBranches,
          stats.totalShipments,
          stats.totalDelegates,
          stats.totalRevenue.toLocaleString(),
          stats.totalGovernorates,
          stats.todayShipments,
          `${stats.growthRate}%`
        ],
        [],
        ['توزيع الفروع حسب المحافظة'],
        ['المحافظة', 'عدد الفروع', 'إجمالي الشحنات', 'الإيرادات'],
        ...governorateStats.map(g => [
          g.governorate,
          g.branch_count,
          g.shipment_count,
          g.revenue.toLocaleString()
        ]),
        [],
        ['تفاصيل الفروع'],
        ['اسم الفرع', 'المحافظة', 'المدينة', 'الهاتف', 'الحالة', 'عدد الشحنات', 'الإيرادات', 'عدد المناديب', 'وقت الافتتاح', 'وقت الإغلاق'],
        ...branches.map(b => [
          b.name,
          b.governorate,
          b.city || '-',
          b.phone || '-',
          b.status === 'active' ? 'نشط' : 'غير نشط',
          b.shipments_count || 0,
          (b.revenue || 0).toLocaleString(),
          b.delegates_count || 0,
          b.opening_time || '09:00',
          b.closing_time || '18:00'
        ])
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "داشبورد الفروع");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `داشبورد_الفروع_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير داشبورد الفروع إلى ملف Excel"
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  // دالة لتحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    return status === 'active' 
      ? <CheckCircle className="h-4 w-4 text-green-600" /> 
      : <Clock className="h-4 w-4 text-red-600" />;
  };

  // دالة لتحديد لون معدل النمو
  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل داشبورد الفروع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            داشبورد الفروع
          </h1>
          <p className="text-gray-600 mt-1">
            نظرة شاملة على أداء جميع الفروع والتوزيع الجغرافي في مصر
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث البيانات
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
          <Button 
            onClick={() => navigate('/app/stores')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <MapPin className="h-4 w-4" />
            إدارة الفروع
          </Button>
        </div>
      </div>

      {/* ملخص الأداء */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الفروع</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBranches}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {stats.activeBranches} فرع نشط
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الشحنات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalShipments.toLocaleString()}</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {stats.todayShipments} شحنة اليوم
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} ج.م</p>
                <p className={`text-sm font-medium flex items-center gap-1 ${getGrowthColor(stats.growthRate)}`}>
                  {stats.growthRate >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}% عن الأسبوع الماضي
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المناديب النشطين</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDelegates}</p>
                <p className="text-sm text-gray-600">في جميع الفروع</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <MapPin className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">تغطية الخدمة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalGovernorates} محافظة</p>
                <p className="text-sm text-gray-600">في مصر</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل التوصيل</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">94.5%</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              تحسن بنسبة 2.3% عن الشهر السابق
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط وقت التوصيل</p>
                <p className="text-2xl font-bold mt-1 text-green-700">2.3 يوم</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              أقل من المعدل الوطني (3.5 يوم)
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الشحنات المعلقة</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">{stats.pendingShipments}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              تحتاج متابعة عاجلة
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">رضا العملاء</p>
                <p className="text-2xl font-bold mt-1 text-orange-700">4.7/5.0</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              بناءً على تقييمات الشهر الحالي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* توزيع الفروع حسب المحافظة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-700" />
              توزيع الفروع حسب المحافظة
            </CardTitle>
            <CardDescription>
              عرض عدد الفروع والإيرادات في كل محافظة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {governorateStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>لا توجد بيانات للتوزيع الجغرافي</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {governorateStats.map((gov, index) => (
                  <div 
                    key={gov.governorate} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{gov.governorate}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {gov.branch_count} فرع
                          </span>
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {gov.shipment_count} شحنة
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-700">{gov.revenue.toLocaleString()} ج.م</p>
                      <p className="text-xs text-gray-500">إيرادات</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* أداء الفروع */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-700" />
              أداء أفضل الفروع
            </CardTitle>
            <CardDescription>
              الفروع الأعلى أداءً من حيث عدد الشحنات والإيرادات
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>لا توجد فروع لعرض أدائها</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {branches
                  .sort((a, b) => (b.shipments_count || 0) - (a.shipments_count || 0))
                  .slice(0, 5)
                  .map((branch, index) => (
                    <div 
                      key={branch.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/stores/${branch.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{branch.name}</p>
                          <p className="text-sm text-gray-600">{branch.governorate} - {branch.city || 'غير محدد'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <p className="font-bold text-green-700">{(branch.shipments_count || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">شحنة</p>
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <p className="font-bold text-blue-700">{(branch.revenue || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">ج.م</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* جدول الفروع */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-gray-800">قائمة جميع الفروع ({branches.length})</CardTitle>
              <CardDescription className="mt-1">
                عرض تفصيلي لجميع الفروع مع إحصائياتها وأوقات العمل
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                نشطة: {stats.activeBranches}
              </Badge>
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                إجمالي الشحنات: {stats.totalShipments.toLocaleString()}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                الإيرادات: {stats.totalRevenue.toLocaleString()} ج.م
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد فروع</p>
              <p className="max-w-md mx-auto">
                لم يتم إضافة أي فروع حتى الآن. يمكنك إضافة فرع جديد من صفحة إدارة الفروع.
              </p>
              <Button 
                onClick={() => navigate('/app/stores/add')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة فرع جديد
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-48">اسم الفرع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">المحافظة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المدينة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الشحنات</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الإيرادات</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المناديب</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">أوقات العمل</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow 
                      key={branch.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/stores/${branch.id}`)}
                    >
                      <TableCell className="font-medium text-gray-900">
                        {branch.name}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span>{branch.governorate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {branch.city || '-'}
                      </TableCell>
                      <TableCell className="font-medium text-blue-700">
                        {(branch.shipments_count || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-green-700">
                        {(branch.revenue || 0).toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {branch.delegates_count || 0}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 font-mono">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span>{branch.opening_time || '09:00'} - {branch.closing_time || '18:00'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(branch.status)}`}>
                          {getStatusIcon(branch.status)}
                          {branch.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/stores/${branch.id}`);
                          }}
                          className="h-8 hover:bg-blue-50 text-blue-700"
                        >
                          عرض التفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نصائح لتحسين الأداء */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            نصائح لتحسين أداء الفروع
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">تحسين التوزيع الجغرافي</p>
              <p className="text-sm text-gray-600 mt-1">
                ركز على زيادة عدد الفروع في المحافظات ذات الكثافة السكانية العالية مثل القاهرة والجيزة لزيادة التغطية
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">زيادة الكفاءة التشغيلية</p>
              <p className="text-sm text-gray-600 mt-1">
                قلل أوقات الانتظار في الفروع ذات معدلات التوصيل المنخفضة من خلال تحسين جدولة المناديب
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">تعزيز الإيرادات</p>
              <p className="text-sm text-gray-600 mt-1">
                ركز على الفروع ذات الإيرادات المنخفضة وحلل أسباب ذلك لوضع خطط تحسين مخصصة
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">مراقبة الأداء</p>
              <p className="text-sm text-gray-600 mt-1">
                استخدم هذا الداشبورد لمراجعة أداء الفروع أسبوعياً واتخاذ قرارات مبنية على البيانات
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// أيقونة الزائد
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export default StoresDashboardPage;