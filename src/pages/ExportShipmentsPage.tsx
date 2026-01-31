/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ExportShipmentsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const ExportShipmentsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // جلب الشحنات من قاعدة البيانات
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          tracking_number,
          recipient_name,
          recipient_phone,
          recipient_address,
          recipient_city,
          cod_amount,
          shipping_fee,
          status,
          created_at,
          delegate:delegate_id(name),
          shipper:shipper_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast({
          title: "لا توجد بيانات",
          description: "لا توجد شحنات للتصدير. يرجى إضافة شحنات أولاً.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // تحويل البيانات لتنسيق إكسل
      const exportData = data.map((shipment: any) => ({
        'رقم البوليصة': shipment.tracking_number,
        'اسم المستلم': shipment.recipient_name,
        'رقم الهاتف': shipment.recipient_phone,
        'العنوان': shipment.recipient_address,
        'المدينة': shipment.recipient_city,
        'المبلغ (ر.س)': shipment.cod_amount || 0,
        'رسوم الشحن (ر.س)': shipment.shipping_fee || 0,
        'الحالة': shipment.status,
        'تاريخ الإنشاء': new Date(shipment.created_at).toLocaleString('ar-EG'),
        'المندوب': shipment.delegate?.name || '-',
        'التاجر': shipment.shipper?.name || '-',
      }));

      // إنشاء ملف إكسل
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'الشحنات');
      
      // حفظ الملف
      const fileName = `شحنات_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${data.length} شحنة إلى ملف إكسل`
      });

    } catch (error) {
      console.error('Error exporting shipments:', error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير البيانات. تأكد من وجود بيانات في قاعدة البيانات.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            تصدير الشحنات إلى إكسل
          </h1>
          <p className="text-muted-foreground mt-1">
            اضغط على الزر أدناه لتصدير جميع الشحنات إلى ملف إكسل
          </p>
        </div>
        <Button onClick={() => navigate(-1)}>
          <FileText className="h-4 w-4 ml-2" />
          العودة للقائمة الرئيسية
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تصدير البيانات</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mb-6">
            <FileText className="h-24 w-24 mx-auto text-primary/20" />
          </div>
          
          <p className="text-lg font-medium mb-4">
            سيتم تصدير جميع الشحنات الموجودة في النظام إلى ملف إكسل
          </p>
          
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            ⚠️ <strong>ملاحظة هامة:</strong> إذا كانت قاعدة البيانات فارغة، لن يتم تصدير أي بيانات. 
            يرجى التأكد من وجود شحنات في النظام قبل التصدير.
          </p>
          
          <Button 
            onClick={handleExport} 
            disabled={loading}
            size="lg"
            className="min-w-[250px] text-lg py-6"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 ml-2" />
                تصدير إلى إكسل
              </>
            )}
          </Button>
          
          <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-dashed">
            <h3 className="font-medium mb-2">كيفية إضافة بيانات للاختبار؟</h3>
            <ol className="list-decimal pr-5 space-y-2 text-sm text-muted-foreground text-right">
              <li>اذهب إلى <strong>الشحنات → إضافة شحنة</strong></li>
              <li>أدخل بيانات شحنة تجريبية (رقم بوليصة، اسم مستلم، إلخ)</li>
              <li>احفظ الشحنة</li>
              <li>عد إلى هذه الصفحة وحاول التصدير مرة أخرى</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportShipmentsPage;