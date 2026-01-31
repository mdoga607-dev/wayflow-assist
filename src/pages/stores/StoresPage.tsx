/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const StoresPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    // جلب المتاجر من قاعدة البيانات
    const timer = setTimeout(() => {
      setStores([
        { id: '1', name: 'فرع الرياض', city: 'الرياض', phone: '0112345678', status: 'نشط' },
        { id: '2', name: 'فرع جدة', city: 'جدة', phone: '0122345678', status: 'نشط' },
        { id: '3', name: 'فرع الدمام', city: 'الدمام', phone: '0132345678', status: 'غير نشط' },
      ]);
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
            إدارة المتاجر
          </h1>
          <p className="text-muted-foreground mt-1">عرض وإدارة جميع المتاجر والفروع</p>
        </div>
        <Button onClick={() => navigate('/app/stores/add')}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة متجر جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة المتاجر</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم المتجر أو المدينة..."
                className="pl-4 pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المتجر</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {store.city}
                  </TableCell>
                  <TableCell dir="ltr" className="font-mono">{store.phone}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      store.status === 'نشط' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {store.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">تعديل</Button>
                      <Button variant="outline" size="sm">تفاصيل</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoresPage;