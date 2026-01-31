/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/balance/PaymentReportPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Wallet, Download, Calendar, Filter, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface PaymentReport {
  id: string;
  date: string;
  delegate_name?: string;
  shipper_name?: string;
  amount: number;
  method: string;
  status: string;
  notes?: string;
}

const PaymentReportPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<PaymentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    delegate: 'all',
    paymentMethod: 'all',
  });

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      
      try {
        let query = supabase
          .from('balance_transactions')
          .select(`
            id,
            amount,
            transaction_type,
            payment_method,
            transaction_date,
            notes,
            delegates!inner (name as delegate_name),
            shippers!inner (name as shipper_name)
          `)
          .eq('transaction_type', 'payment')
          .order('transaction_date', { ascending: false })
          .limit(100);

        // تطبيق المرشحات
        if (filters.fromDate) {
          query = query.gte('transaction_date', filters.fromDate);
        }
        if (filters.toDate) {
          query = query.lte('transaction_date', `${filters.toDate}T23:59:59`);
        }
        if (filters.delegate !== 'all') {
          query = query.eq('delegate_id', filters.delegate);
        }
        if (filters.paymentMethod !== 'all') {
          query = query.eq('payment_method', filters.paymentMethod);
        }

        const { data, error } = await query;

        if (error) throw error;

        // معالجة البيانات
        const processedReports = (data || []).map((item: any) => ({
          id: item.id,
          date: item.transaction_date.split('T')[0],
          delegate_name: item.delegates?.delegate_name || '-',
          shipper_name: item.shippers?.shipper_name || '-',
          amount: item.amount,
          method: item.payment_method || 'cash',
          status: 'مكتمل',
          notes: item.notes || '-',
        }));

        setReports(processedReports);
      } catch (err) {
        console.error('Error fetching payment reports:', err);
        toast({
          title: "فشل التحميل",
          description: "حدث خطأ أثناء تحميل تقارير التوريدات",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [filters]);

  const handleExport = () => {
    if (reports.length === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا توجد تقارير للتصدير",
        variant: "destructive"
      });
      return;
    }

    try {
      // تحويل البيانات لتنسيق إكسل
      const exportData = reports.map(report => ({
        'تاريخ التوريد': report.date,
        'المندوب': report.delegate_name,
        'التاجر': report.shipper_name,
        'المبلغ (ر.س)': report.amount,
        'طريقة الدفع': report.method === 'cash' ? 'نقدي' : 
                       report.method === 'bank_transfer' ? 'بنكي' : 
                       report.method === 'wallet' ? 'محفظة' : 'آجل',
        'الحالة': report.status,
        'ملاحظات': report.notes,
      }));

      // إنشاء ملف إكسل
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'تقارير التوريد النقدي');
      
      // حفظ الملف
      const fileName = `تقارير_التوريد_النقدي_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${reports.length} تقرير إلى ملف إكسل`
      });

    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive"
      });
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
            <BarChart3 className="h-7 w-7 text-primary" />
            تقارير التوريدات (التوريد للبائعين)
          </h1>
          <p className="text-muted-foreground mt-1">
            تقارير مفصلة عن التوريدات النقدية من المناديب للبائعين
          </p>
        </div>
        <Button onClick={handleExport} disabled={reports.length === 0 || loading}>
          <Download className="h-4 w-4 ml-2" />
          تصدير التقرير
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>تصفية التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">من تاريخ</Label>
              <Input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">إلى تاريخ</Label>
              <Input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delegate">المندوب</Label>
              <Select 
                value={filters.delegate} 
                onValueChange={(value) => setFilters({ ...filters, delegate: value })}
              >
                <SelectTrigger id="delegate">
                  <SelectValue placeholder="اختر مندوب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المناديب</SelectItem>
                  <SelectItem value="demo1">أحمد محمد</SelectItem>
                  <SelectItem value="demo2">خالد عبدالله</SelectItem>
                  <SelectItem value="demo3">محمد سعيد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">طريقة الدفع</Label>
              <Select 
                value={filters.paymentMethod} 
                onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="اختر الطريقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطرق</SelectItem>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="bank_transfer">حوالة بنكية</SelectItem>
                  <SelectItem value="wallet">محفظة إلكترونية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => {}} disabled={loading}>
                <Filter className="h-4 w-4 ml-2" />
                تطبيق التصفية
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التوريدات</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports.reduce((sum, r) => sum + r.amount, 0).toLocaleString('ar-SA')} ر.س
            </div>
            <p className="text-xs text-muted-foreground">خلال الفترة المحددة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد التوريدات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">توريدة نقدية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التوريدة</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.length > 0 
                ? (reports.reduce((sum, r) => sum + r.amount, 0) / reports.length).toLocaleString('ar-SA') 
                : '0'} ر.س
            </div>
            <p className="text-xs text-muted-foreground">لكل توريدة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الشحنات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">69</div>
            <p className="text-xs text-muted-foreground">شحنة محصلة</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل التوريدات النقدية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاريخ التوريد</TableHead>
                  <TableHead>المندوب</TableHead>
                  <TableHead>التاجر</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono">{report.date}</TableCell>
                    <TableCell className="font-medium">{report.delegate_name}</TableCell>
                    <TableCell className="font-medium">{report.shipper_name}</TableCell>
                    <TableCell className="font-bold text-green-600">{report.amount.toLocaleString()} ر.س</TableCell>
                    <TableCell>
                      <Badge variant={report.method === 'cash' ? 'default' : 'secondary'}>
                        {report.method === 'cash' ? 'نقدي' : 
                         report.method === 'bank_transfer' ? 'بنكي' : 'محفظة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{report.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReportPage;