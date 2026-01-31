import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Truck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PickupRequestsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-7 w-7 text-primary" />
            طلبات البيك أب
          </h1>
          <p className="text-muted-foreground mt-1">عرض وإدارة طلبات استلام الشحنات من التجار</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة طلب بيك أب
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة طلبات البيك أب</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>التاجر</TableHead>
                <TableHead>عدد الشحنات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>PB-1001</TableCell>
                <TableCell>شركة النور للتجارة</TableCell>
                <TableCell>15</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">قيد الانتظار</span>
                </TableCell>
                <TableCell>2026-01-29 10:30</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">عرض التفاصيل</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PB-1002</TableCell>
                <TableCell>متجر الفخر الإلكتروني</TableCell>
                <TableCell>8</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">تم الاستلام</span>
                </TableCell>
                <TableCell>2026-01-28 14:15</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">عرض التفاصيل</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickupRequestsPage;