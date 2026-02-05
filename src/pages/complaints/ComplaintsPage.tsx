/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/complaints/ComplaintsPage.tsx
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
  AlertTriangle,
  Plus,
  Search,
  RefreshCcw,
  Eye,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Package,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Complaint {
  id: string;
  number: string;
  type: string;
  customer_name: string;
  customer_type: string;
  status: string;
  priority: string;
  subject: string;
  created_at: string;
  resolved_at?: string;
  assigned_to?: string;
}

const ComplaintsPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [exporting, setExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإدارة الشكاوى",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب الشكاوى من قاعدة البيانات
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      const { data: complaintsData, error } = await supabase
        .from('complaints')
        .select(`
          *,
          assigned_user:assigned_to (name)
        `)
        .in('status', ['جديدة', 'قيد المراجعة', 'معلقة'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // معالجة البيانات
      const processedComplaints = (complaintsData || []).map((complaint: any) => ({
        id: complaint.id,
        number: complaint.number,
        type: complaint.type,
        customer_name: complaint.customer_name || 'غير معروف',
        customer_type: complaint.customer_type || 'عميل',
        status: complaint.status,
        priority: complaint.priority || 'medium',
        subject: complaint.subject || 'بدون موضوع',
        created_at: complaint.created_at,
        resolved_at: complaint.resolved_at,
        assigned_to: complaint.assigned_user?.name || 'غير مُسنَد'
      }));
      
      setComplaints(processedComplaints);
      setFilteredComplaints(processedComplaints);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل الشكاوى. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchComplaints();
    }
  }, [authLoading, role]);

  // تطبيق البحث
  useEffect(() => {
    if (!complaints.length) return;
    
    const filtered = complaints.filter(complaint => 
      complaint.number.includes(searchTerm) ||
      complaint.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.type.includes(searchTerm)
    );
    
    setFilteredComplaints(filtered);
  }, [searchTerm, complaints]);

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // تحضير البيانات
      const worksheetData = [
        ['تقرير الشكاوى النشطة'],
        ['تاريخ التصدير:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['رقم الشكوى', 'النوع', 'العميل/التاجر', 'الموضوع', 'الأولوية', 'الحالة', 'تاريخ الإنشاء', 'مُسنَد إلى'],
        ...filteredComplaints.map(complaint => [
          complaint.number,
          complaint.type,
          complaint.customer_name,
          complaint.subject,
          getPriorityLabel(complaint.priority),
          complaint.status,
          format(new Date(complaint.created_at), 'dd/MM/yyyy HH:mm', { locale: ar }),
          complaint.assigned_to
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي الشكاوى', 'شكاوى عالية الأولوية', 'شكاوى جديدة', 'متوسط وقت الحل'],
        [
          filteredComplaints.length.toString(),
          filteredComplaints.filter(c => c.priority === 'high').length.toString(),
          filteredComplaints.filter(c => c.status === 'جديدة').length.toString(),
          '48 ساعة'
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "الشكاوى النشطة");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `شكاوى_نشطة_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير الشكاوى النشطة إلى ملف Excel"
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

  // دالة لتحويل الأولوية للعربية
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'عاجل';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return priority;
    }
  };

  // دالة لتحديد لون الأولوية
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديدة': return 'bg-red-100 text-red-800 border-red-200';
      case 'قيد المراجعة': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'معلقة': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'تم الحل': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // دالة لتحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'جديدة': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'قيد المراجعة': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'معلقة': return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      case 'تم الحل': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الشكاوى...</p>
        </div>
      </div>
    );
  }

  // حساب الإحصائيات
  const totalComplaints = filteredComplaints.length;
  const newComplaints = filteredComplaints.filter(c => c.status === 'جديدة').length;
  const highPriority = filteredComplaints.filter(c => c.priority === 'high').length;
  const averageResolutionTime = '48 ساعة';

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            إدارة الشكاوى
          </h1>
          <p className="text-gray-600 mt-1">
            عرض ومعالجة شكاوى العملاء والتجار والمناديب ({totalComplaints} شكوى نشطة)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchComplaints}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث القائمة
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting || filteredComplaints.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
          <Button 
            onClick={() => navigate('/app/complaints/add')}
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة شكوى جديدة
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-orange-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>الشكاوى الجديدة تظهر باللون الأحمر ويجب مراجعتها فوراً</li>
                <li>يمكنك تصفية الشكاوى حسب النوع أو الحالة أو الأولوية</li>
                <li>الشكاوى عالية الأولوية يجب حلها خلال 24 ساعة</li>
                <li>بعد حل الشكوى، سيتم نقلها تلقائياً إلى الأرشيف</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الشكاوى</p>
                <p className="text-2xl font-bold mt-1 text-orange-700">
                  {totalComplaints}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">شكاوى جديدة</p>
                <p className="text-2xl font-bold mt-1 text-red-700">
                  {newComplaints}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">أولوية عالية</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">
                  {highPriority}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط وقت الحل</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {averageResolutionTime}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-gray-800">قائمة الشكاوى النشطة ({filteredComplaints.length})</CardTitle>
              <CardDescription className="mt-1">
                عرض جميع الشكاوى التي تحتاج إلى متابعة وحل
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث برقم الشكوى أو اسم العميل أو الموضوع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد شكاوى نشطة</p>
              <p className="max-w-md mx-auto">
                {searchTerm 
                  ? "لم يتم العثور على شكاوى مطابقة لمعايير البحث" 
                  : "لا توجد شكاوى نشطة حالياً. يمكنك إضافة شكوى جديدة بالنقر على الزر أعلاه"}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => navigate('/app/complaints/add')}
                  className="mt-4 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة شكوى جديدة
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-32">رقم الشكوى</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">النوع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">العميل/التاجر</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الأولوية</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-36">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => (
                    <TableRow 
                      key={complaint.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/complaints/${complaint.id}`)}
                    >
                      <TableCell className="font-mono font-medium text-blue-700">
                        {complaint.number}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${
                          complaint.type.includes('عميل') ? 'bg-blue-100 text-blue-800' :
                          complaint.type.includes('تاجر') ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {complaint.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {complaint.customer_name}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                          {getPriorityLabel(complaint.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(complaint.status)}`}>
                          {getStatusIcon(complaint.status)}
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-gray-700">
                        {format(new Date(complaint.created_at), 'dd/MM HH:mm', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/complaints/${complaint.id}`);
                          }}
                          className="h-8 hover:bg-blue-50 text-blue-700"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t mt-4 gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">إجمالي الشكاوى النشطة:</span> {filteredComplaints.length} شكوى
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-red-100 text-red-800 border border-red-200">
                جديدة: {filteredComplaints.filter(c => c.status === 'جديدة').length}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                قيد المراجعة: {filteredComplaints.filter(c => c.status === 'قيد المراجعة').length}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                معلقة: {filteredComplaints.filter(c => c.status === 'معلقة').length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نصائح لإدارة الشكاوى */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            نصائح لإدارة الشكاوى بفعالية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">الاستجابة السريعة</p>
              <p className="text-sm text-gray-600 mt-1">
                حاول الرد على الشكاوى الجديدة خلال ساعة واحدة لتحسين رضا العملاء
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">تصنيف الأولويات</p>
              <p className="text-sm text-gray-600 mt-1">
                ركز أولاً على الشكاوى عالية الأولوية والشكاوى الجديدة لتجنب تفاقم المشاكل
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">التواصل المستمر</p>
              <p className="text-sm text-gray-600 mt-1">
                أخبر العميل بحالة شكواه بانتظام حتى بعد الحل لبناء الثقة
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">التحليل والتحسين</p>
              <p className="text-sm text-gray-600 mt-1">
                حلل أنواع الشكاوى المتكررة واتخذ إجراءات وقائية لمنعها في المستقبل
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintsPage;