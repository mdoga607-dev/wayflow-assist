/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/whatsapp/AddCampaignPage.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  MessageCircle, 
  X, 
  Loader2, 
  Calendar, 
  Users, 
  Tag, 
  Send, 
  Eye, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Badge
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const AddCampaignPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [messageLength, setMessageLength] = useState(0);
  const [importing, setImporting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'marketing' as 'marketing' | 'reminder' | 'notification' | 'promotion',
    message: '',
    recipients: '',
    scheduleDate: format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd\'T\'HH:mm'),
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإنشاء حملات الواتساب",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // تحديث عدد المستلمين وطول الرسالة
  useEffect(() => {
    const count = formData.recipients
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && /^\d+$/.test(s.replace(/[\s+\-()]/g, '')))
      .length;
    setRecipientCount(count);
    
    setMessageLength(formData.message.length);
  }, [formData.recipients, formData.message]);

  // معالجة استيراد قائمة المستلمين
  const handleImportRecipients = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // تقسيم الملف إلى أسطر واستخراج الأرقام
        const numbers = content
          .split(/[\n,;]/)
          .map(line => line.trim().replace(/[\s+\-()]/g, ''))
          .filter(num => num.length > 0 && /^\d+$/.test(num))
          .slice(0, 5000); // حد أقصى 5000 رقم
        
        if (numbers.length === 0) {
          toast({
            title: "لم يتم العثور على أرقام صالحة",
            description: "يرجى التأكد من تنسيق الملف بشكل صحيح",
            variant: "destructive"
          });
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          recipients: numbers.join(', ')
        }));
        
        toast({
          title: "تم الاستيراد بنجاح",
          description: `تم استيراد ${numbers.length} رقم هاتف صالحة`
        });
      } catch (error) {
        console.error('Error importing file:', error);
        toast({
          title: "فشل الاستيراد",
          description: "حدث خطأ أثناء معالجة الملف. يرجى التأكد من تنسيقه الصحيح.",
          variant: "destructive"
        });
      } finally {
        setImporting(false);
        // Reset input value to allow re-uploading the same file
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // تصدير قالب CSV
  const exportTemplate = () => {
    const templateContent = "phone_number,name\n966500000000,العميل الأول\n966511111111,العميل الثاني\n966522222222,العميل الثالث";
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "قالب_المستلمين.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // التحقق من صحة النموذج
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم الحملة",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.message.length < 10) {
      toast({
        title: "خطأ في البيانات",
        description: "الرسالة يجب أن تكون على الأقل 10 أحرف",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.message.length > 4096) {
      toast({
        title: "خطأ في البيانات",
        description: "الرسالة تتجاوز الحد الأقصى المسموح به (4096 حرفاً)",
        variant: "destructive"
      });
      return false;
    }
    
    if (recipientCount === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال قائمة مستلمين صالحة",
        variant: "destructive"
      });
      return false;
    }
    
    if (recipientCount > 5000) {
      toast({
        title: "خطأ في البيانات",
        description: "الحد الأقصى للمستلمين هو 5000 رقم. يرجى تقسيم الحملة إلى عدة حملات.",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.scheduleDate && new Date(formData.scheduleDate) < new Date()) {
      toast({
        title: "خطأ في التاريخ",
        description: "تاريخ الجدولة لا يمكن أن يكون في الماضي",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // معالجة إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // تنسيق قائمة المستلمين
      const formattedRecipients = formData.recipients
        .split(/[\n,;]/)
        .map(s => s.trim().replace(/[\s+\-()]/g, ''))
        .filter(s => s.length > 0 && /^\d+$/.test(s))
        .join(',');
      
      // تحديد الحالة
      const status = formData.scheduleDate && new Date(formData.scheduleDate) > new Date() 
        ? 'scheduled' 
        : 'in_progress';
      
      // إدخال البيانات في قاعدة البيانات
      const { error } = await supabase
        .from('whatsapp_campaigns')
        .insert([{
          name: formData.name.trim(),
          type: formData.type,
          message_template: formData.message.trim(),
          message_count: recipientCount,
          status: status,
          scheduled_at: formData.scheduleDate || null,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "تم إنشاء الحملة بنجاح",
        description: status === 'scheduled' 
          ? `سيتم إرسال ${recipientCount} رسالة في التاريخ المحدد` 
          : `بدأت عملية إرسال ${recipientCount} رسالة الآن`
      });
      
      // الانتقال إلى صفحة الحملات بعد ثانيتين
      setTimeout(() => {
        navigate('/app/whatsapp/campaigns');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      
      if (error.code === '23503') {
        toast({
          title: "خطأ في البيانات",
          description: "المستخدم غير موجود. يرجى تسجيل الدخول مرة أخرى.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل الإنشاء",
          description: error.message || "حدث خطأ أثناء إنشاء الحملة. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // معاينة الرسالة
  const getMessagePreview = () => {
    return formData.message
      .replace(/{name}/g, 'أحمد محمد')
      .replace(/{order}/g, 'WH-123456')
      .replace(/{tracking}/g, 'TR-789012')
      .replace(/{amount}/g, '250 ر.س');
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
      case 'marketing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reminder': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'notification': return 'bg-green-100 text-green-800 border-green-200';
      case 'promotion': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري التحقق من الصلاحيات...</p>
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
            إضافة حملة واتساب جديدة
          </h1>
          <p className="text-gray-600 mt-1">
            أنشئ حملة تسويقية أو تذكيرية فعالة عبر الواتساب
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="gap-2 border-gray-300 hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          إلغاء
        </Button>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">نصائح هامة قبل الإنشاء:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>الحد الأقصى لعدد المستلمين في الحملة الواحدة هو 5000 رقم</li>
                <li>الحد الأقصى لطول الرسالة هو 4096 حرفاً (بما في ذلك المتغيرات)</li>
                <li>يمكنك استخدام المتغيرات: {`{name}`} لاسم العميل، {`{order}`} لرقم الطلب، {`{tracking}`} للتتبع، {`{amount}`} للمبلغ</li>
                <li>للحصول على أفضل معدل تفاعل، أرسل الحملات بين الساعة 10 صباحاً و2 ظهراً</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نموذج إضافة الحملة */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Tag className="h-5 w-5 text-gray-700" />
              بيانات الحملة
            </CardTitle>
            <CardDescription>
              أدخل تفاصيل الحملة التي تريد إنشاءها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اسم الحملة */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-800 flex items-center gap-1">
                  <Tag className="h-4 w-4 text-gray-600" />
                  اسم الحملة <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: عرض خاص يناير - خصم 20%"
                  required
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  اختر اسماً واضحاً يصف الحملة لتسهيل التتبع لاحقاً
                </p>
              </div>

              {/* نوع الحملة */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-800 flex items-center gap-1">
                  <MessageCircle className="h-4 w-4 text-gray-600" />
                  نوع الحملة <span className="text-red-600">*</span>
                </Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="اختر نوع الحملة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        تسويق - للعروض والترويج
                      </div>
                    </SelectItem>
                    <SelectItem value="promotion">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        عروض - للخصومات والعروض الخاصة
                      </div>
                    </SelectItem>
                    <SelectItem value="reminder">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        تذكير - لتذكير العملاء بالدفع أو الاستلام
                      </div>
                    </SelectItem>
                    <SelectItem value="notification">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        إشعارات - لإشعارات عامة للعملاء
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  حدد نوع الحملة لتنظيمها بشكل أفضل في التقارير
                </p>
              </div>

              {/* نص الرسالة */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-800 flex items-center gap-1">
                  <Send className="h-4 w-4 text-gray-600" />
                  نص الرسالة <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={`مرحباً {name}! 👋\n\nعرض خاص لك هذا الشهر: خصم 20% على جميع الشحنات.\nاستخدم الكود: يناير20 عند الحجز.\n\nلتتبع شحنتك: {tracking}\nللاستفسار: 920000000`}
                  rows={8}
                  required
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
                  maxLength={4096}
                />
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      المتغيرات: 
                      <code className="bg-gray-100 px-1 rounded">{`{name}`}</code>,
                      <code className="bg-gray-100 px-1 rounded">{`{order}`}</code>,
                      <code className="bg-gray-100 px-1 rounded">{`{tracking}`}</code>,
                      <code className="bg-gray-100 px-1 rounded">{`{amount}`}</code>
                    </span>
                  </div>
                  <span className={messageLength > 4000 ? 'text-red-600 font-medium' : ''}>
                    {messageLength} / 4096 حرفاً
                  </span>
                </div>
              </div>

              {/* قائمة المستلمين */}
              <div className="space-y-2">
                <Label htmlFor="recipients" className="text-gray-800 flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-600" />
                  قائمة المستلمين <span className="text-red-600">*</span>
                </Label>
                <div className="flex gap-2 mb-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={exportTemplate}
                    className="gap-1 border-gray-300 hover:bg-gray-50"
                  >
                    <Download className="h-3 w-3" />
                    تحميل قالب CSV
                  </Button>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 border-gray-300 hover:bg-gray-50"
                      disabled={importing}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          جاري الاستيراد...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3" />
                          استيراد من ملف
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleImportRecipients}
                      className="hidden"
                    />
                  </label>
                </div>
                <Textarea
                  id="recipients"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  placeholder="966500000000, 966511111111, 966522222222&#10;أو الصق قائمة أرقام من ملف نصي"
                  rows={6}
                  required
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-mono text-sm"
                />
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <span>أدخل أرقام الهواتف مفصولة بفواصل أو مسافات أو أسطر جديدة</span>
                  <span className={recipientCount > 4500 ? 'text-red-600 font-medium' : ''}>
                    {recipientCount} مستلم
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <AlertCircle className="h-3 w-3 inline-block ml-1" />
                  تأكد من أن الأرقام تبدأ بالرمز الدولي (مثل 966 للمملكة) بدون علامات + أو 00
                </p>
              </div>

              {/* تاريخ الجدولة */}
              <div className="space-y-2">
                <Label htmlFor="scheduleDate" className="text-gray-800 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  تاريخ الجدولة (اختياري)
                </Label>
                <Input
                  id="scheduleDate"
                  type="datetime-local"
                  value={formData.scheduleDate}
                  onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd\'T\'HH:mm')}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  <Clock className="h-3 w-3 inline-block ml-1" />
                  إذا تركت فارغاً أو اخترت وقتاً في الماضي، سيتم الإرسال فوراً
                </p>
              </div>

              {/* أزرار الإرسال */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || recipientCount === 0 || messageLength < 10}
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {formData.scheduleDate && new Date(formData.scheduleDate) > new Date() 
                        ? 'جدولة الحملة' 
                        : 'إرسال الحملة فوراً'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* معاينة الرسالة */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                <Eye className="h-5 w-5 text-gray-700" />
                معاينة الرسالة
              </CardTitle>
              <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(formData.type)}`}>
                {getTypeLabel(formData.type)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border border-dashed rounded-lg p-4 min-h-[300px] flex flex-col">
              <div className="flex-1">
                <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[200px] font-sans leading-relaxed">
                  {previewMode 
                    ? getMessagePreview() 
                    : formData.message || 'اكتب رسالتك في الحقل أعلاه لرؤية المعاينة هنا...'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>معاينة مع بيانات عميل نموذجي</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="h-6 px-2 text-xs hover:bg-gray-100"
                  >
                    {previewMode ? 'عرض النص الأصلي' : 'عرض مع المتغيرات'}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">عدد المستلمين</span>
                </div>
                <span className="font-bold text-blue-900">{recipientCount.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Send className="h-4 w-4" />
                  <span className="font-medium">طول الرسالة</span>
                </div>
                <span className={`font-bold ${messageLength > 4000 ? 'text-red-600' : 'text-green-900'}`}>
                  {messageLength} / 4096
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-800">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">موعد الإرسال</span>
                </div>
                <span className="font-bold text-purple-900">
                  {formData.scheduleDate && new Date(formData.scheduleDate) > new Date() 
                    ? format(new Date(formData.scheduleDate), 'dd/MM/yyyy HH:mm', { locale: ar })
                    : 'فوراً'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  <span className="font-medium">ملاحظة:</span> هذه مجرد معاينة. سيتم استبدال المتغيرات 
                  <code className="bg-yellow-100 px-1 mx-0.5 rounded">{`{name}`}</code>,
                  <code className="bg-yellow-100 px-1 mx-0.5 rounded">{`{order}`}</code>... 
                  بالبيانات الفعلية لكل عميل عند الإرسال.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نصائح لكتابة رسائل فعالة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            نصائح لكتابة رسائل واتساب فعالة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">ابدأ بتحية شخصية</p>
              <p className="text-sm text-gray-600 mt-1">
                استخدم اسم العميل {`{name}`} في بداية الرسالة لزيادة التفاعل بنسبة تصل إلى 30%
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">كن واضحاً ومختصراً</p>
              <p className="text-sm text-gray-600 mt-1">
                حافظ على الرسالة قصيرة (أقل من 160 حرفاً) مع تركيز على نقطة واحدة رئيسية
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex-shrink-0">
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
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">تجنب الإطالة والإرسال المتكرر</p>
              <p className="text-sm text-gray-600 mt-1">
                لا ترسل أكثر من رسالة واحدة كل 7 أيام لنفس العميل لتجنب الحظر وتحسين تجربة المستخدم
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCampaignPage;