/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Search, Filter, Download, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const CheckShipmentsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    // هنا يمكنك جلب البيانات من قاعدة البيانات
    // للاختبار، نستخدم بيانات تجريبية
    const timer = setTimeout(() => {
      setShipments([
        { id: '1', tracking: 'TRK123456', recipient: 'أحمد محمد', status: 'قيد الفحص', date: '2026-01-29' },
        { id: '2', tracking: 'TRK123457', recipient: 'خالد عبدالله', status: 'تم الفحص', date: '2026-01-28' },
        { id: '3', tracking: 'TRK123458', recipient: 'محمد سعيد', status: 'قيد الفحص', date: '2026-01-29' },
      ]);
      setLoading(false);
    }, 1000);
    
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
            <Package className="h-7 w-7 text-primary" />
            فحص الشحنات
          </h1>
          <p className="text-muted-foreground mt-1">عرض وفحص الشحنات قبل التوجيه للمناديب</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة شحنة للفحص
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة الشحنات قيد الفحص</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث برقم البوليصة أو اسم المستلم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-4 pr-10 w-full sm:w-80"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم البوليصة</TableHead>
                <TableHead>اسم المستلم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإضافة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono font-medium">{shipment.tracking}</TableCell>
                  <TableCell>{shipment.recipient}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      shipment.status === 'تم الفحص' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {shipment.status}
                    </span>
                  </TableCell>
                  <TableCell>{shipment.date}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">عرض التفاصيل</Button>
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

export default CheckShipmentsPage;