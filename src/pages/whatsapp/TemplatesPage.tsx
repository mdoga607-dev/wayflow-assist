/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/whatsapp/TemplatesPage.tsx
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
  FileText,
  Plus,
  Search,
  Copy,
  Check,
  Edit,
  Trash2,
  Download,
  RefreshCcw,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Tag,
  Users,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  usage_count: number;
  last_used: string;
  created_at: string;
  created_by_name?: string;
}

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإدارة قوالب الواتساب",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب القوالب من قاعدة البيانات
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const { data: templatesData, error } = await supabase
        .from('whatsapp_templates')
        .select(`
          *,
          created_by_user:created_by (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // معالجة البيانات
      const processedTemplates = (templatesData || []).map((template: any) => ({
        id: template.id,
        name: template.name,
        category: template.category,
        content: template.content,
        usage_count: template.usage_count || 0,
        last_used: template.last_used || template.created_at,
        created_at: template.created_at,
        created_by_name: template.created_by_user?.name || 'غير معروف'
      }));
      
      setTemplates(processedTemplates);
      setFilteredTemplates(processedTemplates);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل القوالب. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchTemplates();
    }
  }, [authLoading, role]);

  // تطبيق البحث
  useEffect(() => {
    if (!templates.length) return;
    
    const filtered = templates.filter(template => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredTemplates(filtered);
  }, [searchQuery, templates]);

  // نسخ النص إلى الحافظة
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast({
      title: "تم النسخ بنجاح",
      description: "تم نسخ النص إلى الحافظة"
    });
    
    // إعادة تعيين حالة النسخ بعد ثانيتين
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // حذف قالب
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`هل أنت متأكد من حذف القالب "${templateName}"؟ هذه العملية لا يمكن التراجع عنها.`)) return;
    
    setDeletingId(templateId);
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف القالب بنجاح"
      });
      
      // تحديث القائمة
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "فشل الحذف",
        description: error.message || "حدث خطأ أثناء حذف القالب",
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
        ['تقرير قوالب الواتساب المحفوظة'],
        ['تاريخ التصدير:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['اسم القالب', 'الفئة', 'عدد الاستخدامات', 'آخر استخدام', 'النص الكامل'],
        ...filteredTemplates.map(template => [
          template.name,
          getCategoryLabel(template.category),
          template.usage_count.toLocaleString(),
          template.last_used ? format(new Date(template.last_used), 'dd/MM/yyyy HH:mm', { locale: ar }) : 'غير مستخدم',
          template.content
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي القوالب', 'إجمالي الاستخدامات', 'متوسط الاستخدامات'],
        [
          filteredTemplates.length.toString(),
          filteredTemplates.reduce((sum, t) => sum + t.usage_count, 0).toLocaleString(),
          filteredTemplates.length > 0 
            ? (filteredTemplates.reduce((sum, t) => sum + t.usage_count, 0) / filteredTemplates.length).toFixed(1)
            : '0'
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "قوالب الواتساب");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `قوالب_الواتساب_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير قوالب الواتساب إلى ملف Excel"
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

  // دالة لتحويل فئة القالب للعربية
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'sales': return 'مبيعات';
      case 'collections': return 'تحصيل';
      case 'customer_service': return 'خدمة عملاء';
      case 'marketing': return 'تسويق';
      case 'notifications': return 'إشعارات';
      case 'promotions': return 'عروض';
      default: return category;
    }
  };

  // دالة لتحديد لون الفئة
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'collections': return 'bg-red-100 text-red-800 border-red-200';
      case 'customer_service': return 'bg-green-100 text-green-800 border-green-200';
      case 'marketing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'notifications': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'promotions': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // دالة لتحديد أيقونة الفئة
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'collections': return <Users className="h-4 w-4 text-red-600" />;
      case 'customer_service': return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'marketing': return <Tag className="h-4 w-4 text-purple-600" />;
      case 'notifications': return <Bell className="h-4 w-4 text-yellow-600" />;
      case 'promotions': return <Gift className="h-4 w-4 text-orange-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل القوالب...</p>
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
            <FileText className="h-6 w-6 text-blue-600" />
            نصوص الواتساب المحفوظة
          </h1>
          <p className="text-gray-600 mt-1">
            إدارة القوالب النصية الجاهزة للاستخدام في حملات الواتساب والمراسلات
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchTemplates}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث القائمة
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting || filteredTemplates.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
          <Button 
            onClick={() => navigate('/app/whatsapp/add-template')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            إنشاء قالب جديد
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
                <li>يمكنك استخدام المتغيرات في النصوص: {`{name}`} لاسم العميل، {`{order}`} لرقم الطلب، {`{amount}`} للمبلغ، {`{tracking}`} للتتبع</li>
                <li>كلما زاد عدد استخدامات القالب، زادت فعاليته وموثوقيته</li>
                <li>يمكنك نسخ أي قالب واستخدامه مباشرة في حملات الواتساب أو المراسلات</li>
                <li>القوالب الأكثر استخداماً تظهر أولاً في القائمة لتسهيل الوصول السريع</li>
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
                <p className="text-sm text-gray-600">إجمالي القوالب</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {templates.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الاستخدامات</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {templates.reduce((sum, t) => sum + t.usage_count, 0).toLocaleString()}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط الاستخدام</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">
                  {templates.length > 0 
                    ? (templates.reduce((sum, t) => sum + t.usage_count, 0) / templates.length).toFixed(0)
                    : '0'}
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
                <p className="text-sm text-gray-600">القوالب النشطة</p>
                <p className="text-2xl font-bold mt-1 text-orange-700">
                  {templates.filter(t => t.usage_count > 0).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-gray-800">قائمة القوالب ({filteredTemplates.length})</CardTitle>
              <CardDescription className="mt-1">
                إدارة القوالب النصية الجاهزة للاستخدام في حملات الواتساب
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث باسم القالب أو الفئة أو المحتوى..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد قوالب</p>
              <p className="max-w-md mx-auto">
                {searchQuery 
                  ? "لم يتم العثور على قوالب مطابقة لمعايير البحث" 
                  : "لم يتم إنشاء أي قوالب حتى الآن. يمكنك إنشاء قالب جديد بالنقر على الزر أعلاه"}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/app/whatsapp/add-template')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء قالب جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-48">اسم القالب</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الفئة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الاستخدامات</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">آخر استخدام</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">النص المختصر</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-40">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow 
                      key={template.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {template.name}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getCategoryColor(template.category)}`}>
                          {getCategoryIcon(template.category)}
                          {getCategoryLabel(template.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {template.usage_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-gray-700">
                        {template.last_used 
                          ? format(new Date(template.last_used), 'dd/MM HH:mm', { locale: ar })
                          : '-'}
                      </TableCell>
                      <TableCell className="max-w-md truncate text-gray-600 font-mono text-sm">
                        {template.content.substring(0, 60)}{template.content.length > 60 ? '...' : ''}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(template.content, template.id)}
                            className="h-8 hover:bg-blue-50 text-blue-700"
                          >
                            {copiedId === template.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/whatsapp/templates/edit/${template.id}`)}
                            className="h-8 hover:bg-yellow-50 text-yellow-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id, template.name)}
                            disabled={deletingId === template.id}
                            className="h-8 hover:bg-red-50 text-red-700"
                          >
                            {deletingId === template.id ? (
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
              <span className="font-medium">إجمالي القوالب:</span> {filteredTemplates.length} قالب
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                مبيعات: {filteredTemplates.filter(t => t.category === 'sales').length}
              </Badge>
              <Badge className="bg-red-100 text-red-800 border border-red-200">
                تحصيل: {filteredTemplates.filter(t => t.category === 'collections').length}
              </Badge>
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                خدمة عملاء: {filteredTemplates.filter(t => t.category === 'customer_service').length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نصائح لإنشاء قوالب فعالة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            نصائح لإنشاء قوالب واتساب فعالة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">استخدم المتغيرات الشخصية</p>
              <p className="text-sm text-gray-600 mt-1">
                استخدم المتغيرات مثل {`{name}`} و {`{order}`} لتخصيص الرسائل وزيادة التفاعل بنسبة تصل إلى 40%
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">كن واضحاً ومختصراً</p>
              <p className="text-sm text-gray-600 mt-1">
                حافظ على الرسائل قصيرة (أقل من 160 حرفاً) مع تركيز على نقطة واحدة رئيسية لتحسين معدل القراءة
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">أضف دعوة واضحة للعمل</p>
              <p className="text-sm text-gray-600 mt-1">
                تأكد من وجود دعوة واضحة للعمل (Call to Action) مثل "احجز الآن"، "استخدم الكود"، "اتصل بنا"
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">اختبر القوالب قبل الاستخدام</p>
              <p className="text-sm text-gray-600 mt-1">
                اختبر كل قالب مع عينة صغيرة قبل استخدامه في حملات واسعة النطاق لضمان فعاليته وخلوه من الأخطاء
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// مكونات أيقونات إضافية
const Bell = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const Gift = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default TemplatesPage;