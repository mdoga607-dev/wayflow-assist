/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/inventory/InventoryLogPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  RefreshCcw,
  AlertCircle,
  CheckCircle,
  Package,
  Clock,
  TrendingUp,
  Download,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface InventoryLog {
  id: string;
  inventory_name: string;
  branch_name: string;
  shipment_tracking: string;
  expected_quantity: number;
  counted_quantity: number;
  discrepancy: number;
  status: string;
  notes?: string;
  created_at: string;
}

const InventoryLogPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inventoryId = searchParams.get('inventory_id');
  const { role, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<InventoryLog[]>([]);
  const [inventoryInfo, setInventoryInfo] = useState<{ name: string; branch: string; date: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لعرض سجل الجرد",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات السجل من قاعدة البيانات
  const fetchLogs = async () => {
    if (!inventoryId) return;
    
    try {
      setLoading(true);
      
      // جلب معلومات عملية الجرد
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          name,
          inventory_date,
          branch:branch_id (name)
        `)
        .eq('id', inventoryId)
        .single();

      if (inventoryError) throw inventoryError;
      
      // Safely extract branch name from the response
      const branchData = inventoryData.branch as { name: string } | { name: string }[] | null;
      const branchName = Array.isArray(branchData) 
        ? (branchData[0]?.name || 'غير معروف')
        : (branchData?.name || 'غير معروف');
      
      setInventoryInfo({
        name: inventoryData.name,
        branch: branchName,
        date: inventoryData.inventory_date
      });
      
      // جلب سجلات الجرد
      const { data: logsData, error: logsError } = await supabase
        .from('inventory_logs')
        .select(`
          *,
          inventory:inventory_id (name),
          branch:inventory_id (branch_id (name)),
          shipment:shipment_id (tracking_number)
        `)
        .eq('inventory_id', inventoryId)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;
      
      // معالجة البيانات
      const processedLogs = (logsData || []).map((log: any) => ({
        id: log.id,
        inventory_name: log.inventory?.name || 'غير محدد',
        branch_name: log.branch?.branch_id?.name || 'غير محدد',
        shipment_tracking: log.shipment?.tracking_number || 'غير محدد',
        expected_quantity: log.expected_quantity || 0,
        counted_quantity: log.counted_quantity || 0,
        discrepancy: log.discrepancy || 0,
        status: log.status || 'unknown',
        notes: log.notes || '',
        created_at: log.created_at
      }));
      
      setLogs(processedLogs);
      setFilteredLogs(processedLogs);
    } catch (error: any) {
      console.error('Error fetching inventory logs:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل سجل الجرد. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '') && inventoryId) {
      fetchLogs();
    }
  }, [authLoading, role, inventoryId]);

  // تطبيق البحث
  useEffect(() => {
    if (!logs.length) return;
    
    const filtered = logs.filter(log => 
      log.shipment_tracking.includes(searchTerm) ||
      log.status.includes(searchTerm.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // تحضير البيانات
      const worksheetData = [
        ['سجل عملية جرد:', inventoryInfo?.name || 'غير معروف'],
        ['الفرع:', inventoryInfo?.branch || 'غير معروف', 'التاريخ:', inventoryInfo?.date ? format(new Date(inventoryInfo.date), 'dd/MM/yyyy', { locale: ar }) : 'غير معروف'],
        [],
        ['رقم التتبع', 'الكمية المتوقعة', 'الكمية المعدودة', 'الاختلاف', 'الحالة', 'الملاحظات', 'تاريخ التسجيل'],
        ...filteredLogs.map(log => [
          log.shipment_tracking,
          log.expected_quantity,
          log.counted_quantity,
          log.discrepancy,
          log.status,
          log.notes || '-',
          format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي الحركات', 'إجمالي المتوقع', 'إجمالي المعدود', 'إجمالي الاختلافات'],
        [
          filteredLogs.length.toString(),
          filteredLogs.reduce((sum, l) => sum + l.expected_quantity, 0).toString(),
          filteredLogs.reduce((sum, l) => sum + l.counted_quantity, 0).toString(),
          filteredLogs.reduce((sum, l) => sum + Math.abs(l.discrepancy), 0).toString()
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "سجل الجرد");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `سجل_جرد_${inventoryInfo?.name || 'غير معروف'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير سجل عملية الجرد إلى ملف Excel"
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // دالة لتحديد لون الاختلاف
  const getDiscrepancyColor = (discrepancy: number) => {
    if (discrepancy === 0) return 'text-green-600 font-medium';
    if (discrepancy > 0) return 'text-blue-600 font-medium';
    return 'text-red-600 font-medium';
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'bg-green-100 text-green-800';
      case 'missing': return 'bg-red-100 text-red-800';
      case 'extra': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل سجل الجرد...</p>
        </div>
      </div>
    );
  }

  if (!inventoryId) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">لم يتم تحديد عملية الجرد</h2>
          <p className="text-gray-600 mb-6">
            يرجى تحديد عملية جرد لعرض سجلها. يمكنك العودة إلى صفحة عمليات الجرد للاختيار.
          </p>
          <Button onClick={() => navigate('/app/inventory')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            العودة إلى عمليات الجرد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/app/inventory')}
            className="mb-2 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة إلى عمليات الجرد
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            سجل عملية الجرد
          </h1>
          {inventoryInfo && (
            <p className="text-gray-600 mt-1">
              <span className="font-medium">{inventoryInfo.name}</span> - فرع {inventoryInfo.branch} - {format(new Date(inventoryInfo.date), 'dd MMMM yyyy', { locale: ar })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchLogs}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث السجل
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting || filteredLogs.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
        </div>
      </div>

      {/* معلومات موجزة */}
      {inventoryInfo && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">إجمالي الحركات</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">{logs.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">مطابقة</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {logs.filter(l => l.discrepancy === 0).length}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">اختلافات</span>
                </div>
                <p className="text-2xl font-bold text-red-700">
                  {logs.filter(l => l.discrepancy !== 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* البحث */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-gray-800">تفاصيل السجل ({filteredLogs.length})</CardTitle>
              <CardDescription className="mt-1">
                عرض جميع حركات الجرد مع تفاصيل الكمية والاختلافات
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث برقم التتبع أو الملاحظات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد حركات في السجل</p>
              <p className="max-w-md mx-auto">
                {searchTerm 
                  ? "لم يتم العثور على حركات مطابقة لمعايير البحث"
                  : "لم يتم تسجيل أي حركات في هذه العملية بعد. سيتم تحديث السجل تلقائياً عند إضافة حركات جديدة."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-36">رقم التتبع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المتوقع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المعدود</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الاختلاف</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">الملاحظات</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">تاريخ التسجيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-mono font-medium text-blue-700">
                        {log.shipment_tracking}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {log.expected_quantity}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {log.counted_quantity}
                      </TableCell>
                      <TableCell className={getDiscrepancyColor(log.discrepancy)}>
                        {log.discrepancy > 0 ? `+${log.discrepancy}` : log.discrepancy}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status === 'matched' ? 'مطابق' : log.status === 'missing' ? 'ناقص' : 'إضافي'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600">
                        {log.notes || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-gray-700 text-sm">
                        {format(new Date(log.created_at), 'HH:mm dd/MM', { locale: ar })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t mt-4 gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">إجمالي الحركات:</span> {filteredLogs.length} حركة
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                مطابقة: {filteredLogs.filter(l => l.discrepancy === 0).length}
              </Badge>
              <Badge className="bg-red-100 text-red-800 border border-red-200">
                ناقص: {filteredLogs.filter(l => l.discrepancy < 0).length}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                إضافي: {filteredLogs.filter(l => l.discrepancy > 0).length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملاحظات هامة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            ملاحظات هامة عن السجل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">الاختلافات الإيجابية (+)</p>
              <p className="text-sm text-gray-600 mt-1">
                تشير إلى وجود شحنات إضافية لم تكن مسجلة في النظام
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">الاختلافات السلبية (-)</p>
              <p className="text-sm text-gray-600 mt-1">
                تشير إلى نقص في الشحنات المسجلة في النظام
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">التحديث التلقائي</p>
              <p className="text-sm text-gray-600 mt-1">
                يتم تحديث هذا السجل تلقائياً عند إضافة أي حركة جرد جديدة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryLogPage;