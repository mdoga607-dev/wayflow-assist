/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/complaints/ArchivePage.tsx
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
  Archive,
  Search,
  RefreshCcw,
  Eye,
  Download,
  Loader2,
  CheckCircle,
  Users,
  Package,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Complaint {
  id: string;
  number: string;
  type: string;
  customer_name: string;
  status: string;
  subject: string;
  created_at: string;
  resolved_at?: string;
  resolution_time?: number;
}

const ArchivePage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
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
        description: "ليس لديك الصلاحية لعرض أرشيف الشكاوى",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب الشكاوى المؤرشفة من قاعدة البيانات
  const fetchArchivedComplaints = async () => {
    try {
      setLoading(true);
      
      const { data: complaintsData, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('status', 'تم الحل')
        .order('resolved_at', { ascending: false });

      if (error) throw error;
      
      setComplaints(complaintsData || []);
      setFilteredComplaints(complaintsData || []);
    } catch (error: any) {
      console.error('Error fetching archived complaints:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل الأرشيف. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchArchivedComplaints();
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
        ['تقرير أرشيف الشكاوى'],
        ['تاريخ التصدير:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['رقم الشكوى', 'النوع', 'العميل/التاجر', 'الموضوع', 'حالة الحل', 'تاريخ الإنشاء', 'تاريخ الحل', 'وقت الحل (ساعة)'],
        ...filteredComplaints.map(complaint => [
          complaint.number,
          complaint.type,
          complaint.customer_name,
          complaint.subject,
          complaint.status,
          format(new Date(complaint.created_at), 'dd/MM/yyyy HH:mm', { locale: ar }),
          complaint.resolved_at ? format(new Date(complaint.resolved_at), 'dd/MM/yyyy HH:mm', { locale: ar }) : '-',
          complaint.resolution_time ? complaint.resolution_time.toString() : '-'
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي الشكاوى المحلولة', 'متوسط وقت الحل', 'أعلى نوع شكاوى'],
        [
          filteredComplaints.length.toString(),
          filteredComplaints.length > 0 
            ? `${Math.round(filteredComplaints.reduce((sum, c) => sum + (c.resolution_time || 0), 0) / filteredComplaints.length)} ساعة`
            : '0 ساعة',
          'شكاوى العملاء'
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "الأرشيف");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `أرشيف_الشكاوى_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير الأرشيف إلى ملف Excel"
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الأرشيف...</p>
        </div>
      </div>
    );
  }

  // حساب الإحصائيات
  const totalResolved = filteredComplaints.length;
  const averageResolutionTime = filteredComplaints.length > 0 
    ? Math.round(filteredComplaints.reduce((sum, c) => sum + (c.resolution_time || 0), 0) / filteredComplaints.length)
    : 0;

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="h-6 w-6 text-gray-700" />
            أرشيف الشكاوى
          </h1>
          <p className="text-gray-600 mt-1">
            عرض الشكاوى التي تم حلها وأرشفتها ({totalResolved} شكوى محلولة)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchArchivedComplaints}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث الأرشيف
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
            variant="outline" 
            onClick={() => navigate('/app/complaints')}
            className="gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            العودة للشكاوى النشطة
          </Button>
        </div>
      </div>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المحلولة</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {totalResolved}
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
                <p className="text-sm text-gray-600">متوسط وقت الحل</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {averageResolutionTime} ساعة
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل الحل الناجح</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">
                  98%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-gray-800">الشكاوى المؤرشفة ({filteredComplaints.length})</CardTitle>
              <CardDescription className="mt-1">
                عرض جميع الشكاوى التي تم حلها بنجاح
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث برقم الشكوى أو اسم العميل..."
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
              <Archive className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد شكاوى مؤرشفة</p>
              <p className="max-w-md mx-auto">
                {searchTerm 
                  ? "لم يتم العثور على شكاوى مطابقة لمعايير البحث" 
                  : "لم يتم حل أي شكاوى حتى الآن. سيتم نقل الشكاوى المحلولة تلقائياً إلى الأرشيف"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-32">رقم الشكوى</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">النوع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">العميل/التاجر</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">الموضوع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">تاريخ الحل</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">وقت الحل</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => (
                    <TableRow 
                      key={complaint.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-mono font-medium text-gray-800">
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
                      <TableCell className="max-w-xs truncate text-gray-700">
                        {complaint.subject}
                      </TableCell>
                      <TableCell className="font-mono text-gray-700">
                        {format(new Date(complaint.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell className="font-mono text-gray-700">
                        {complaint.resolved_at ? format(new Date(complaint.resolved_at), 'dd/MM/yyyy', { locale: ar }) : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-blue-700">
                        {complaint.resolution_time ? `${complaint.resolution_time} ساعة` : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/app/complaints/${complaint.id}`)}
                          className="h-8 hover:bg-green-50 text-green-700"
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
              <span className="font-medium">إجمالي الشكاوى المحلولة:</span> {filteredComplaints.length} شكوى
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                محلولة: {filteredComplaints.length}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                متوسط الوقت: {averageResolutionTime} ساعة
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملاحظة هامة */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium">ملاحظة هامة:</p>
              <p className="mt-1">
                هذه الصفحة تعرض فقط الشكاوى التي تم حلها بنجاح. الشكاوى النشطة يمكن عرضها من صفحة "إدارة الشكاوى".
                يمكنك تحليل بيانات الأرشيف لتحسين جودة الخدمة وتقليل عدد الشكاوى المستقبلية.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchivePage;