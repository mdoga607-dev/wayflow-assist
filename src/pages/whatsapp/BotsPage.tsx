/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/whatsapp/BotsPage.tsx
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
  Bot,
  Plus,
  Search,
  Play,
  Square,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Users,
  Settings,
  RefreshCcw,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface ChatBot {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'paused';
  conversations_count: number;
  response_rate: number;
  avg_response_time: number;
  last_active: string;
  created_at: string;
  created_by_name?: string;
}

const BotsPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [bots, setBots] = useState<ChatBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBots, setFilteredBots] = useState<ChatBot[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإدارة روبوتات الواتساب",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب روبوتات الواتساب من قاعدة البيانات
  const fetchBots = async () => {
    try {
      setLoading(true);
      
      const { data: botsData, error } = await supabase
        .from('whatsapp_bots')
        .select(`
          *,
          created_by_user:created_by (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // معالجة البيانات
      const processedBots = (botsData || []).map((bot: any) => ({
        id: bot.id,
        name: bot.name,
        description: bot.description || '',
        status: bot.status as 'active' | 'inactive' | 'paused',
        conversations_count: bot.conversations_count || 0,
        response_rate: bot.response_rate || 0,
        avg_response_time: bot.avg_response_time || 0,
        last_active: bot.last_active || bot.created_at,
        created_at: bot.created_at,
        created_by_name: bot.created_by_user?.name || 'غير معروف'
      }));
      
      setBots(processedBots);
      setFilteredBots(processedBots);
    } catch (error: any) {
      console.error('Error fetching bots:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل روبوتات الواتساب. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchBots();
    }
  }, [authLoading, role]);

  // تطبيق البحث
  useEffect(() => {
    if (!bots.length) return;
    
    const filtered = bots.filter(bot => 
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.status.includes(searchQuery.toLowerCase())
    );
    
    setFilteredBots(filtered);
  }, [searchQuery, bots]);

  // تبديل حالة الروبوت (تشغيل/إيقاف)
  const handleToggleStatus = async (botId: string, currentStatus: string) => {
    setTogglingId(botId);
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('whatsapp_bots')
        .update({ status: newStatus })
        .eq('id', botId);

      if (error) throw error;
      
      // تحديث القائمة محلياً
      setBots(prev => prev.map(bot => 
        bot.id === botId ? { ...bot, status: newStatus as 'active' | 'inactive' | 'paused' } : bot
      ));
      setFilteredBots(prev => prev.map(bot => 
        bot.id === botId ? { ...bot, status: newStatus as 'active' | 'inactive' | 'paused' } : bot
      ));
      
      toast({
        title: "تم التحديث بنجاح",
        description: `تم ${newStatus === 'active' ? 'تشغيل' : 'إيقاف'} الروبوت بنجاح`
      });
    } catch (error: any) {
      console.error('Error toggling bot status:', error);
      toast({
        title: "فشل التحديث",
        description: error.message || "حدث خطأ أثناء تحديث حالة الروبوت",
        variant: "destructive"
      });
    } finally {
      setTogglingId(null);
    }
  };

  // حذف روبوت
  const handleDeleteBot = async (botId: string, botName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الروبوت "${botName}"؟ هذه العملية لا يمكن التراجع عنها.`)) return;
    
    try {
      const { error } = await supabase
        .from('whatsapp_bots')
        .delete()
        .eq('id', botId);

      if (error) throw error;
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الروبوت بنجاح"
      });
      
      // تحديث القائمة
      fetchBots();
    } catch (error: any) {
      console.error('Error deleting bot:', error);
      toast({
        title: "فشل الحذف",
        description: error.message || "حدث خطأ أثناء حذف الروبوت",
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
        ['تقرير روبوتات الواتساب'],
        ['تاريخ التصدير:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['اسم الروبوت', 'الوصف', 'الحالة', 'عدد المحادثات', 'معدل الاستجابة', 'متوسط وقت الرد', 'آخر تفاعل'],
        ...filteredBots.map(bot => [
          bot.name,
          bot.description,
          getStatusLabel(bot.status),
          bot.conversations_count.toLocaleString(),
          `${bot.response_rate}%`,
          `${bot.avg_response_time}s`,
          bot.last_active ? format(new Date(bot.last_active), 'dd/MM/yyyy HH:mm', { locale: ar }) : 'غير متاح'
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي الروبوتات', 'إجمالي المحادثات', 'متوسط معدل الاستجابة', 'متوسط وقت الرد'],
        [
          filteredBots.length.toString(),
          filteredBots.reduce((sum, b) => sum + b.conversations_count, 0).toLocaleString(),
          filteredBots.length > 0 
            ? `${(filteredBots.reduce((sum, b) => sum + b.response_rate, 0) / filteredBots.length).toFixed(1)}%`
            : '0%',
          filteredBots.length > 0 
            ? `${(filteredBots.reduce((sum, b) => sum + b.avg_response_time, 0) / filteredBots.length).toFixed(1)}s`
            : '0s'
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "روبوتات الواتساب");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `روبوتات_الواتساب_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير روبوتات الواتساب إلى ملف Excel"
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
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'paused': return 'متوقف مؤقتاً';
      default: return status;
    }
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // دالة لتحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive': return <Square className="h-4 w-4 text-gray-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <Square className="h-4 w-4 text-gray-600" />;
    }
  };

  // دالة لتحديد لون معدل الاستجابة
  const getResponseRateColor = (rate: number) => {
    if (rate >= 95) return 'bg-green-100 text-green-800';
    if (rate >= 90) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل روبوتات الواتساب...</p>
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
            <Bot className="h-6 w-6 text-purple-600" />
            روبوتات الواتساب (Chat Bots)
          </h1>
          <p className="text-gray-600 mt-1">
            إدارة روبوتات المحادثة التلقائية للرد على العملاء وتحسين الخدمة
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchBots}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث القائمة
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting || filteredBots.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
          <Button 
            onClick={() => navigate('/app/whatsapp/add-bot')}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            إنشاء روبوت جديد
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
                <li>الروبوتات النشطة تعمل تلقائياً على الرد على رسائل العملاء وفقاً للقواعد المحددة</li>
                <li>يمكنك إيقاف الروبوت مؤقتاً دون حذفه للحفاظ على إعداداته</li>
                <li>معدل الاستجابة يحسب بنسبة الردود الناجحة إلى إجمالي المحاولات</li>
                <li>متوسط وقت الرد يحسب بالثواني من استلام الرسالة حتى إرسال الرد</li>
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
                <p className="text-sm text-gray-600">إجمالي الروبوتات</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">
                  {bots.length}
                </p>
              </div>
              <Bot className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المحادثات النشطة</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {bots.reduce((sum, b) => sum + b.conversations_count, 0).toLocaleString()}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط معدل الاستجابة</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {bots.length > 0 
                    ? `${(bots.reduce((sum, b) => sum + b.response_rate, 0) / bots.length).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الروبوتات النشطة</p>
                <p className="text-2xl font-bold mt-1 text-orange-700">
                  {bots.filter(b => b.status === 'active').length}
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
              <CardTitle className="text-lg text-gray-800">قائمة الروبوتات ({filteredBots.length})</CardTitle>
              <CardDescription className="mt-1">
                إدارة روبوتات المحادثة التلقائية للواتساب
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث باسم الروبوت أو الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bot className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد روبوتات</p>
              <p className="max-w-md mx-auto">
                {searchQuery 
                  ? "لم يتم العثور على روبوتات مطابقة لمعايير البحث" 
                  : "لم يتم إنشاء أي روبوتات حتى الآن. يمكنك إنشاء روبوت جديد بالنقر على الزر أعلاه"}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/app/whatsapp/add-bot')}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء روبوت جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-48">اسم الروبوت</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">الوصف</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المحادثات</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">معدل الاستجابة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">متوسط وقت الرد</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">آخر تفاعل</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-40">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBots.map((bot) => (
                    <TableRow 
                      key={bot.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {bot.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600">
                        {bot.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(bot.status)}`}>
                          {getStatusIcon(bot.status)}
                          {getStatusLabel(bot.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {bot.conversations_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${getResponseRateColor(bot.response_rate)}`}>
                          {bot.response_rate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {bot.avg_response_time}s
                      </TableCell>
                      <TableCell className="font-mono text-gray-700">
                        {bot.last_active 
                          ? format(new Date(bot.last_active), 'dd/MM HH:mm', { locale: ar })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/whatsapp/bots/${bot.id}`)}
                            className="h-8 hover:bg-blue-50 text-blue-700"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/whatsapp/bots/edit/${bot.id}`)}
                            className="h-8 hover:bg-yellow-50 text-yellow-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={bot.status === 'active' ? 'ghost' : 'default'}
                            size="sm"
                            onClick={() => handleToggleStatus(bot.id, bot.status)}
                            disabled={togglingId === bot.id}
                            className={`h-8 ${
                              bot.status === 'active' 
                                ? 'hover:bg-red-50 text-red-700' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {togglingId === bot.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : bot.status === 'active' ? (
                              <Square className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBot(bot.id, bot.name)}
                            className="h-8 hover:bg-red-50 text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
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
              <span className="font-medium">إجمالي الروبوتات:</span> {filteredBots.length} روبوت
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                نشطة: {filteredBots.filter(b => b.status === 'active').length}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                متوقفة مؤقتاً: {filteredBots.filter(b => b.status === 'paused').length}
              </Badge>
              <Badge className="bg-gray-100 text-gray-800 border border-gray-200">
                غير نشطة: {filteredBots.filter(b => b.status === 'inactive').length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نصائح لإدارة روبوتات فعالة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            نصائح لإدارة روبوتات واتساب فعالة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">تصميم محادثات ذكية</p>
              <p className="text-sm text-gray-600 mt-1">
                صمم سيناريوهات محادثة تغطي الأسئلة الشائعة مع خيارات واضحة للعملاء لتجنب الارتباك
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">التحديث المنتظم</p>
              <p className="text-sm text-gray-600 mt-1">
                حدّث قاعدة معرفة الروبوت بانتظام بناءً على أسئلة العملاء الجديدة والمتكررة
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">المراقبة والتحسين</p>
              <p className="text-sm text-gray-600 mt-1">
                راقب معدلات الاستجابة وأوقات الرد لتحديد نقاط الضعف وتحسين أداء الروبوت باستمرار
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">التكامل مع البشر</p>
              <p className="text-sm text-gray-600 mt-1">
                أنشئ آلية لتحويل المحادثات المعقدة إلى ممثل بشري عندما يفشل الروبوت في حل المشكلة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// مكون أيقونة مؤقتة للإيقاف
const Pause = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
);

export default BotsPage;