/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, Truck, Wallet, MapPin, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Branch {
  id: string;
  name: string;
  governorate: string;
  city: string | null;
  phone: string | null;
  status: string;
  opening_time: string | null;
  closing_time: string | null;
}

interface Stats {
  totalBranches: number;
  activeBranches: number;
  totalShipments: number;
  totalDelegates: number;
  totalRevenue: number;
  totalGovernorates: number;
}

const StoresDashboardPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalBranches: 0,
    activeBranches: 0,
    totalShipments: 0,
    totalDelegates: 0,
    totalRevenue: 0,
    totalGovernorates: 0
  });

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // جلب الفروع
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (branchesError) throw branchesError;

      // جلب إحصائيات إضافية
      const { count: shipmentsCount } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true });

      const { count: delegatesCount } = await supabase
        .from('delegates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: governoratesCount } = await supabase
        .from('governorates')
        .select('*', { count: 'exact', head: true });

      // حساب الإيرادات من الشحنات المسلمة
      const { data: deliveredShipments } = await supabase
        .from('shipments')
        .select('cod_amount, shipping_fee')
        .eq('status', 'delivered');

      const totalRevenue = (deliveredShipments || []).reduce(
        (sum, s) => sum + (s.cod_amount || 0) + (s.shipping_fee || 0), 0
      );

      setBranches(branchesData || []);
      setStats({
        totalBranches: branchesData?.length || 0,
        activeBranches: branchesData?.filter(b => b.status === 'active').length || 0,
        totalShipments: shipmentsCount || 0,
        totalDelegates: delegatesCount || 0,
        totalRevenue,
        totalGovernorates: governoratesCount || 0
      });
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطأ في التحميل',
        description: error.message || 'فشل تحميل البيانات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCcw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button onClick={() => navigate('/app/stores')}>
            <MapPin className="h-4 w-4 ml-2" />
            عرض جميع الفروع
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفروع</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBranches}</div>
            <p className="text-xs text-muted-foreground">{stats.activeBranches} فرع نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشحنات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShipments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">في النظام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المناديب النشطين</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDelegates}</div>
            <p className="text-xs text-muted-foreground">في جميع الفروع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">من الشحنات المسلمة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تغطية الخدمة</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGovernorates} محافظة</div>
            <p className="text-xs text-muted-foreground">في مصر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل التوصيل</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">-</div>
            <p className="text-xs text-muted-foreground">يحتاج بيانات</p>
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
                  <TableHead>المحافظة</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>وقت الافتتاح</TableHead>
                  <TableHead>وقت الإغلاق</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد فروع
                    </TableCell>
                  </TableRow>
                ) : (
                  branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.governorate}</TableCell>
                      <TableCell>{branch.city || '-'}</TableCell>
                      <TableCell className="font-mono">{branch.phone || '-'}</TableCell>
                      <TableCell className="font-mono">{branch.opening_time || '09:00'}</TableCell>
                      <TableCell className="font-mono">{branch.closing_time || '18:00'}</TableCell>
                      <TableCell>
                        <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                          {branch.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoresDashboardPage;