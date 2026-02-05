/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/inventory/InventoryDetailsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import {
  Database,
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCcw,
  Loader2,
  AlertCircle,
  Package,
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Label } from 'recharts';

interface Inventory {
  id: string;
  name: string;
  branch_name: string;
  branch_city: string;
  total_items: number;
  counted_items: number;
  discrepancy: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  inventory_date: string;
  created_at: string;
  completed_at?: string;
  created_by_name?: string;
}

const InventoryDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { role, loading: authLoading } = useAuth();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لعرض تفاصيل الجرد",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات الجرد
  const fetchInventory = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data: inventoryData, error } = await supabase
        .from('inventory')
        .select(`
          *,
          branch:branch_id (name, city),
          created_by_user:created_by (name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setInventory({
        id: inventoryData.id,
        name: inventoryData.name,
        branch_name: inventoryData.branch?.name || 'غير محدد',
        branch_city: inventoryData.branch?.city || 'غير محدد',
        total_items: inventoryData.total_items || 0,
        counted_items: inventoryData.counted_items || 0,
        discrepancy: inventoryData.discrepancy || 0,
        status: inventoryData.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        notes: inventoryData.notes || '',
        inventory_date: inventoryData.inventory_date || inventoryData.created_at,
        created_at: inventoryData.created_at,
        completed_at: inventoryData.completed_at,
        created_by_name: inventoryData.created_by_user?.name || 'غير معروف'
      });
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل تفاصيل الجرد. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      navigate('/app/inventory');
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '') && id) {
      fetchInventory();
    }
  }, [authLoading, role, id]);

  // بدء عملية الجرد
  const handleStartInventory = async () => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "تم بدء الجرد بنجاح",
        description: "تم تحويل حالة عملية الجرد إلى 'قيد التنفيذ'"
      });
      
      // تحديث البيانات
      fetchInventory();
    } catch (error: any) {
      console.error('Error starting inventory:', error);
      toast({
        title: "فشل بدء الجرد",
        description: error.message || "حدث خطأ أثناء بدء عملية الجرد. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // إنهاء عملية الجرد
  const handleCompleteInventory = async () => {
    if (!id || !inventory) return;
    
    if (inventory.counted_items === 0) {
      toast({
        title: "تحذير",
        description: "لم يتم عد أي شحنات بعد. يرجى عد الشحنات قبل إنهاء الجرد.",
        variant: "destructive"
      });
      return;
    }
    
    if (!confirm('هل أنت متأكد من إنهاء عملية الجرد؟ لن تتمكن من تعديل النتائج بعد الإنهاء.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "تم إنهاء الجرد بنجاح",
        description: "تم تحويل حالة عملية الجرد إلى 'مكتمل' وتم حفظ النتائج"
      });
      
      // تحديث البيانات
      fetchInventory();
    } catch (error: any) {
      console.error('Error completing inventory:', error);
      toast({
        title: "فشل إنهاء الجرد",
        description: error.message || "حدث خطأ أثناء إنهاء عملية الجرد. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // إلغاء عملية الجرد
  const handleCancelInventory = async () => {
    if (!id) return;
    
    if (!confirm('هل أنت متأكد من إلغاء عملية الجرد؟ هذه العملية لا يمكن التراجع عنها.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "تم إلغاء الجرد بنجاح",
        description: "تم تحويل حالة عملية الجرد إلى 'ملغي'"
      });
      
      // تحديث البيانات
      fetchInventory();
    } catch (error: any) {
      console.error('Error cancelling inventory:', error);
      toast({
        title: "فشل إلغاء الجرد",
        description: error.message || "حدث خطأ أثناء إلغاء عملية الجرد. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // تصدير التقرير
  const exportReport = () => {
    if (!inventory) return;
    
    try {
      // تحضير البيانات
      const worksheetData = [
        ['تقرير عملية جرد مفصل'],
        ['اسم عملية الجرد:', inventory.name],
        ['الفرع:', `${inventory.branch_name} - ${inventory.branch_city}`],
        ['تاريخ الجرد:', format(new Date(inventory.inventory_date), 'dd/MM/yyyy', { locale: ar })],
        ['تاريخ الإنشاء:', format(new Date(inventory.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })],
        ['الحالة:', getStatusLabel(inventory.status)],
        [],
        ['الإحصائيات'],
        ['إجمالي الشحنات المتوقعة', 'الشحنات المعدودة', 'الاختلاف', 'نسبة الإنجاز'],
        [
          inventory.total_items,
          inventory.counted_items,
          inventory.discrepancy,
          inventory.total_items > 0 ? `${Math.round((inventory.counted_items / inventory.total_items) * 100)}%` : '0%'
        ],
        [],
        ['الملاحظات'],
        [inventory.notes || 'لا توجد ملاحظات']
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الجرد");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `تقرير_جرد_${inventory.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير عملية الجرد إلى ملف Excel"
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير التقرير. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
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
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    if (discrepancy === 0) return 'text-green-600 font-bold';
    if (discrepancy > 0) return 'text-blue-600 font-bold';
    return 'text-red-600 font-bold';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الجرد...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">لم يتم العثور على عملية الجرد</h2>
          <p className="text-gray-600 mb-6">
            يرجى التحقق من الرابط أو العودة إلى صفحة عمليات الجرد.
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
            <Database className="h-6 w-6 text-purple-600" />
            {inventory.name}
          </h1>
          <p className="text-gray-600 mt-1">
            تفاصيل عملية جرد الشحنات - فرع {inventory.branch_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchInventory}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث البيانات
          </Button>
          <Button 
            onClick={exportReport}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* معلومات الحالة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${inventory.status === 'completed' ? 'bg-green-100' : inventory.status === 'in_progress' ? 'bg-yellow-100' : inventory.status === 'pending' ? 'bg-blue-100' : 'bg-red-100'}`}>
                {getStatusIcon(inventory.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600">حالة العملية</p>
                <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(inventory.status)}`}>
                  {getStatusLabel(inventory.status)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">تاريخ الجرد</p>
                <p className="font-bold text-gray-900">
                  {format(new Date(inventory.inventory_date), 'EEEE، dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">نسبة الإنجاز</p>
                <p className="font-bold text-blue-700">
                  {inventory.total_items > 0 
                    ? `${Math.round((inventory.counted_items / inventory.total_items) * 100)}%` 
                    : '0%'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الشحنات</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {inventory.total_items.toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الشحنات المعدودة</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {inventory.counted_items.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الاختلاف</p>
                <p className={`text-2xl font-bold mt-1 ${getDiscrepancyColor(inventory.discrepancy)}`}>
                  {inventory.discrepancy > 0 ? `+${inventory.discrepancy}` : inventory.discrepancy}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل العملية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-700" />
              تفاصيل العملية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  الفرع
                </Label>
                <p className="font-medium text-gray-900">{inventory.branch_name}</p>
                <p className="text-sm text-gray-600">{inventory.branch_city}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  تاريخ الإنشاء
                </Label>
                <p className="font-medium text-gray-900">
                  {format(new Date(inventory.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                </p>
                <p className="text-sm text-gray-600">
                  بواسطة: {inventory.created_by_name}
                </p>
              </div>
              
              {inventory.completed_at && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-gray-500" />
                    تاريخ الانتهاء
                  </Label>
                  <p className="font-medium text-gray-900">
                    {format(new Date(inventory.completed_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-sm text-gray-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-gray-500" />
                الملاحظات
              </Label>
              <p className="text-gray-700 whitespace-pre-wrap">
                {inventory.notes || 'لا توجد ملاحظات لهذه العملية'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* الإجراءات */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-700" />
              الإجراءات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventory.status === 'pending' && (
              <Button 
                onClick={handleStartInventory} 
                disabled={actionLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                بدء عملية الجرد
              </Button>
            )}
            
            {inventory.status === 'in_progress' && (
              <Button 
                onClick={handleCompleteInventory} 
                disabled={actionLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                إنهاء الجرد
              </Button>
            )}
            
            {inventory.status !== 'completed' && (
              <Button 
                onClick={handleCancelInventory} 
                disabled={actionLoading}
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                إلغاء العملية
              </Button>
            )}
            
            <Button 
              onClick={() => navigate(`/app/inventory/log?inventory_id=${inventory.id}`)}
              variant="outline"
              className="w-full gap-2"
            >
              <FileText className="h-4 w-4" />
              عرض السجل الكامل
            </Button>
            
            <Button 
              onClick={() => navigate(`/app/inventory/start/${inventory.id}`)}
              variant="outline"
              disabled={inventory.status !== 'in_progress'}
              className="w-full gap-2"
            >
              <Package className="h-4 w-4" />
              عد الشحنات
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* تقدم الجرد */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-700" />
            تقدم عملية الجرد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">نسبة الإنجاز</span>
                <span className="font-medium text-gray-900">
                  {inventory.total_items > 0 
                    ? `${Math.round((inventory.counted_items / inventory.total_items) * 100)}%` 
                    : '0%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${inventory.total_items > 0 ? (inventory.counted_items / inventory.total_items) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">المتوقع</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{inventory.total_items}</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">المعدود</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{inventory.counted_items}</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800 font-medium">المتبقي</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {Math.max(0, inventory.total_items - inventory.counted_items)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDetailsPage;