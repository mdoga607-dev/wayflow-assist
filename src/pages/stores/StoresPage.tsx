/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/stores/StoresPage.tsx
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
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Edit,
  Trash2,
  Eye,
  RefreshCcw,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Package,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  manager_name?: string;
  status: 'active' | 'inactive';
  total_shipments: number;
  created_at: string;
  updated_at: string;
}

const StoresPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإدارة المتاجر",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب المتاجر من قاعدة البيانات
  const fetchStores = async () => {
    try {
      setLoading(true);
      
      const { data: storesData, error } = await supabase
        .from('stores')
        .select(`
          *,
          total_shipments:shipments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // معالجة البيانات
      const processedStores = (storesData || []).map((store: any) => ({
        id: store.id,
        name: store.name,
        city: store.city || 'غير محدد',
        address: store.address || 'غير محدد',
        phone: store.phone || 'غير محدد',
        manager_name: store.manager_name || 'غير محدد',
        status: store.status as 'active' | 'inactive',
        total_shipments: store.total_shipments?.count || 0,
        created_at: store.created_at,
        updated_at: store.updated_at
      }));
      
      setStores(processedStores);
      setFilteredStores(processedStores);
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل المتاجر. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchStores();
    }
  }, [authLoading, role]);

  // تطبيق البحث
  useEffect(() => {
    if (!stores.length) return;
    
    const filtered = stores.filter(store => 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.phone.includes(searchQuery) ||
      (store.manager_name && store.manager_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setFilteredStores(filtered);
  }, [searchQuery, stores]);

  // تبديل حالة المتجر (نشط/غير نشط)
  const handleToggleStatus = async (storeId: string, currentStatus: string) => {
    setTogglingId(storeId);
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('stores')
        .update({ status: newStatus })
        .eq('id', storeId);

      if (error) throw error;
      
      // تحديث القائمة محلياً
      setStores(prev => prev.map(store => 
        store.id === storeId ? { ...store, status: newStatus as 'active' | 'inactive' } : store
      ));
      setFilteredStores(prev => prev.map(store => 
        store.id === storeId ? { ...store, status: newStatus as 'active' | 'inactive' } : store
      ));
      
      toast({
        title: "تم التحديث بنجاح",
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} المتجر بنجاح`
      });
    } catch (error: any) {
      console.error('Error toggling store status:', error);
      toast({
        title: "فشل التحديث",
        description: error.message || "حدث خطأ أثناء تحديث حالة المتجر",
        variant: "destructive"
      });
    } finally {
      setTogglingId(null);
    }
  };

  // حذف متجر
  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المتجر "${storeName}"؟ هذه العملية لا يمكن التراجع عنها.`)) return;
    
    setDeletingId(storeId);
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المتجر بنجاح"
      });
      
      // تحديث القائمة
      fetchStores();
    } catch (error: any) {
      console.error('Error deleting store:', error);
      toast({
        title: "فشل الحذف",
        description: error.message || "حدث خطأ أثناء حذف المتجر",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // تحضير البيانات
      const worksheetData = [
        ['تقرير المتاجر والفروع'],
        ['تاريخ التصدير:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['اسم المتجر', 'المدينة', 'العنوان', 'رقم الهاتف', 'اسم المدير', 'الحالة', 'إجمالي الشحنات', 'تاريخ الإنشاء'],
        ...filteredStores.map(store => [
          store.name,
          store.city,
          store.address,
          store.phone,
          store.manager_name || 'غير محدد',
          store.status === 'active' ? 'نشط' : 'غير نشط',
          store.total_shipments,
          format(new Date(store.created_at), 'dd/MM/yyyy', { locale: ar })
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي المتاجر', 'المتاجر النشطة', 'إجمالي الشحنات'],
        [
          filteredStores.length.toString(),
          filteredStores.filter(s => s.status === 'active').length.toString(),
          filteredStores.reduce((sum, s) => sum + s.total_shipments, 0).toString()
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "المتاجر");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `المتاجر_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير المتاجر إلى ملف Excel"
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

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  // دالة لتحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    return status === 'active' 
      ? <CheckCircle className="h-4 w-4 text-green-600" /> 
      : <XCircle className="h-4 w-4 text-red-600" />;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المتاجر...</p>
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
            <Building2 className="h-6 w-6 text-blue-600" />
            إدارة المتاجر والفروع
          </h1>
          <p className="text-gray-600 mt-1">
            عرض وإدارة جميع متاجر وفروع الشركة في جميع أنحاء مصر
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchStores}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث القائمة
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting || filteredStores.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
          <Button 
            onClick={() => navigate('/app/stores/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة متجر جديد
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>المتاجر النشطة تظهر باللون الأخضر، وغير النشطة باللون الأحمر</li>
                <li>يمكنك تفعيل أو إيقاف أي متجر بالنقر على زر التبديل بجانبه</li>
                <li>الشحنات المعروضة هي الشحنات المرتبطة بكل متجر</li>
                <li>للحصول على أفضل أداء، تأكد من تحديث معلومات المتاجر بانتظام</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المتاجر</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {stores.length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المتاجر النشطة</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {stores.filter(s => s.status === 'active').length}
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
                <p className="text-sm text-gray-600">إجمالي الشحنات</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">
                  {stores.reduce((sum, s) => sum + s.total_shipments, 0).toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المدن المغطاة</p>
                <p className="text-2xl font-bold mt-1 text-orange-700">
                  {new Set(stores.map(s => s.city)).size}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-gray-800">قائمة المتاجر ({filteredStores.length})</CardTitle>
              <CardDescription className="mt-1">
                إدارة جميع متاجر وفروع الشركة في مصر
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث باسم المتجر أو المدينة أو العنوان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد متاجر</p>
              <p className="max-w-md mx-auto">
                {searchQuery 
                  ? "لم يتم العثور على متاجر مطابقة لمعايير البحث" 
                  : "لم يتم إضافة أي متاجر حتى الآن. يمكنك إضافة متجر جديد بالنقر على الزر أعلاه"}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/app/stores/add')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة متجر جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-48">اسم المتجر</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">المدينة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">العنوان</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">رقم الهاتف</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الشحنات</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-36">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((store) => (
                    <TableRow 
                      key={store.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {store.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-700">
                          <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span>{store.city}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600">
                        {store.address}
                      </TableCell>
                      <TableCell dir="ltr" className="font-mono text-gray-700">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span>{store.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(store.status)}`}>
                          {getStatusIcon(store.status)}
                          {store.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {store.total_shipments.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/stores/${store.id}`)}
                            className="h-8 hover:bg-blue-50 text-blue-700"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/stores/edit/${store.id}`)}
                            className="h-8 hover:bg-yellow-50 text-yellow-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={store.status === 'active' ? 'ghost' : 'default'}
                            size="sm"
                            onClick={() => handleToggleStatus(store.id, store.status)}
                            disabled={togglingId === store.id}
                            className={`h-8 ${
                              store.status === 'active' 
                                ? 'hover:bg-red-50 text-red-700' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {togglingId === store.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : store.status === 'active' ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStore(store.id, store.name)}
                            disabled={deletingId === store.id}
                            className="h-8 hover:bg-red-50 text-red-700"
                          >
                            {deletingId === store.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
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
              <span className="font-medium">إجمالي المتاجر:</span> {filteredStores.length} متجر
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                نشطة: {filteredStores.filter(s => s.status === 'active').length}
              </Badge>
              <Badge className="bg-red-100 text-red-800 border border-red-200">
                غير نشطة: {filteredStores.filter(s => s.status === 'inactive').length}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                إجمالي الشحنات: {filteredStores.reduce((sum, s) => sum + s.total_shipments, 0).toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* المدن المصرية المغطاة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-700" />
            المدن المصرية المغطاة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from(new Set(stores.map(s => s.city))).sort().map((city, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors"
              >
                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-gray-800">{city}</span>
                <span className="text-xs text-gray-500">
                  ({stores.filter(s => s.city === city).length})
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            <Users className="h-3 w-3 inline-block ml-1" />
            إجمالي {new Set(stores.map(s => s.city)).size} مدينة مصرية مغطاة بمتاجرنا
          </p>
        </CardContent>
      </Card>

      {/* نصائح لإدارة المتاجر */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            نصائح لإدارة المتاجر بفعالية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">تحديث المعلومات بانتظام</p>
              <p className="text-sm text-gray-600 mt-1">
                تأكد من تحديث معلومات المتجر (العنوان، الهاتف، مدير الفرع) فور حدوث أي تغيير لضمان دقة البيانات
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">تفعيل/إيقاف المتاجر المؤقتة</p>
              <p className="text-sm text-gray-600 mt-1">
                استخدم خاصية التفعيل/الإيقاف للمتاجر المؤقتة بدلاً من الحذف للحفاظ على سجل الشحنات والتقارير
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">التوزيع الجغرافي</p>
              <p className="text-sm text-gray-600 mt-1">
                راقب التوزيع الجغرافي للمتاجر لتحديد المناطق التي تحتاج إلى تغطية إضافية أو تحسين الخدمات
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">تقارير الأداء</p>
              <p className="text-sm text-gray-600 mt-1">
                استخدم تقارير الشحنات لكل متجر لتحديد أفضل وأسوأ أداء واتخاذ القرارات المناسبة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoresPage;