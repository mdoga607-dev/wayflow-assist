import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, Truck, Wallet, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const StoresDashboardPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStores: 15,
    activeStores: 12,
    totalShipments: 4580,
    totalCouriers: 85,
    totalRevenue: 245600,
    coverage: 28
  });

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            داش بورد الفروع
          </h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على أداء جميع الفروع في النظام</p>
        </div>
        <Button onClick={() => navigate('/app/stores')}>
          <MapPin className="h-4 w-4 ml-2" />
          عرض جميع الفروع
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفروع</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStores}</div>
            <p className="text-xs text-muted-foreground">12 فرع نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشحنات اليومية</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">328</div>
            <p className="text-xs text-muted-foreground">+12% عن الأمس</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المناديب النشطين</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCouriers}</div>
            <p className="text-xs text-muted-foreground">في جميع الفروع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات اليومية</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">+8% عن الأمس</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل التوصيل</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94.5%</div>
            <p className="text-xs text-muted-foreground">خلال 24 ساعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تغطية الخدمة</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coverage} محافظة</div>
            <p className="text-xs text-muted-foreground">في المملكة</p>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>أداء الفروع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الفرع</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>الشحنات اليوم</TableHead>
                  <TableHead>معدل التوصيل</TableHead>
                  <TableHead>الإيرادات</TableHead>
                  <TableHead>المناديب النشطين</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">فرع الرياض</TableCell>
                  <TableCell>الرياض</TableCell>
                  <TableCell className="font-medium">145</TableCell>
                  <TableCell className="text-green-600 font-medium">96.2%</TableCell>
                  <TableCell>85,450 ر.س</TableCell>
                  <TableCell>32</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">نشط</span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">فرع جدة</TableCell>
                  <TableCell>جدة</TableCell>
                  <TableCell className="font-medium">112</TableCell>
                  <TableCell className="text-green-600 font-medium">93.8%</TableCell>
                  <TableCell>62,300 ر.س</TableCell>
                  <TableCell>28</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">نشط</span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">فرع الدمام</TableCell>
                  <TableCell>الدمام</TableCell>
                  <TableCell className="font-medium">71</TableCell>
                  <TableCell className="text-yellow-600 font-medium">89.5%</TableCell>
                  <TableCell>38,750 ر.س</TableCell>
                  <TableCell>18</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">تحت المراقبة</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoresDashboardPage;