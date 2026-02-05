/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/whatsapp/AddBotPage.tsx
import { useState, useEffect } from 'react';
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
  Bot, 
  X, 
  Loader2, 
  MessageSquare, 
  Settings,
  AlertCircle,
  Info,
  Brain,
  Zap,
  ShieldCheck
} from 'lucide-react';

const AddBotPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'customer_service' as 'customer_service' | 'sales' | 'support' | 'marketing',
    welcome_message: 'مرحباً! أنا روبوت الدردشة الآلي. كيف يمكنني مساعدتك اليوم؟',
    fallback_message: 'عذراً، لم أفهم سؤالك. يرجى إعادة الصياغة أو الاتصال بنا مباشرة على 920000000',
    is_active: false
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإنشاء روبوتات الواتساب",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // التحقق من صحة النموذج
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم الروبوت",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.name.length < 3) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم الروبوت يجب أن يكون على الأقل 3 أحرف",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.welcome_message.length < 10) {
      toast({
        title: "خطأ في البيانات",
        description: "رسالة الترحيب يجب أن تكون على الأقل 10 أحرف",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.fallback_message.length < 10) {
      toast({
        title: "خطأ في البيانات",
        description: "رسالة الرد الافتراضي يجب أن تكون على الأقل 10 أحرف",
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
      // إنشاء تكوين افتراضي للروبوت
      const defaultConfig = {
        language: 'ar',
        max_retries: 3,
        response_delay: 1000,
        keywords: {
          greetings: ['مرحبا', 'أهلا', 'السلام عليكم', 'هلا'],
          farewells: ['مع السلامة', 'إلى اللقاء', 'باي'],
          help: ['مساعدة', 'دعم', 'مشكلة', 'عطل']
        },
        responses: {
          greetings: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
          farewells: 'شكراً لزيارتك! نتمنى لك يوماً سعيداً',
          help: 'يمكنك طرح أي سؤال وسأبذل جهدي للإجابة'
        }
      };

      const { error } = await supabase
        .from('whatsapp_bots')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          status: formData.is_active ? 'active' : 'inactive',
          conversations_count: 0,
          response_rate: 0,
          avg_response_time: 0,
          config: defaultConfig,
          welcome_message: formData.welcome_message.trim(),
          fallback_message: formData.fallback_message.trim(),
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "تم الإنشاء بنجاح",
        description: `تم إنشاء روبوت "${formData.name}" بنجاح. يمكنك تفعيله من صفحة الإدارة.`
      });
      
      // الانتقال إلى صفحة الروبوتات بعد ثانيتين
      setTimeout(() => {
        navigate('/app/whatsapp/bots');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating bot:', error);
      
      if (error.code === '23505') {
        toast({
          title: "الروبوت موجود مسبقاً",
          description: "يوجد روبوت بنفس الاسم. يرجى اختيار اسم فريد.",
          variant: "destructive"
        });
      } else if (error.code === '23503') {
        toast({
          title: "خطأ في البيانات",
          description: "المستخدم غير موجود. يرجى تسجيل الدخول مرة أخرى.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل الإنشاء",
          description: error.message || "حدث خطأ أثناء إنشاء الروبوت. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // دالة لتحويل فئة الروبوت للعربية
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'customer_service': return 'خدمة عملاء';
      case 'sales': return 'مبيعات';
      case 'support': return 'دعم فني';
      case 'marketing': return 'تسويق';
      default: return category;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
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
            <Bot className="h-6 w-6 text-purple-600" />
            إنشاء روبوت واتساب جديد
          </h1>
          <p className="text-gray-600 mt-1">
            أنشئ روبوت محادثة ذكي للرد التلقائي على عملائك وتحسين خدمة العملاء
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
          <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
            <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-800">
              <p className="font-medium">ملاحظات هامة قبل الإنشاء:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>الروبوتات تساعد في الرد التلقائي على الأسئلة الشائعة وتوفير الوقت للعملاء والموظفين</li>
                <li>يمكنك تفعيل الروبوت بعد الإنشاء من صفحة الإدارة</li>
                <li>الروبوت سيتعلم تدريجياً من المحادثات لتحسين أدائه</li>
                <li>يتم تعيين إعدادات افتراضية ذكية، ويمكنك تعديلها لاحقاً حسب احتياجاتك</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نموذج إنشاء الروبوت */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Bot className="h-5 w-5 text-gray-700" />
              بيانات الروبوت
            </CardTitle>
            <CardDescription>
              أدخل تفاصيل الروبوت الذي تريد إنشاءه
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اسم الروبوت */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-800 flex items-center gap-1">
                  <Bot className="h-4 w-4 text-gray-600" />
                  اسم الروبوت <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: روبوت خدمة العملاء، روبوت المبيعات"
                  required
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  اختر اسماً يعبر عن وظيفة الروبوت لتسهيل التعرف عليه لاحقاً
                </p>
              </div>

              {/* الفئة */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-800 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-gray-600" />
                  الفئة <span className="text-red-600">*</span>
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                    <SelectValue placeholder="اختر فئة الروبوت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_service">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        خدمة عملاء - للرد على استفسارات العملاء
                      </div>
                    </SelectItem>
                    <SelectItem value="sales">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        مبيعات - لعرض المنتجات والعروض
                      </div>
                    </SelectItem>
                    <SelectItem value="support">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        دعم فني - لحل المشاكل الفنية
                      </div>
                    </SelectItem>
                    <SelectItem value="marketing">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        تسويق - للحملات التسويقية
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  حدد الفئة المناسبة لوظيفة الروبوت
                </p>
              </div>

              {/* الوصف */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-800">
                  الوصف (اختياري)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر لوظيفة الروبوت وأهدافه..."
                  rows={3}
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                  maxLength={255}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {formData.description.length}/255
                </p>
              </div>

              {/* رسالة الترحيب */}
              <div className="space-y-2">
                <Label htmlFor="welcome_message" className="text-gray-800 flex items-center gap-1">
                  <Zap className="h-4 w-4 text-gray-600" />
                  رسالة الترحيب <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="welcome_message"
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  placeholder="مرحباً! أنا روبوت الدردشة الآلي. كيف يمكنني مساعدتك اليوم؟"
                  rows={3}
                  required
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none font-sans"
                  maxLength={255}
                />
                <p className="text-xs text-gray-500 mt-1">
                  هذه الرسالة ستظهر للعميل عند بدء المحادثة لأول مرة
                </p>
              </div>

              {/* رسالة الرد الافتراضي */}
              <div className="space-y-2">
                <Label htmlFor="fallback_message" className="text-gray-800 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-gray-600" />
                  رسالة الرد الافتراضي <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="fallback_message"
                  value={formData.fallback_message}
                  onChange={(e) => setFormData({ ...formData, fallback_message: e.target.value })}
                  placeholder="عذراً، لم أفهم سؤالك. يرجى إعادة الصياغة أو الاتصال بنا مباشرة على 920000000"
                  rows={3}
                  required
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none font-sans"
                  maxLength={255}
                />
                <p className="text-xs text-gray-500 mt-1">
                  هذه الرسالة ستظهر عندما لا يستطيع الروبوت فهم سؤال العميل
                </p>
              </div>

              {/* تفعيل الروبوت */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <Label htmlFor="is_active" className="text-gray-800 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-600" />
                  تفعيل الروبوت فوراً؟
                </Label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${
                        formData.is_active ? 'bg-purple-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                        formData.is_active ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                    <div className="mr-3 text-sm font-medium text-gray-700">
                      {formData.is_active ? 'مفعل' : 'غير مفعل'}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <AlertCircle className="h-3 w-3 inline-block ml-1" />
                  نوصي بعدم التفعيل الفوري حتى تقوم باختبار الروبوت وضبط إعداداته أولاً
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
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      إنشاء الروبوت
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* معلومات الروبوت */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Brain className="h-5 w-5 text-gray-700" />
              معلومات الروبوت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-start gap-2 text-purple-800">
                <Brain className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">ذكاء اصطناعي مدمج</p>
                  <p className="text-xs mt-1">
                    يتم تزويد الروبوت بإعدادات ذكية افتراضية تشمل:
                    <ul className="list-disc pr-4 mt-1 space-y-0.5">
                      <li>الرد على التحيات والوداعات</li>
                      <li>التعامل مع طلبات المساعدة</li>
                      <li>الرد على الأسئلة الشائعة</li>
                      <li>تحويل المحادثات المعقدة للدعم البشري</li>
                    </ul>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">المحادثات المتوقعة</span>
                </div>
                <span className="text-sm font-bold text-blue-900">500+/يوم</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">وقت الاستجابة</span>
                </div>
                <span className="text-sm font-bold text-green-900">أقل من ثانيتين</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">قابل للتخصيص</span>
                </div>
                <span className="text-sm font-bold text-yellow-900">100%</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-xs text-gray-700 font-medium mb-2">الإعدادات الافتراضية:</p>
              <ul className="text-xs text-gray-600 space-y-1 pr-3">
                <li>• اللغة: العربية</li>
                <li>• أقصى عدد للمحاولات: 3</li>
                <li>• تأخير الرد: ثانيتان</li>
                <li>• الكلمات المفتاحية: مدمجة مسبقاً</li>
                <li>• الردود التلقائية: جاهزة للاستخدام</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                يمكنك تعديل جميع هذه الإعدادات لاحقاً من صفحة تفاصيل الروبوت
              </p>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2 text-red-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  <span className="font-medium">تنبيه:</span> الروبوتات تحتاج إلى تدريب وتحسين مستمر لتحقيق أفضل أداء. نوصي بمراجعة تقارير الأداء أسبوعياً.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* خطوات بعد الإنشاء */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-700" />
            الخطوات التالية بعد الإنشاء
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">اختبار الروبوت</p>
              <p className="text-sm text-gray-600 mt-1">
                قم باختبار الروبوت مع عينة صغيرة من العملاء قبل التفعيل الكامل لضمان جودة الأداء
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">ضبط الإعدادات</p>
              <p className="text-sm text-gray-600 mt-1">
                قم بتعديل الإعدادات المتقدمة مثل الكلمات المفتاحية والردود التلقائية لتناسب احتياجات عملك
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">التفعيل التدريجي</p>
              <p className="text-sm text-gray-600 mt-1">
                فعّل الروبوت تدريجياً مع نسبة صغيرة من العملاء أولاً، ثم زد النسبة تدريجياً
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">المراقبة والتحسين</p>
              <p className="text-sm text-gray-600 mt-1">
                راقب تقارير الأداء بانتظام وقم بتحسين الروبوت بناءً على تحليل المحادثات
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBotPage;