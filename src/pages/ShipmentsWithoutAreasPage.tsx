/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Package, Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const ShipmentsWithoutAreasPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShipments([
        { 
          id: '1', 
          tracking: 'TRK987654', 
          recipient: 'أحمد علي', 
          address: 'شارع الملك فهد، حي السفارات', 
          city: 'الرياض', 
          area: 'غير محدد', 
          cod: 245, 
          status: 'قيد الانتظار' 
        },
        { 
          id: '2', 
          tracking: 'TRK987655', 
          recipient: 'محمد خالد', 
          address: 'حي الشرفية، شارع الأمير محمد', 
          city: 'جدة', 
          area: 'غير محدد', 
          cod: 180, 
          status: 'قيد الانتظار' 
        },
        { 
          id: '3', 
          tracking: 'TRK987656', 
          recipient: 'سعود عبدالله', 
          address: 'حي اليرموك، شارع الملك عبدالعزيز', 
          city: 'الدمام', 
          area: 'غير محدد', 
          cod: 320, 
          status: 'قيد الانتظار' 
        },
      ]);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleAssignArea = (shipmentId: string) => {
    toast({ 
      title: "تم التعيين بنجاح", 
      description: "تم تعيين المنطقة للشحنة بنجاح" 
    });
    // هنا يمكنك إضافة منطق التعيين الفعلي
  };

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
          <h1 className="text-2xl font-bold flex items-center gap-2 text-destructive">
            <AlertCircle className="h-7 w-7" />
            شحنات بدون مناطق
          </h1>
          <p className="text-muted-foreground mt-1">الشحنات التي لم يتم تحديد منطقتها الجغرافية بعد</p>
        </div>
        <Button variant="destructive">
          <Package className="h-4 w-4 ml-2" />
          معالجة جميع الشحنات
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>الشحنات المطلوب معالجتها</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث برقم البوليصة أو اسم المستلم..."
                className="pl-4 pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم البوليصة</TableHead>
                  <TableHead>اسم المستلم</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>المنطقة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id} className="hover:bg-destructive/5">
                    <TableCell className="font-mono font-medium">{shipment.tracking}</TableCell>
                    <TableCell className="font-medium">{shipment.recipient}</TableCell>
                    <TableCell className="max-w-xs truncate">{shipment.address}</TableCell>
                    <TableCell>{shipment.city}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{shipment.area}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">{shipment.cod} ر.س</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{shipment.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAssignArea(shipment.id)}
                        >
                          <MapPin className="h-3 w-3 ml-1" />
                          تعيين منطقة
                        </Button>
                        <Button variant="outline" size="sm">عرض التفاصيل</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">
                ⚠️ هذه الشحنات لن يتم تعيينها لأي مندوب حتى يتم تحديد منطقتها الجغرافية. 
                يرجى معالجة هذه الشحنات فوراً لتجنب التأخير في التوصيل.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentsWithoutAreasPage;