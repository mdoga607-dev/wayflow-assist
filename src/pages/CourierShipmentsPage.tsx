// src/pages/CourierShipmentsPage.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Package, Truck, MapPin, Phone, Wallet, AlertCircle, 
  RefreshCcw, Loader2, User, CheckCircle, XCircle, Download 
} from 'lucide-react';

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: string;
  recipient_area?: string;
  cod_amount: number;
  status: string;
  created_at: string;
  delegate?: {
    name: string;
    phone: string;
  } | null;
}

const CourierShipmentsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [delegate, setDelegate] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const delegateId = searchParams.get('delegate_id');

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager', 'courier'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    if (!delegateId) {
      setError('لم يتم تحديد مندوب. يرجى اختيار مندوب من القائمة.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // جلب بيانات المندوب
        const { data: delegateData, error: delegateError } = await supabase
          .from('delegates')
          .select('id, name, phone')
          .eq('id', delegateId)
          .single();

        if (delegateError || !delegateData) {
          throw new Error('لم يتم العثور على المندوب المطلوب. تأكد من صحة المعرف.');
        }

        setDelegate(delegateData);

        // جلب شحنات المندوب
        const { data: shipmentsData, error: shipmentsError } = await supabase
          .from('shipments')
          .select(`
            *,
            delegate:delegate_id (name, phone)
          `)
          .eq('delegate_id', delegateId)
          .in('status', ['pending', 'transit', 'out_for_delivery'])
          .order('created_at', { ascending: false });

        if (shipmentsError) {
          console.error('Supabase Error:', shipmentsError);
          throw new Error('فشل تحميل شحنات المندوب. تأكد من وجود العلاقة بين الجداول.');
        }

        setShipments(shipmentsData || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير معروف';
        setError(errorMessage);
        console.error('Error fetching courier shipments:', err);
        toast({
          title: "فشل التحميل",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [delegateId]);

  const handleRefresh = () => {
    if (delegateId) {
      window.location.reload();
    }
  };

  const handleMarkAsDelivered = async (shipmentId: string, trackingNumber: string) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', shipmentId);

      if (error) throw error;

      toast({
        title: "تم التسليم بنجاح",
        description: `الشحنة ${trackingNumber} تم تسليمها بنجاح`,
      });

      // تحديث القائمة
      setShipments(prev => 
        prev.map(s => 
          s.id === shipmentId ? { ...s, status: 'delivered' } : s
        ).filter(s => s.status !== 'delivered')
      );
    } catch (err) {
      toast({
        title: "فشل التحديث",
        description: "حدث خطأ أثناء تحديث حالة الشحنة",
        variant: "destructive",
      });
      console.error('Error marking as delivered:', err);
    }
  };

  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      // تصدير البيانات إلى Excel (مثال بسيط)
      const csvContent = [
        ['رقم التتبع', 'اسم المستلم', 'رقم الهاتف', 'العنوان', 'المدينة', 'المبلغ', 'الحالة'],
        ...shipments.map(s => [
          s.tracking_number,
          s.recipient_name,
          s.recipient_phone,
          s.recipient_address,
          s.recipient_city,
          s.cod_amount.toString(),
          s.status
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `شحنات_${delegate?.name}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${shipments.length} شحنة إلى ملف CSV`
      });
    } catch (err) {
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">
            {delegate ? `جاري تحميل شحنات ${delegate.name}...` : 'جاري تحميل بيانات المندوب...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">خطأ في تحميل الصفحة</CardTitle>
            <p className="text-muted-foreground mt-2">{error}</p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/app/delegates')}
            >
              <User className="h-4 w-4 ml-2" />
              العودة لقائمة المناديب
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!delegate) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-800">لم يتم العثور على المندوب</CardTitle>
            <p className="text-muted-foreground mt-2">
              المعرف المطلوب غير صالح أو المندوب غير موجود في النظام
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/app/delegates')}
            >
              <User className="h-4 w-4 ml-2" />
              عرض قائمة المناديب
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            شحنات مندوب: {delegate.name}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            {delegate.phone}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
          <Button 
            onClick={handleExportToExcel} 
            disabled={exporting || shipments.length === 0}
            variant="outline"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4 ml-2" />
            )}
            تصدير إلى Excel
          </Button>
          <Button onClick={() => navigate('/app/delegates')}>
            <XCircle className="h-4 w-4 ml-2" />
            إغلاق
          </Button>
        </div>
      </div>

      {/* ملخص الشحنات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                <p className="text-2xl font-bold mt-1">{shipments.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المبلغ المستحق</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {shipments.reduce((sum, s) => sum + (s.cod_amount || 0), 0).toLocaleString()} ر.س
                </p>
              </div>
              <Wallet className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط الشحنة</p>
                <p className="text-2xl font-bold mt-1">
                  {shipments.length > 0 
                    ? (shipments.reduce((sum, s) => sum + (s.cod_amount || 0), 0) / shipments.length).toFixed(0)
                    : '0'} ر.س
                </p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول الشحنات */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                قائمة الشحنات ({shipments.length})
              </CardTitle>
              <CardDescription>
                شحنات المندوب {delegate.name} الجاهزة للتوصيل
              </CardDescription>
            </div>
            {shipments.length > 0 && (
              <Button 
                size="sm" 
                onClick={() => {
                  if (confirm('هل أنت متأكد من تسليم جميع الشحنات المعروضة؟')) {
                    // يمكنك إضافة وظيفة لتسليم الكل هنا
                    toast({ title: "سيتم إضافة هذه الميزة لاحقاً" });
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-3 w-3 ml-1" />
                تسليم الكل
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">لا توجد شحنات نشطة لهذا المندوب</p>
              <p className="max-w-md mx-auto">
                جميع شحنات هذا المندوب تم تسليمها أو إرجاعها. 
                يمكنك عرض جميع الشحنات من خلال صفحة "كافة الشحنات".
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate('/app/shipments')}>
                  <Package className="h-4 w-4 ml-2" />
                  عرض جميع الشحنات
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>رقم التتبع</TableHead>
                    <TableHead>المستلم</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow 
                      key={shipment.id} 
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium font-mono">{shipment.tracking_number}</TableCell>
                      <TableCell>{shipment.recipient_name}</TableCell>
                      <TableCell dir="ltr" className="font-mono">{shipment.recipient_phone}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <div>
                          <div>{shipment.recipient_address}</div>
                          <div className="text-xs text-muted-foreground">
                            {shipment.recipient_city}{shipment.recipient_area && ` - ${shipment.recipient_area}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {shipment.cod_amount.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          shipment.status === 'out_for_delivery' ? 'default' :
                          shipment.status === 'transit' ? 'secondary' : 'outline'
                        }>
                          {shipment.status === 'pending' && 'قيد الانتظار'}
                          {shipment.status === 'transit' && 'قيد التوصيل'}
                          {shipment.status === 'out_for_delivery' && 'خارج للتوصيل'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsDelivered(shipment.id, shipment.tracking_number)}
                          className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          تسليم
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

      {/* إرشادات هامة */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-medium text-blue-800 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                إرشادات هامة للمناديب:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1.5 pr-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>قبل التسليم، تأكد من هوية المستلم ومطابقة بياناته مع البوليصة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>احصل على توقيع المستلم على البوليصة الإلكترونية في التطبيق</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>في حالة عدم التواجد، حاول الاتصال بالمستلم مرتين على الأقل قبل الإرجاع</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>أي مشكلة في العنوان أو تعليمات التوصيل، تواصل فوراً مع مركز التحكم</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>احتفظ بإثبات التسليم (صورة التوقيع) لمدة 30 يوماً على الأقل</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourierShipmentsPage;