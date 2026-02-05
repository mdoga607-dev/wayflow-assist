/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/inventory/InventoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Database,
  Plus,
  Search,
  RefreshCcw,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Package,
  Users,
  FileText,
  Calendar,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@radix-ui/react-select';

interface Inventory {
  id: string;
  name: string;
  branch_name?: string;
  total_items: number;
  counted_items: number;
  discrepancy: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  inventory_date: string;
  created_at: string;
  completed_at?: string;
}

const InventoryPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
  const [exporting, setExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لعرض عمليات الجرد",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات الجرد من قاعدة البيانات
  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      const { data: inventoryData, error } = await supabase
        .from('inventory')
        .select(`
          *,
          branch:branch_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // معالجة البيانات
      const processedInventory = (inventoryData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        branch_name: item.branch?.name || 'غير محدد',
        total_items: item.total_items || 0,
        counted_items: item.counted_items || 0,
        discrepancy: item.discrepancy || 0,
        status: item.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        notes: item.notes || '',
        inventory_date: item.inventory_date || item.created_at,
        created_at: item.created_at,
        completed_at: item.completed_at
      }));
      
      setInventory(processedInventory);
      setFilteredInventory(processedInventory);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل عمليات الجرد. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchInventory();
    }
  }, [authLoading, role]);

  // تطبيق البحث والفلاتر
  useEffect(() => {
    if (!inventory.length) return;
    
    let filtered = [...inventory];
    
    // تصفية البحث
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status.includes(searchTerm.toLowerCase())
      );
    }
    
    // تصفية الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    setFilteredInventory(filtered);
  }, [searchTerm, statusFilter, inventory]);

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // تحضير البيانات
      const worksheetData = [
        ['تقرير عمليات جرد الشحنات'],
        ['تاريخ التصدير:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['اسم عملية الجرد', 'الفرع', 'إجمالي الشحنات', 'تم عدها', 'الاختلاف', 'الحالة', 'تاريخ الجرد', 'تاريخ الإنشاء'],
        ...filteredInventory.map(item => [
          item.name,
          item.branch_name,
          item.total_items,
          item.counted_items,
          item.discrepancy,
          getStatusLabel(item.status),
          format(new Date(item.inventory_date), 'dd/MM/yyyy', { locale: ar }),
          format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي عمليات الجرد', 'إجمالي الشحنات', 'إجمالي المعدود', 'إجمالي الاختلافات'],
        [
          filteredInventory.length.toString(),
          filteredInventory.reduce((sum, i) => sum + i.total_items, 0).toString(),
          filteredInventory.reduce((sum, i) => sum + i.counted_items, 0).toString(),
          filteredInventory.reduce((sum, i) => sum + Math.abs(i.discrepancy), 0).toString()
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "جرد الشحنات");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `تقرير_جرد_الشحنات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير عمليات الجرد إلى ملف Excel"
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

  // دالة لتحويل الحالة للعربية
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'مجدول';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // دالة لتحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'in_progress': return <Database className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // دالة لتحديد لون الاختلاف
  const getDiscrepancyColor = (discrepancy: number) => {
    if (discrepancy === 0) return 'text-green-600 font-medium';
    if (discrepancy > 0) return 'text-blue-600 font-medium';
    return 'text-red-600 font-medium';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل عمليات الجرد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-purple-600" />
            عمليات جرد الشحنات
          </h1>
          <p className="text-gray-600 mt-1">
            إدارة وتسجيل عمليات الجرد الدورية للشحنات في جميع الفروع
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchInventory}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث القائمة
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting || filteredInventory.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
          <Button 
            onClick={() => navigate('/app/inventory/add')}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            بدء جرد جديد
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-800">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>الجرد المكتمل يظهر باللون الأخضر، والقيد التنفيذ باللون الأصفر</li>
                <li>الاختلاف الإيجابي (+) يعني وجود شحنات إضافية، والسالب (-) يعني نقص في الشحنات</li>
                <li>يمكنك عرض تفاصيل كل عملية جرد والنقر على "عرض السجل" لرؤية جميع الحركات</li>
                <li>يجب إكمال عملية الجرد قبل بدء عملية جديدة لنفس الفرع</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي العمليات</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">
                  {inventory.length}
                </p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مكتملة</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {inventory.filter(i => i.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">قيد التنفيذ</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {inventory.filter(i => i.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الاختلافات</p>
                <p className="text-2xl font-bold mt-1 text-red-700">
                  {inventory.reduce((sum, i) => sum + Math.abs(i.discrepancy), 0)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-gray-800">سجل عمليات الجرد ({filteredInventory.length})</CardTitle>
              <CardDescription className="mt-1">
                عرض جميع عمليات جرد الشحنات مع تفاصيل الحالة والاختلافات
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث باسم الجرد أو الفرع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 bg-white border-gray-300">
                  <SelectValue placeholder="فلترة بالحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">مجدول</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد عمليات جرد</p>
              <p className="max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? "لم يتم العثور على عمليات جرد مطابقة لمعايير البحث والفلترة"
                  : "لم يتم تسجيل أي عمليات جرد حتى الآن. يمكنك بدء عملية جرد جديدة بالنقر على الزر أعلاه"}
              </p>
              {!(searchTerm || statusFilter !== 'all') && (
                <Button 
                  onClick={() => navigate('/app/inventory/add')}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  بدء جرد جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-48">اسم عملية الجرد</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">الفرع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">إجمالي الشحنات</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">تم عدها</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الاختلاف</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">تاريخ الجرد</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-36">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span>{item.branch_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {item.total_items.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {item.counted_items.toLocaleString()}
                      </TableCell>
                      <TableCell className={getDiscrepancyColor(item.discrepancy)}>
                        {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-gray-700">
                        {format(new Date(item.inventory_date), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/inventory/${item.id}`)}
                            className="h-8 hover:bg-blue-50 text-blue-700"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/inventory/log?inventory_id=${item.id}`)}
                            className="h-8 hover:bg-purple-50 text-purple-700"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          {item.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/app/inventory/start/${item.id}`)}
                              className="h-8 hover:bg-green-50 text-green-700"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t mt-4 gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">إجمالي العمليات:</span> {filteredInventory.length} عملية جرد
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                مجدولة: {filteredInventory.filter(i => i.status === 'pending').length}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                قيد التنفيذ: {filteredInventory.filter(i => i.status === 'in_progress').length}
              </Badge>
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                مكتملة: {filteredInventory.filter(i => i.status === 'completed').length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نصائح لعمليات الجرد الفعالة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            نصائح لعمليات جرد فعالة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">التخطيط المسبق</p>
              <p className="text-sm text-gray-600 mt-1">
                خطط لعملية الجرد مسبقاً وأخبر جميع الفروع المعنية بالموعد المحدد لتجنب التأخير
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">التوثيق الكامل</p>
              <p className="text-sm text-gray-600 mt-1">
                سجل جميع الاختلافات مع ملاحظات تفصيلية عن الأسباب لتسهيل المتابعة والتحسين
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">المراجعة الدورية</p>
              <p className="text-sm text-gray-600 mt-1">
                قم بمراجعة تقارير الجرد بانتظام لتحديد الأنماط والمشكلات المتكررة واتخاذ الإجراءات التصحيحية
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">التدريب المستمر</p>
              <p className="text-sm text-gray-600 mt-1">
                درّب فريق العمل على إجراءات الجرد الصحيحة لضمان الدقة والكفاءة في العملية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// مكون أيقونة التشغيل
const Play = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default InventoryPage;