/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/whatsapp/MyCampaignsPage.tsx
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
  MessageCircle,
  Plus,
  Search,
  RefreshCcw,
  Eye,
  BarChart3,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Download,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import * as XLSX from 'xlsx';

interface Campaign {
  id: string;
  name: string;
  type: string;
  message_count: number;
  status: 'completed' | 'in_progress' | 'scheduled' | 'failed';
  created_at: string;
  scheduled_at?: string;
  sent_count?: number;
  delivered_count?: number;
  read_count?: number;
  created_by_name?: string;
}

const MyCampaignsPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لعرض حملات الواتساب",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب الحملات الخاصة بالمستخدم الحالي
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      const { data: campaignsData, error } = await supabase
        .from('whatsapp_campaigns')
        .select(`
          *,
          created_by_user:created_by (
            name
          )
        `)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // معالجة البيانات
      const processedCampaigns = (campaignsData || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        message_count: campaign.message_count,
        status: campaign.status as 'completed' | 'in_progress' | 'scheduled' | 'failed',
        created_at: campaign.created_at,
        scheduled_at: campaign.scheduled_at,
        sent_count: campaign.sent_count,
        delivered_count: campaign.delivered_count,
        read_count: campaign.read_count,
        created_by_name: campaign.created_by_user?.name || 'غير معروف'
      }));
      
      setCampaigns(processedCampaigns);
      setFilteredCampaigns(processedCampaigns);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل الحملات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && user && ['head_manager', 'manager'].includes(role || '')) {
      fetchCampaigns();
    }
  }, [authLoading, user, role]);

  // تطبيق البحث
  useEffect(() => {
    if (!campaigns.length) return;
    
    const filtered = campaigns.filter(campaign => 
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.status.includes(searchQuery.toLowerCase())
    );
    
    setFilteredCampaigns(filtered);
  }, [searchQuery, campaigns]);

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // تحضير البيانات
      const worksheetData = [
        ['تقرير حملات الواتساب (الخاصة بي)'],
        ['اسم المستخدم:', user?.email || '', 'التاريخ:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['اسم الحملة', 'النوع', 'عدد الرسائل', 'الحالة', 'تاريخ الإنشاء', 'المرسلة', 'المستلمة', 'المقروءة'],
        ...filteredCampaigns.map(campaign => [
          campaign.name,
          getTypeLabel(campaign.type),
          campaign.message_count.toLocaleString(),
          getStatusLabel(campaign.status),
          format(new Date(campaign.created_at), 'yyyy-MM-dd HH:mm', { locale: ar }),
          campaign.sent_count?.toLocaleString() || '0',
          campaign.delivered_count?.toLocaleString() || '0',
          campaign.read_count?.toLocaleString() || '0'
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي الحملات', 'إجمالي الرسائل', 'المعدل الكلي للتسليم', 'المعدل الكلي للقراءة'],
        [
          filteredCampaigns.length.toString(),
          filteredCampaigns.reduce((sum, c) => sum + c.message_count, 0).toLocaleString(),
          filteredCampaigns.length > 0 
            ? `${Math.round(
                (filteredCampaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0) / 
                filteredCampaigns.reduce((sum, c) => sum + (c.message_count || 1), 0)) * 100
              )}%`
            : '0%',
          filteredCampaigns.length > 0 
            ? `${Math.round(
                (filteredCampaigns.reduce((sum, c) => sum + (c.read_count || 0), 0) / 
                filteredCampaigns.reduce((sum, c) => sum + (c.delivered_count || 1), 0)) * 100
              )}%`
            : '0%'
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "حملاتي");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `حملاتي_الواتساب_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير حملاتك إلى ملف Excel"
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

  // حذف حملة
  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحملة "${campaignName}"؟ هذه العملية لا يمكن التراجع عنها.`)) return;
    
    setDeletingId(campaignId);
    try {
      const { error } = await supabase
        .from('whatsapp_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('created_by', user?.id);

      if (error) throw error;
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الحملة بنجاح"
      });
      
      // تحديث القائمة
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "فشل الحذف",
        description: error.message || "حدث خطأ أثناء حذف الحملة",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  // دالة لتحويل نوع الحملة للعربية
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'marketing': return 'تسويق';
      case 'reminder': return 'تذكير';
      case 'notification': return 'إشعارات';
      case 'promotion': return 'عروض';
      default: return type;
    }
  };

  // دالة لتحديد لون النوع
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'marketing': return 'bg-blue-100 text-blue-800';
      case 'reminder': return 'bg-purple-100 text-purple-800';
      case 'notification': return 'bg-green-100 text-green-800';
      case 'promotion': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // دالة لتحويل الحالة للعربية
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'scheduled': return 'مجدولة';
      case 'failed': return 'فشلت';
      default: return status;
    }
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // دالة لتحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل حملاتك...</p>
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
            <MessageCircle className="h-6 w-6 text-green-600" />
            حملات الواتساب (الخاصة بي)
          </h1>
          <p className="text-gray-600 mt-1">
            عرض وإدارة الحملات التي أنشأتها أنت فقط
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={fetchCampaigns}
            variant="outline"
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث القائمة
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting || filteredCampaigns.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
          <Button 
            onClick={() => navigate('/app/whatsapp/add-campaign')}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            إنشاء حملة جديدة
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>هذه الصفحة تعرض الحملات التي أنشأتها أنت فقط، وليس جميع حملات النظام</li>
                <li>يمكنك تصدير جميع حملاتك إلى ملف Excel لتحليل الأداء</li>
                <li>الحملات المجدولة سيتم إرسالها تلقائياً في الوقت المحدد</li>
                <li>يمكنك عرض تفاصيل كل حملة ومشاهدة الإحصائيات الكاملة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg text-gray-800">قائمة حملاتي ({filteredCampaigns.length})</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث باسم الحملة أو النوع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد حملات</p>
              <p className="max-w-md mx-auto">
                {searchQuery 
                  ? "لم يتم العثور على حملات مطابقة لمعايير البحث" 
                  : "لم تقم بإنشاء أي حملات حتى الآن. يمكنك إنشاء حملة جديدة بالنقر على الزر أعلاه"}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/app/whatsapp/add-campaign')}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء حملة جديدة
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-48">اسم الحملة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">النوع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">عدد الرسائل</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المرسلة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-36">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow 
                      key={campaign.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {campaign.name}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(campaign.type)}`}>
                          {getTypeLabel(campaign.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {campaign.message_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          {getStatusLabel(campaign.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-gray-700">
                        {format(new Date(campaign.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {campaign.sent_count?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/whatsapp/campaigns/${campaign.id}`)}
                            className="h-8 hover:bg-blue-50 text-blue-700"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/whatsapp/campaigns/${campaign.id}/stats`)}
                            className="h-8 hover:bg-green-50 text-green-700"
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                            disabled={deletingId === campaign.id}
                            className="h-8 hover:bg-red-50 text-red-700"
                          >
                            {deletingId === campaign.id ? (
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
              <span className="font-medium">إجمالي حملاتك:</span> {filteredCampaigns.length} حملة
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-100 text-green-800">
                مكتملة: {filteredCampaigns.filter(c => c.status === 'completed').length}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800">
                قيد التنفيذ: {filteredCampaigns.filter(c => c.status === 'in_progress').length}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                مجدولة: {filteredCampaigns.filter(c => c.status === 'scheduled').length}
              </Badge>
              <Badge className="bg-red-100 text-red-800">
                فاشلة: {filteredCampaigns.filter(c => c.status === 'failed').length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي حملاتك</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {campaigns.length}
                </p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الرسائل</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {campaigns.reduce((sum, c) => sum + c.message_count, 0).toLocaleString()}
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل التسليم</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">
                  {campaigns.length > 0 
                    ? Math.round(
                        (campaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0) / 
                        campaigns.reduce((sum, c) => sum + (c.message_count || 1), 0)) * 100
                      ) 
                    : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل القراءة</p>
                <p className="text-2xl font-bold mt-1 text-orange-700">
                  {campaigns.length > 0 
                    ? Math.round(
                        (campaigns.reduce((sum, c) => sum + (c.read_count || 0), 0) / 
                        campaigns.reduce((sum, c) => sum + (c.delivered_count || 1), 0)) * 100
                      ) 
                    : 0}%
                </p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نصائح لإنشاء حملات فعالة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            نصائح لإنشاء حملات واتساب فعالة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">توقيت الإرسال المثالي</p>
              <p className="text-sm text-gray-600 mt-1">
                أرسل الحملات بين الساعة 10 صباحاً و2 ظهراً للحصول على أعلى معدل قراءة
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">محتوى جذاب ومختصر</p>
              <p className="text-sm text-gray-600 mt-1">
                اجعل الرسالة قصيرة وواضحة مع دعوة واضحة للعمل (Call to Action)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">تخصيص المحتوى</p>
              <p className="text-sm text-gray-600 mt-1">
                خصص الرسائل حسب شريحة العملاء لزيادة التفاعل والتحويلات
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">تحليل النتائج</p>
              <p className="text-sm text-gray-600 mt-1">
                راجع إحصائيات الحملات السابقة لتحسين الحملات المستقبلية وزيادة العائد على الاستثمار
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyCampaignsPage;