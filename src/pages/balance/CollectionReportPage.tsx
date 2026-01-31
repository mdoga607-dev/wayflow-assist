/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/balance/CollectionReportPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CollectionReportPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        // جلب الشحنات المسلمة فقط
        const { data, error } = await supabase
          .from('shipments')
          .select(`
            id,
            tracking_number,
            recipient_name,
            cod_amount,
            delivered_at,
            delegate:delegate_id(name, phone)
          `)
          .eq('status', 'delivered')
          .not('cod_amount', 'is', null)
          .gte('cod_amount', 1)
          .not('delivered_at', 'is', null)
          .order('delivered_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        
        setReports(data || []);
      } catch (err) {
        console.error('Error fetching reports:', err);
        toast({
          title: "فشل التحميل",
          description: "حدث خطأ أثناء تحميل التقارير. تأكد من وجود بيانات في قاعدة البيانات.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

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
            <BarChart3 className="h-7 w-7 text-primary" />
            تقارير التحصيلات
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض تقارير التحصيلات اليومية للمناديب
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <FileText className="h-4 w-4 ml-2" />
          تصدير كـ PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تقارير التحصيلات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">لا توجد تقارير للعرض</p>
              <p className="mb-4">سيتم عرض التقارير تلقائياً عند تسليم الشحنات</p>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-dashed max-w-xl mx-auto">
                <h3 className="font-medium mb-2">كيفية إنشاء تقرير تحصيلات؟</h3>
                <ol className="list-decimal pr-5 space-y-2 text-sm text-muted-foreground text-right">
                  <li>اذهب إلى <strong>الشحنات → كافية الشحنات</strong></li>
                  <li>اختر شحنة بحالة "قيد التوصيل"</li>
                  <li>غيّر الحالة إلى "تم التسليم"</li>
                  <li>سيظهر التقرير تلقائياً في هذه الصفحة</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-muted/50 text-right">
                    <th className="p-4 font-medium text-muted-foreground">رقم البوليصة</th>
                    <th className="p-4 font-medium text-muted-foreground">اسم المستلم</th>
                    <th className="p-4 font-medium text-muted-foreground">المندوب</th>
                    <th className="p-4 font-medium text-muted-foreground text-left">المبلغ (ر.س)</th>
                    <th className="p-4 font-medium text-muted-foreground">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr 
                      key={report.id} 
                      className={`border-b border-border ${
                        index % 2 === 0 ? 'bg-muted/10' : ''
                      }`}
                    >
                      <td className="p-4 font-medium text-primary">#{report.tracking_number}</td>
                      <td className="p-4">{report.recipient_name}</td>
                      <td className="p-4">{report.delegate?.name || '-'}</td>
                      <td className="p-4 font-bold text-green-600 text-left">
                        {report.cod_amount?.toLocaleString() || '0'}
                      </td>
                      <td className="p-4">
                        {report.delivered_at 
                          ? new Date(report.delivered_at).toLocaleDateString('ar-EG')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectionReportPage;