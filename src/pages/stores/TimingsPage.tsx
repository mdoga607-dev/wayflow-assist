/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/stores/BranchTimingsPage.tsx
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
import { Label } from '@/components/ui/label';
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
  Clock,
  Plus,
  Search,
  Loader2,
  RefreshCcw,
  Edit,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Users,
  TrendingUp,
  Calendar,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Branch {
  id: string;
  name: string;
  governorate: string;
  city: string | null;
  opening_time: string | null;
  closing_time: string | null;
  status: string;
  total_shipments?: number;
  active_delegates?: number;
}

const BranchTimingsPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [exporting, setExporting] = useState(false);
  const [governorates, setGovernorates] = useState<string[]>([]);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإدارة أوقات الفروع",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب الفروع من قاعدة البيانات
  const fetchBranches = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_branches_timings');
        if (error) throw error;
        setBranches(data || []);
        // جلب قائمة المحافظات الفريدة
        const uniqueGovernorates = Array.from(new Set((data || []).map((b: Branch) => b.governorate)));
        setGovernorates(uniqueGovernorates);
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast({
          title: "فشل في جلب البيانات",
          description: "حدث خطأ أثناء جلب بيانات الفروع. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
  };


  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchBranches();
    }
  }, [authLoading, role]);

  // تطبيق البحث والفلاتر
  useEffect(() => {
    if (!branches.length) return;
    
    let filtered = [...branches];
    
    // تصفية البحث
    if (searchTerm.trim()) {
      filtered = filtered.filter(branch => 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.governorate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.city && branch.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // تصفية الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(branch => branch.status === statusFilter);
    }
    
    // تصفية المحافظة
    if (governorateFilter !== 'all') {
      filtered = filtered.filter(branch => branch.governorate === governorateFilter);
    }
    
    setFilteredBranches(filtered);
  }, [searchTerm, statusFilter, governorateFilter, branches]);

  // تبديل حالة الفرع (نشط/معطل)
  const handleToggleStatus = async (branch: Branch) => {
    try {
      const newStatus = branch.status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('branches')
        .update({ status: newStatus })
        .eq('id', branch.id);

      if (error) throw error;

      toast({
        title: "تم التحديث بنجاح",
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} فرع "${branch.name}" بنجاح`
      });

      // تحديث القائمة محلياً
      setBranches(prev => prev.map(b => 
        b.id === branch.id ? { ...b, status: newStatus } : b
      ));
    } catch (error: any) {
      console.error('Error toggling branch status:', error);
      toast({
        title: "فشل التحديث",
        description: error.message || "حدث خطأ أثناء تغيير حالة الفرع. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // تحضير البيانات
      const worksheetData = [
        ['تقرير أوقات الفروع'],
        ['تاريخ التصدير:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['اسم الفرع', 'المحافظة', 'المدينة', 'وقت الافتتاح', 'وقت الإغلاق', 'الحالة', 'إجمالي الشحنات', 'المناديب النشطين'],
        ...filteredBranches.map(branch => [
          branch.name,
          branch.governorate,
          branch.city || '-',
          branch.opening_time || '09:00',
          branch.closing_time || '18:00',
          branch.status === 'active' ? 'نشط' : 'معطل',
          branch.total_shipments || 0,
          branch.active_delegates || 0
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي الفروع', 'الفرع النشطة', 'إجمالي الشحنات', 'إجمالي المناديب'],
        [
          filteredBranches.length.toString(),
          filteredBranches.filter(b => b.status === 'active').length.toString(),
          filteredBranches.reduce((sum, b) => sum + (b.total_shipments || 0), 0).toString(),
          filteredBranches.reduce((sum, b) => sum + (b.active_delegates || 0), 0).toString()
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "أوقات الفروع");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `أوقات_الفروع_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير أوقات الفروع إلى ملف Excel"
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

  // دالة لتحويل الوقت إلى تنسيق 12 ساعة
  const formatTime12Hour = (time24: string) => {
    if (!time24) return '-';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'م' : 'ص';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
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
          <p className="mt-4 text-gray-600">جاري تحميل بيانات الفروع...</p>
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
            <Clock className="h-6 w-6 text-blue-600" />
            إدارة أوقات الفروع
          </h1>
          <p className="text-gray-600 mt-1">
            تحديد وتعديل أوقات العمل لكل فرع في النظام ({branches.length} فرع)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchBranches}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث القائمة
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting || filteredBranches.length === 0}
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
            إضافة فرع جديد
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>يمكنك تفعيل أو تعطيل أي فرع بالنقر على زر التبديل بجانبه</li>
                <li>الأوقات المحددة تؤثر على جدولة المناديب وتواريخ التسليم المتوقعة</li>
                <li>الفرع المعطل لن يظهر في قوائم التعيين التلقائي للشحنات</li>
                <li>يمكنك تعديل أوقات العمل لكل فرع من صفحة تفاصيل الفرع</li>
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
                <p className="text-sm text-gray-600">إجمالي الفروع</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {branches.length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الفرع النشطة</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {branches.filter(b => b.status === 'active').length}
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
                  {branches.reduce((sum, b) => sum + (b.total_shipments || 0), 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المناديب النشطين</p>
                <p className="text-2xl font-bold mt-1 text-orange-700">
                  {branches.reduce((sum, b) => sum + (b.active_delegates || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-gray-800">جدول أوقات الفروع ({filteredBranches.length})</CardTitle>
              <CardDescription className="mt-1">
                عرض وتعديل أوقات العمل لكل فرع مع إمكانية التفعيل والإيقاف
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث باسم الفرع أو المحافظة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-32 bg-white border-gray-300">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">معطل</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={governorateFilter} onValueChange={setGovernorateFilter}>
                <SelectTrigger className="w-full md:w-40 bg-white border-gray-300">
                  <SelectValue placeholder="المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المحافظات</SelectItem>
                  {governorates.map(governorate => (
                    <SelectItem key={governorate} value={governorate}>
                      {governorate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBranches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد فروع</p>
              <p className="max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' || governorateFilter !== 'all'
                  ? "لم يتم العثور على فروع مطابقة لمعايير البحث والفلاتر"
                  : "لم يتم إضافة أي فروع حتى الآن. يمكنك إضافة فرع جديد بالنقر على الزر أعلاه"}
              </p>
              {!(searchTerm || statusFilter !== 'all' || governorateFilter !== 'all') && (
                <Button 
                  onClick={() => navigate('/app/stores/add')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة فرع جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-48">اسم الفرع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">المحافظة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المدينة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">وقت الافتتاح</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">وقت الإغلاق</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">ساعات العمل</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => {
                    // حساب ساعات العمل
                    const opening = branch.opening_time || '09:00';
                    const closing = branch.closing_time || '18:00';
                    const [openHour, openMinute] = opening.split(':').map(Number);
                    const [closeHour, closeMinute] = closing.split(':').map(Number);
                    const workHours = ((closeHour * 60 + closeMinute) - (openHour * 60 + openMinute)) / 60;
                    
                    return (
                      <TableRow 
                        key={branch.id} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium text-gray-900">
                          {branch.name}
                        </TableCell>
                        <TableCell className="text-gray-700 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span>{branch.governorate}</span>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {branch.city || '-'}
                        </TableCell>
                        <TableCell className="font-mono font-medium text-gray-800">
                          {formatTime12Hour(branch.opening_time || '09:00')}
                        </TableCell>
                        <TableCell className="font-mono font-medium text-gray-800">
                          {formatTime12Hour(branch.closing_time || '18:00')}
                        </TableCell>
                        <TableCell className="font-medium text-blue-700">
                          {workHours.toFixed(1)} ساعة
                        </TableCell>
                        <TableCell>
                          <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(branch.status)}`}>
                            {getStatusIcon(branch.status)}
                            {branch.status === 'active' ? 'نشط' : 'معطل'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/app/stores/edit/${branch.id}`)}
                              className="h-8 hover:bg-blue-50 text-blue-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant={branch.status === 'active' ? 'ghost' : 'default'}
                              size="sm"
                              onClick={() => handleToggleStatus(branch)}
                              className={`h-8 ${
                                branch.status === 'active' 
                                  ? 'hover:bg-red-50 text-red-700' 
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {branch.status === 'active' ? (
                                <XCircle className="h-3 w-3" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t mt-4 gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">إجمالي الفروع المعروضة:</span> {filteredBranches.length} فرع
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                نشطة: {filteredBranches.filter(b => b.status === 'active').length}
              </Badge>
              <Badge className="bg-red-100 text-red-800 border border-red-200">
                معطلة: {filteredBranches.filter(b => b.status === 'inactive').length}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                إجمالي الشحنات: {filteredBranches.reduce((sum, b) => sum + (b.total_shipments || 0), 0).toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نصائح لإدارة أوقات الفروع */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            نصائح لإدارة أوقات الفروع بفعالية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">التوحيد في الأوقات</p>
              <p className="text-sm text-gray-600 mt-1">
                توحيد أوقات العمل للفروع في نفس المحافظة يسهل على العملاء تذكرها ويزيد من ثقتهم
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">مراعاة العطلات الرسمية</p>
              <p className="text-sm text-gray-600 mt-1">
                قم بتحديث أوقات العمل تلقائياً خلال العطلات الرسمية والأعياد لتجنب الإرباك للعملاء والموظفين
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">المرونة في أوقات الذروة</p>
              <p className="text-sm text-gray-600 mt-1">
                زد ساعات العمل في الفروع الواقعة في المناطق التجارية خلال مواسم التخفيضات والأعياد
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">التكامل مع جدولة المناديب</p>
              <p className="text-sm text-gray-600 mt-1">
                تأكد من أن أوقات العمل متوافقة مع جداول المناديب لتجنب التعارضات وتحسين الكفاءة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchTimingsPage;