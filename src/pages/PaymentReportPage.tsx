import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Wallet, Download, Calendar, Filter, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast'; // ← هذا السطر فقط تم تصحيحه
const PaymentReportPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
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
    const timer = setTimeout(() => {
      setReports([
        { 
          id: '1', 
          date: '2026-01-29', 
          delegate: 'أحمد محمد', 
          amount: 2450, 
          method: 'cash', 
          shipmentsCount: 18, 
          status: 'مكتمل' 
        },
        { 
          id: '2', 
          date: '2026-01-29', 
          delegate: 'خالد عبدالله', 
          amount: 1875, 
          method: 'bank_transfer', 
          shipmentsCount: 12, 
          status: 'مكتمل' 
        },
        { 
          id: '3', 
          date: '2026-01-28', 
          delegate: 'محمد سعيد', 
          amount: 3200, 
          method: 'cash', 
          shipmentsCount: 24, 
          status: 'مكتمل' 
        },
        { 
          id: '4', 
          date: '2026-01-28', 
          delegate: 'سعود عبدالله', 
          amount: 1560, 
          method: 'wallet', 
          shipmentsCount: 15, 
          status: 'قيد المراجعة' 
        },
      ]);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleFilter = () => {
    // هنا يمكنك إضافة منطق التصفية الفعلي
    toast({ title: "تم تطبيق التصفية", description: "تم تحديث التقرير حسب المعايير المحددة" });
  };

  const handleExport = () => {
    // هنا يمكنك إضافة منطق التصدير الفعلي
    toast({ title: "تم التصدير بنجاح", description: "تم تنزيل التقرير كملف Excel" });
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            تقارير التوريد النقدي
          </h1>
          <p className="text-muted-foreground mt-1">تقارير مفصلة عن التوريدات النقدية من المناديب</p>
        </div>
        <Button onClick={handleExport}>
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
                  <SelectItem value="ahmed">أحمد محمد</SelectItem>
                  <SelectItem value="khalid">خالد عبدالله</SelectItem>
                  <SelectItem value="mohammed">محمد سعيد</SelectItem>
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
              <Button className="w-full" onClick={handleFilter}>
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
            <div className="text-2xl font-bold text-green-600">9,085 ر.س</div>
            <p className="text-xs text-muted-foreground">خلال الفترة المحددة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد التوريدات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">توريدة نقدية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التوريدة</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,271 ر.س</div>
            <p className="text-xs text-muted-foreground">لكل توريدة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الشحنات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
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
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>عدد الشحنات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono">{report.date}</TableCell>
                    <TableCell className="font-medium">{report.delegate}</TableCell>
                    <TableCell className="font-bold text-green-600">{report.amount.toLocaleString()} ر.س</TableCell>
                    <TableCell>
                      <Badge variant={report.method === 'cash' ? 'default' : 'secondary'}>
                        {report.method === 'cash' ? 'نقدي' : 
                         report.method === 'bank_transfer' ? 'بنكي' : 'محفظة'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{report.shipmentsCount}</TableCell>
                    <TableCell>
                      <Badge variant={report.status === 'مكتمل' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">عرض التفاصيل</Button>
                    </TableCell>
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