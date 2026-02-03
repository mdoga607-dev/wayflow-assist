// src/pages/BranchDashboardPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, Package, Truck, Wallet, MapPin, 
  TrendingUp, CheckCircle, AlertCircle 
} from 'lucide-react';

const BranchDashboardPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalShipments: 0,
    deliveredToday: 0,
    totalRevenue: 0,
    activeDelegates: 0,
    activeShippers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // جلب الإحصائيات من قاعدة البيانات
        const [
          storesRes,
          shipmentsRes,
          revenueRes,
          delegatesRes,
          shippersRes
        ] = await Promise.all([
          supabase.from('stores').select('id, status'),
          supabase.from('shipments').select('id, status, cod_amount, created_at'),
          supabase.from('balance_transactions').select('amount, transaction_type'),
          supabase.from('delegates').select('id, status').eq('status', 'active'),
          supabase.from('shippers').select('id, status').eq('status', 'active')
        ]);

        if (storesRes.error || shipmentsRes.error) throw new Error('فشل تحميل البيانات');

        // حساب الإحصائيات
        const today = new Date().toISOString().split('T')[0];
        
        setStats({
          totalStores: storesRes.data?.length || 0,
          activeStores: storesRes.data?.filter(s => s.status === 'active').length || 0,
          totalShipments: shipmentsRes.data?.length || 0,
          deliveredToday: shipmentsRes.data?.filter(s => 
            s.status === 'delivered' && 
            s.created_at.startsWith(today)
          ).length || 0,
          totalRevenue: shipmentsRes.data?.reduce((sum, s) => sum + (s.cod_amount || 0), 0) || 0,
          activeDelegates: delegatesRes.data?.length || 0,
          activeShippers: shippersRes.data?.length || 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        alert('فشل تحميل بيانات الداشبورد. تأكد من وجود جميع الجداول في قاعدة البيانات.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري تحميل داشبورد الفروع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            داشبورد الفروع
          </h1>
          <p className="text-muted-foreground mt-1">
            نظرة عامة على أداء جميع الفروع في الشركة
          </p>
        </div>
        <Badge className="bg-blue-500 text-white text-lg px-4 py-2">
          <TrendingUp className="h-4 w-4 inline-block ml-1" />
          أداء ممتاز
        </Badge>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفروع</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStores}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeStores} فرع نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشحنات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShipments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.deliveredToday} تم تسليمها اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">
              من المبالغ المحصلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المناديب النشطين</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDelegates}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeShippers} تاجر نشط
            </p>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل الفروع */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              توزيع الفروع حسب المدينة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>القاهرة</span>
                  <span className="font-medium">3 فروع</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary rounded-full h-2" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>الإسكندرية</span>
                  <span className="font-medium">1 فرع</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 rounded-full h-2" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>الجيزة</span>
                  <span className="font-medium">1 فرع</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 rounded-full h-2" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              أداء الفروع هذا الأسبوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>فرع المعادي</span>
                </div>
                <Badge className="bg-green-100 text-green-800">ممتاز</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>فرع المهندسين</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">جيد جداً</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>فرع التجمع الخامس</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">جيد</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>فرع الإسكندرية</span>
                </div>
                <Badge className="bg-green-100 text-green-800">ممتاز</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>فرع الجيزة</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">جيد جداً</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ملاحظات هامة */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">تحديث البيانات</p>
              <p className="text-sm text-muted-foreground mt-1">
                يتم تحديث البيانات تلقائياً كل 5 دقائق من قاعدة البيانات
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">تقارير مفصلة</p>
              <p className="text-sm text-muted-foreground mt-1">
                يمكن عرض تقارير مفصلة لكل فرع من خلال النقر على اسم الفرع في القائمة
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">تحسين الأداء</p>
              <p className="text-sm text-muted-foreground mt-1">
                يتم مراقبة أداء كل فرع لتحسين جودة الخدمة وسرعة التوصيل
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchDashboardPage;