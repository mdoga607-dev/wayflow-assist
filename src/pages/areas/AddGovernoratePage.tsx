/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/areas/AddGovernoratePage.tsx
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
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  MapPin, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Info,
  TrendingUp,
  Truck,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const AddGovernoratePage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    code: '',
    shipping_fee: '30',
    delivery_days: '2',
    status: 'active'
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإضافة محافظات جديدة",
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
        description: "يرجى إدخال اسم المحافظة",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.name.length < 2) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم المحافظة يجب أن يكون على الأقل حرفين",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.shipping_fee && isNaN(Number(formData.shipping_fee))) {
      toast({
        title: "خطأ في البيانات",
        description: "رسوم الشحن يجب أن تكون رقماً",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.delivery_days && isNaN(Number(formData.delivery_days))) {
      toast({
        title: "خطأ في البيانات",
        description: "أيام التوصيل يجب أن تكون رقماً",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // معالجة الإرسال
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('governorates')
        .insert([{
          name: formData.name.trim(),
          name_en: formData.name_en.trim() || null,
          code: formData.code.trim().toUpperCase() || null,
          shipping_fee: Number(formData.shipping_fee),
          delivery_days: Number(formData.delivery_days),
          status: formData.status,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة محافظة "${formData.name}" بنجاح إلى النظام`
      });
      
      // الانتقال إلى صفحة المحافظات بعد ثانيتين
      setTimeout(() => {
        navigate('/app/areas/governorates');
      }, 2000);
    } catch (error: any) {
      console.error('Error adding governorate:', error);
      
      if (error.code === '23505') {
        toast({
          title: "المحافظة موجودة مسبقاً",
          description: "توجد محافظة بنفس الاسم أو الكود. يرجى اختيار اسم أو كود فريد.",
          variant: "destructive"
        });
      } else if (error.code === '23503') {
        toast({
          title: "خطأ في البيانات",
          description: "البيانات المرتبطة غير موجودة. يرجى التحقق من صحة البيانات.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل الإضافة",
          description: error.message || "حدث خطأ أثناء إضافة المحافظة. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
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
            <MapPin className="h-6 w-6 text-blue-600" />
            إضافة محافظة جديدة
          </h1>
          <p className="text-gray-600 mt-1">
            أدخل بيانات المحافظة الجديدة لإضافتها إلى نظام التغطية الجغرافية
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/areas/governorates')}
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
              <p className="font-medium">ملاحظات هامة قبل الإضافة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>تأكد من صحة اسم المحافظة باللغة العربية (مثال: القاهرة، الجيزة)</li>
                <li>الكود يجب أن يكون فريداً ومكوناً من 3 أحرف إنجليزية (مثال: CAI للقاهرة)</li>
                <li>رسوم الشحن وأيام التوصيل سيتم تطبيقها على جميع المناطق التابعة لهذه المحافظة</li>
                <li>يمكنك تعديل أي معلومة لاحقاً من صفحة تعديل المحافظة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نموذج الإضافة */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-700" />
              بيانات المحافظة
            </CardTitle>
            <CardDescription>
              أدخل تفاصيل المحافظة التي تريد إضافتها إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اسم المحافظة والكود */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-800 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    اسم المحافظة <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: القاهرة، الجيزة، الإسكندرية"
                    required
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    الاسم الرسمي للمحافظة كما هو معروف في مصر
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name_en" className="text-gray-800">
                    الاسم بالإنجليزي (اختياري)
                  </Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="مثال: Cairo, Giza, Alexandria"
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    يُستخدم للنظام الداخلي وللتقارير الدولية
                  </p>
                </div>
              </div>

              {/* الكود ورسوم الشحن */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-gray-800 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                    كود المحافظة
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="مثال: CAI, GIZ, ALE"
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    كود فريد مكون من 3-5 أحرف إنجليزية (سيتم تحويله لأحرف كبيرة تلقائياً)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shipping_fee" className="text-gray-800 flex items-center gap-1">
                    <Truck className="h-4 w-4 text-gray-600" />
                    رسوم الشحن (ج.م) <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="shipping_fee"
                    type="number"
                    value={formData.shipping_fee}
                    onChange={(e) => setFormData({ ...formData, shipping_fee: e.target.value })}
                    placeholder="مثال: 30"
                    required
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    رسوم الشحن القياسية لهذه المحافظة
                  </p>
                </div>
              </div>

              {/* أيام التوصيل والحالة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="delivery_days" className="text-gray-800 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-600" />
                    أيام التوصيل <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="delivery_days"
                    type="number"
                    value={formData.delivery_days}
                    onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })}
                    placeholder="مثال: 2"
                    required
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    min="1"
                    max="7"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    متوسط أيام التوصيل للشحنات في هذه المحافظة
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-800">
                    الحالة
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          نشط
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          غير نشط
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    المحافظات غير النشطة لن تظهر في قوائم التعيين التلقائي
                  </p>
                </div>
              </div>

              {/* أزرار الإرسال */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/app/areas/governorates')}
                  disabled={loading}
                  className="border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      إضافة المحافظة
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* معلومات إرشادية */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-700" />
              معلومات إرشادية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2 text-blue-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">محافظات التغطية الحالية:</p>
                  <ul className="text-xs mt-1 space-y-0.5 pr-4 list-disc">
                    <li>القاهرة (الكود: CAI)</li>
                    <li>القليوبية (الكود: QAL)</li>
                    <li>المنوفية (الكود: MON)</li>
                    <li>الجيزة (الكود: GIZ)</li>
                    <li>الإسكندرية (الكود: ALE)</li>
                  </ul>
                  <p className="text-xs mt-2">
                    <span className="font-medium">ملاحظة:</span> يمكنك إضافة محافظات أخرى حسب احتياجاتك
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm font-medium">متوسط رسوم الشحن</span>
                </div>
                <span className="text-sm font-bold text-green-900">25-40 ج.م</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-800">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">متوسط أيام التوصيل</span>
                </div>
                <span className="text-sm font-bold text-purple-900">1-3 أيام</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">التغطية الجغرافية</span>
                </div>
                <span className="text-sm font-bold text-yellow-900">100%</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-xs text-gray-700 font-medium mb-2">نصائح هامة:</p>
              <ul className="text-xs text-gray-600 space-y-1 pr-3">
                <li>• استخدم أسماء المحافظات الرسمية كما هي معروفة في مصر</li>
                <li>• اختر كوداً فريداً لا يتكرر مع محافظات أخرى</li>
                <li>• حدد رسوم شحن مناسبة لحجم المحافظة والمسافة</li>
                <li>• راجع البيانات جيداً قبل الحفظ لتجنب الأخطاء</li>
              </ul>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2 text-red-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  <span className="font-medium">تنبيه:</span> البيانات التي تدخلها ستؤثر على جميع المناطق التابعة لهذه المحافظة. تأكد من صحتها قبل الحفظ.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* خطوات بعد الإضافة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Info className="h-5 w-5 text-gray-700" />
            الخطوات التالية بعد الإضافة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">مراجعة المحافظة</p>
              <p className="text-sm text-gray-600 mt-1">
                ستظهر المحافظة الجديدة في قائمة المحافظات بحالة "نشط"
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">إضافة المناطق</p>
              <p className="text-sm text-gray-600 mt-1">
                قم بإضافة المناطق (مدن ومراكز) التابعة لهذه المحافظة من صفحة "إدارة المناطق"
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">تعيين المناديب</p>
              <p className="text-sm text-gray-600 mt-1">
                قم بتعيين المناديب للمناطق الجديدة لضمان تغطية كاملة
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">اختبار النظام</p>
              <p className="text-sm text-gray-600 mt-1">
                قم بإنشاء شحنة تجريبية للتأكد من أن المحافظة والمناطق تعمل بشكل صحيح
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddGovernoratePage;