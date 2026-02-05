/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/whatsapp/AddTemplatePage.tsx
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
  FileText, 
  X, 
  Loader2, 
  Tag, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Copy,
  Info,
  Badge
} from 'lucide-react';
import { format } from 'date-fns';

const AddTemplatePage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'sales' as 'sales' | 'collections' | 'customer_service' | 'marketing' | 'notifications' | 'promotions',
    content: ''
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإنشاء قوالب الواتساب",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // تحديث طول المحتوى
  useEffect(() => {
    setContentLength(formData.content.length);
  }, [formData.content]);

  // التحقق من صحة النموذج
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم القالب",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.name.length < 3) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم القالب يجب أن يكون على الأقل 3 أحرف",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.content.length < 10) {
      toast({
        title: "خطأ في البيانات",
        description: "محتوى القالب يجب أن يكون على الأقل 10 أحرف",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.content.length > 4096) {
      toast({
        title: "خطأ في البيانات",
        description: "محتوى القالب تجاوز الحد الأقصى المسموح به (4096 حرفاً)",
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
      const { error } = await supabase
        .from('whatsapp_templates')
        .insert([{
          name: formData.name.trim(),
          category: formData.category,
          content: formData.content.trim(),
          usage_count: 0,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إنشاء القالب الجديد بنجاح"
      });
      
      // الانتقال إلى صفحة القوالب بعد ثانيتين
      setTimeout(() => {
        navigate('/app/whatsapp/templates');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating template:', error);
      
      if (error.code === '23505') {
        toast({
          title: "القالب موجود مسبقاً",
          description: "يوجد قالب بنفس الاسم. يرجى اختيار اسم فريد.",
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
          description: error.message || "حدث خطأ أثناء إنشاء القالب. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // نسخ المتغير إلى الحافظة
  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVariable(variable);
    toast({
      title: "تم النسخ",
      description: `تم نسخ المتغير ${variable} إلى الحافظة`
    });
    
    setTimeout(() => {
      setCopiedVariable(null);
    }, 2000);
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
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'collections': return 'bg-red-100 text-red-800';
      case 'customer_service': return 'bg-green-100 text-green-800';
      case 'marketing': return 'bg-purple-100 text-purple-800';
      case 'notifications': return 'bg-yellow-100 text-yellow-800';
      case 'promotions': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <FileText className="h-6 w-6 text-blue-600" />
            إضافة قالب واتساب جديد
          </h1>
          <p className="text-gray-600 mt-1">
            أنشئ قالباً نصياً جاهزاً للاستخدام في حملات الواتساب والمراسلات
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
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">نصائح هامة لإنشاء قالب فعّال:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>استخدم المتغيرات مثل <code className="bg-blue-100 px-1 rounded">{`{name}`}</code> لتخصيص الرسائل وزيادة التفاعل</li>
                <li>اجعل الرسالة قصيرة وواضحة (أقل من 160 حرفاً) لتحقيق أفضل معدل قراءة</li>
                <li>أضف دعوة واضحة للعمل (Call to Action) مثل "احجز الآن" أو "اتصل بنا"</li>
                <li>تجنب استخدام الكثير من الرموز التعبيرية (Emojis) التي قد تؤثر على احترافية الرسالة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نموذج إضافة القالب */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Tag className="h-5 w-5 text-gray-700" />
              بيانات القالب
            </CardTitle>
            <CardDescription>
              أدخل تفاصيل القالب النصي الذي تريد إنشاءه
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اسم القالب */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-800 flex items-center gap-1">
                  <Tag className="h-4 w-4 text-gray-600" />
                  اسم القالب <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: تأكيد الطلب، تذكير بالدفع"
                  required
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  اختر اسماً واضحاً يصف محتوى القالب لتسهيل العثور عليه لاحقاً
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
                  <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="اختر فئة القالب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        مبيعات - لتأكيد الطلبات وعرض المنتجات
                      </div>
                    </SelectItem>
                    <SelectItem value="promotions">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        عروض - للخصومات والعروض الترويجية
                      </div>
                    </SelectItem>
                    <SelectItem value="collections">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        تحصيل - لتذكير العملاء بالدفع
                      </div>
                    </SelectItem>
                    <SelectItem value="customer_service">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        خدمة عملاء - للاستبيانات وخدمة الدعم
                      </div>
                    </SelectItem>
                    <SelectItem value="marketing">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        تسويق - للحملات التسويقية العامة
                      </div>
                    </SelectItem>
                    <SelectItem value="notifications">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        إشعارات - للإشعارات العامة والتحديثات
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  حدد الفئة المناسبة لتنظيم القوالب وتسهيل الوصول إليها
                </p>
              </div>

              {/* محتوى القالب */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-gray-800 flex items-center gap-1">
                  <FileText className="h-4 w-4 text-gray-600" />
                  محتوى القالب <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={`مرحباً {name}! 👋\n\nتم استلام طلبك #{order} وسيتم توصيله خلال 24 ساعة.\nالمبلغ الإجمالي: {amount} ر.س\n\nلتتبع شحنتك: {tracking_link}\nللاستفسار: 920000000`}
                  rows={10}
                  required
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
                  maxLength={4096}
                />
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      المتغيرات المدعومة:
                    </span>
                    {['{name}', '{order}', '{amount}', '{tracking}', '{code}'].map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => copyVariable(variable)}
                        className={`px-1.5 py-0.5 rounded text-xs font-mono transition-colors ${
                          copiedVariable === variable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                        }`}
                        title={`انقر لنسخ ${variable}`}
                      >
                        {copiedVariable === variable ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {variable}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="h-3 w-3" />
                            {variable}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <span className={contentLength > 4000 ? 'text-red-600 font-medium' : ''}>
                    {contentLength} / 4096 حرفاً
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <AlertCircle className="h-3 w-3 inline-block ml-1" />
                  يمكنك استخدام المتغيرات أعلاه وسيتم استبدالها تلقائياً ببيانات العميل عند الإرسال
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
                  disabled={loading || contentLength < 10 || contentLength > 4096}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      إنشاء القالب
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* معاينة القالب */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-700" />
                معاينة القالب
              </CardTitle>
              <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(formData.category)}`}>
                {getCategoryLabel(formData.category)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border border-dashed rounded-lg p-4 min-h-[300px] flex flex-col">
              <div className="flex-1">
                <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[200px] font-sans leading-relaxed">
                  {formData.content || 'اكتب محتوى القالب في الحقل أعلاه لرؤية المعاينة هنا...'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>معاينة بدون استبدال المتغيرات</span>
                  <span className="font-medium">{contentLength} حرفاً</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2 text-blue-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs">
                    <span className="font-medium">ملاحظة:</span> عند استخدام هذا القالب في حملة، سيتم استبدال المتغيرات مثل 
                    <code className="bg-blue-100 px-1 mx-0.5 rounded">{`{name}`}</code>,
                    <code className="bg-blue-100 px-1 mx-0.5 rounded">{`{order}`}</code> 
                    بالبيانات الفعلية لكل عميل.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Tag className="h-4 w-4" />
                    <span className="text-xs font-medium">عدد الأحرف</span>
                  </div>
                  <span className={`text-xs font-bold ${
                    contentLength > 4000 ? 'text-red-600' : 'text-green-900'
                  }`}>
                    {contentLength}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-800">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs font-medium">الحالة</span>
                  </div>
                  <Badge className={`px-2 py-0.5 rounded-full text-xs ${
                    contentLength >= 10 && contentLength <= 4096
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {contentLength >= 10 && contentLength <= 4096 ? 'صالح' : 'يتطلب تعديلاً'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أمثلة على قوالب فعالة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Info className="h-5 w-5 text-gray-700" />
            أمثلة على قوالب فعالة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">قالب تأكيد طلب (مبيعات)</p>
                <div className="mt-2 p-3 bg-white rounded border border-blue-200 font-sans text-sm">
                  <p>مرحباً {`{name}`}،</p>
                  <p className="mt-1">تم استلام طلبك #{`{order}`} بنجاح!</p>
                  <p className="mt-1">المبلغ الإجمالي: {`{amount}`} ر.س</p>
                  <p className="mt-1">سيتم توصيل طلبك خلال 24 ساعة. يمكنك تتبع شحنتك عبر: {`{tracking_link}`}</p>
                  <p className="mt-1">شكراً لثقتك بنا!</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-red-50">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">قالب تذكير بالدفع (تحصيل)</p>
                <div className="mt-2 p-3 bg-white rounded border border-red-200 font-sans text-sm">
                  <p>تنبيه هام {`{name}`}،</p>
                  <p className="mt-1">لديك مبلغ مستحق بقيمة {`{amount}`} ر.س لطلبك #{`{order}`}</p>
                  <p className="mt-1">يرجى السداد خلال 48 ساعة لتجنب إيقاف الخدمة.</p>
                  <p className="mt-1">للسداد: {`{payment_link}`}</p>
                  <p className="mt-1">للاستفسار: 920000000</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">قالب استبيان رضا (خدمة عملاء)</p>
                <div className="mt-2 p-3 bg-white rounded border border-green-200 font-sans text-sm">
                  <p>مرحباً {`{name}`}،</p>
                  <p className="mt-1">نود معرفة رأيك في خدمتنا. هل أنت راضٍ عن تجربتك معنا؟</p>
                  <p className="mt-1">الرد برقم:</p>
                  <p>1 - ممتاز 👍</p>
                  <p>2 - جيد 👌</p>
                  <p>3 - متوسط 👍</p>
                  <p>4 - ضعيف 👎</p>
                  <p className="mt-1">شكراً لمشاركتك!</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTemplatePage;