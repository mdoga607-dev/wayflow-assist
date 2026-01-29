/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/balance/CollectionReport.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Calendar, FileText, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CollectionReportItem {
  delegate_name: string;
  delegate_phone: string;
  total_collected: number;
  shipment_count: number;
  collection_date: string;
}

const CollectionReport = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<CollectionReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [delegateId, setDelegateId] = useState('');

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب التقارير
  const fetchReports = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('shipments')
        .select(`
          delegate_id,
          delegates(name, phone),
          cod_amount,
          delivered_at
        `)
        .not('cod_amount', 'is', null)
        .gte('cod_amount', 1)
        .not('delivered_at', 'is', null);

      // تصفية بالتاريخ
      if (dateFrom) {
        query = query.gte('delivered_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('delivered_at', `${dateTo}T23:59:59`);
      }

      // تصفية بالمندوب
      if (delegateId) {
        query = query.eq('delegate_id', delegateId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // معالجة البيانات وتجميعها حسب المندوب والتاريخ
      const reportMap = new Map<string, CollectionReportItem>();
      
      (data || []).forEach((shipment) => {
        // تخطي الشحنات بدون مندوب
        if (!shipment.delegate_id) return;
        
        const date = shipment.delivered_at.split('T')[0];
        const key = `${shipment.delegate_id}-${date}`;
        
        if (!reportMap.has(key)) {
          reportMap.set(key, {
            delegate_name: (shipment.delegates as any)?.name || 'غير معروف',
            delegate_phone: (shipment.delegates as any)?.phone || '',
            total_collected: 0,
            shipment_count: 0,
            collection_date: date
          });
        }
        
        const current = reportMap.get(key)!;
        current.total_collected += shipment.cod_amount || 0;
        current.shipment_count += 1;
      });

      setReports(Array.from(reportMap.values()));
    } catch (err) {
      console.error('Error fetching reports:', err);
      alert('حدث خطأ أثناء تحميل التقارير. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي
  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo, delegateId]);

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
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            تقارير التحصيلات (مناديب)
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض تقارير التحصيلات اليومية للمناديب مع إجمالي المبالغ المحصلة
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            // تصدير إلى Excel
            const csvContent = "text/csv;charset=utf-8,\uFEFF" + 
              "التاريخ,المندوب,الهاتف,عدد الشحنات,إجمالي التحصيل (ر.س)\n" +
              reports.map(r => 
                `${r.collection_date},${r.delegate_name},${r.delegate_phone},${r.shipment_count},${r.total_collected}`
              ).join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `collection-report-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('تم تصدير التقرير بنجاح!');
          }}
          className="gap-2"
          disabled={reports.length === 0 || loading}
        >
          <Download className="h-4 w-4" />
          تصدير كـ CSV
        </Button>
      </div>

      {/* فلاتر البحث */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">من تاريخ</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">إلى تاريخ</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">اختر مندوب</label>
              <Select value={delegateId} onValueChange={setDelegateId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مندوباً" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المناديب</SelectItem>
                  <SelectItem value="demo1">أحمد محمد</SelectItem>
                  <SelectItem value="demo2">خالد عبدالله</SelectItem>
                  <SelectItem value="demo3">محمد سعيد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={fetchReports} 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    جاري التحميل...
                  </>
                ) : (
                  'بحث'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول التقارير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            نتائج التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-muted-foreground">جاري تحميل التقارير...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">لا توجد بيانات تطابق معايير البحث</p>
              <p className="mt-2">يرجى تعديل الفلاتر والمحاولة مرة أخرى</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">التاريخ</TableHead>
                    <TableHead className="whitespace-nowrap">المندوب</TableHead>
                    <TableHead className="whitespace-nowrap">الهاتف</TableHead>
                    <TableHead className="text-center whitespace-nowrap">عدد الشحنات</TableHead>
                    <TableHead className="text-right whitespace-nowrap">إجمالي التحصيل (ر.س)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-mono">{report.collection_date}</TableCell>
                      <TableCell className="font-medium">{report.delegate_name}</TableCell>
                      <TableCell dir="ltr" className="font-mono">{report.delegate_phone}</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{report.shipment_count}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {report.total_collected.toLocaleString('ar-SA')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectionReport;