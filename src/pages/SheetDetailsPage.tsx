/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, Truck, MapPin, Package, AlertCircle, 
  RefreshCcw, Printer, ArrowRight, Clock
} from 'lucide-react';

const SheetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  
  const [sheet, setSheet] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. دالة جلب البيانات باستخدام كود الربط الصحيح
  const fetchSheetData = async () => {
    try {
      setLoading(true);
      setError(null);

      // الجلب الصحيح لتفادي أخطاء Join في Schema Cache
      const { data: sheetData, error: sheetError } = await supabase
        .from('sheets')
        .select(`
          *,
          delegate:delegate_id (
            name, 
            phone
          ),
          store:store_id (
            name,
            address
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (sheetError) throw sheetError;
      
      if (!sheetData) {
        setError("هذا الشيت غير موجود في النظام.");
        return;
      }

      setSheet(sheetData);

      // جلب الشحنات المرتبطة بهذا الشيت
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select('*')
        .eq('sheet_id', id)
        .order('created_at', { ascending: false });

      if (shipmentsError) throw shipmentsError;
      setShipments(shipmentsData || []);

    } catch (err: any) {
      console.error("Fetch error:", err.message);
      setError(err.message);
      toast({
        title: "خطأ في جلب البيانات",
        description: "تأكد من وجود العلاقات delegate_id و store_id في قاعدة البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && !authLoading) {
      fetchSheetData();
    }
  }, [id, authLoading]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <RefreshCcw className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground italic">جاري تحميل تفاصيل الشيت...</p>
    </div>
  );

  if (error || !sheet) return (
    <div className="container py-20 text-center" dir="rtl">
      <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-destructive mb-2">خطأ في التحميل</h2>
      <p className="text-muted-foreground mb-6">{error || "لم يتم العثور على البيانات"}</p>
      <Button onClick={() => navigate(-1)}>العودة للخلف</Button>
    </div>
  );

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="text-primary" /> {sheet.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>تم الإنشاء في: {new Date(sheet.created_at).toLocaleString('ar-EG')}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default" onClick={() => window.print()} className="bg-primary">
            <Printer className="ml-2 h-4 w-4" /> طباعة الشيت
          </Button>
        </div>
      </div>

      {/* ملخص المعلومات الأساسية */}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-r-4 border-r-blue-600 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">المندوب المسؤول</p>
                <p className="font-bold text-lg">{sheet.delegate?.name || 'غير محدد'}</p>
                <p className="text-xs text-muted-foreground">{sheet.delegate?.phone || '---'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-600 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-full text-purple-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">المتجر / الفرع</p>
                <p className="font-bold text-lg">{sheet.store?.name || 'غير محدد'}</p>
                <p className="text-xs text-muted-foreground">{sheet.store?.address || '---'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-emerald-600 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-full text-emerald-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">الحالة الحالية</p>
                <Badge className="mt-1" variant={sheet.status === 'active' ? 'default' : 'secondary'}>
                  {sheet.status === 'active' ? 'نشط' : 'مكتمل'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول الشحنات */}
      <Card className="shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex justify-between items-center">
            قائمة الشحنات المدرجة
            <Badge variant="outline" className="font-mono">{shipments.length} شحنة</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="text-right">رقم التتبع</TableHead>
                <TableHead className="text-right">المستلم</TableHead>
                <TableHead className="text-right">المدينة</TableHead>
                <TableHead className="text-right">المبلغ (COD)</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                    لا توجد شحنات مضافة لهذا الشيت بعد.
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono font-medium text-primary tracking-tighter">
                      {item.tracking_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.recipient_name}</span>
                        <span className="text-xs text-muted-foreground">{item.recipient_phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.recipient_city}</TableCell>
                    <TableCell className="font-bold text-emerald-700">{item.cod_amount} ر.س</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SheetDetailsPage;