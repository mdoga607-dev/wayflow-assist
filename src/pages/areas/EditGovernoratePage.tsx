/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/areas/EditGovernoratePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  MapPin, Edit, Save, XCircle, RefreshCcw, Loader2, AlertCircle, 
  CheckCircle, Info, ChevronLeft, Truck, Clock, XCircle as XCircleIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Governorate {
  id: string;
  name: string;          // الاسم العربي
  name_en?: string;      // الاسم الإنجليزي
  code?: string;         // كود المحافظة
  shipping_fee: number;  // رسوم الشحن
  delivery_days: number; // أيام التوصيل
  status: 'active' | 'inactive';
  created_at: string;
}

const EditGovernoratePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [governorate, setGovernorate] = useState<Governorate | null>(null);
  const [formData, setFormData] = useState({
    name: '',           // الاسم العربي (مطلوب)
    name_en: '',
    code: '',
    shipping_fee: 30,
    delivery_days: 2,
    status: 'active' as 'active' | 'inactive',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (authLoading) return;

    if (!role || !['head_manager', 'manager'].includes(role)) {
      toast({
        title: 'غير مصرح',
        description: 'ماعندكش الصلاحية تعدل المحافظات',
        variant: 'destructive',
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات المحافظة
  useEffect(() => {
    if (!id || authLoading || !['head_manager', 'manager'].includes(role || '')) return;

    const fetchGovernorate = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);

        console.log('جاري جلب بيانات المحافظة:', id);

        // ✅ الاستعلام الصحيح المتوافق مع هيكل قاعدة البيانات
        const { data, error } = await supabase
          .from('governorates')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          console.log('لم يتم العثور على المحافظة:', error?.message);
          setNotFound(true);
          setError('مفيش محافظة بهذا الرقم. ممكن تكون محذوفة أو الرقم غلط.');
          toast({
            title: 'مفيش محافظة',
            description: 'مفيش محافظة بهذا الرقم. راجع الرقم وحاول تاني.',
            variant: 'destructive',
          });
          return;
        }

        // ✅ تعيين البيانات مع القيم الافتراضية
        setGovernorate(data);
        setFormData({
          name: data.name || '',
          name_en: data.name_en || '',
          code: data.code || '',
          shipping_fee: data.shipping_fee || 30,
          delivery_days: data.delivery_days || 2,
          status: data.status || 'active',
        });

        toast({
          title: 'تم التحميل',
          description: `تم تحميل بيانات محافظة "${data.name}" بنجاح`,
        });
      } catch (err: any) {
        console.error('خطأ في جلب بيانات المحافظة:', err);
        const errorMessage = err.message || 'حصل خطأ أثناء تحميل بيانات المحافظة';
        setError(errorMessage);
        toast({
          title: 'فشل التحميل',
          description: 'حصل خطأ في تحميل بيانات المحافظة. حاول تاني بعد شوية.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGovernorate();
  }, [id, authLoading, role]);

  // معالجة الإرسال
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!id) throw new Error('معرف المحافظة غير موجود');
      if (!formData.name.trim()) throw new Error('اسم المحافظة بالعربي مطلوب');

      // ✅ التحديث الصحيح المتوافق مع هيكل قاعدة البيانات
      const { error } = await supabase
        .from('governorates')
        .update({
          name: formData.name.trim(),
          name_en: formData.name_en.trim() || null,
          code: formData.code.trim().toUpperCase() || null,
          shipping_fee: parseFloat(formData.shipping_fee.toString()) || 30,
          delivery_days: parseInt(formData.delivery_days.toString()) || 2,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('خطأ في التحديث:', error);
        throw error;
      }

      toast({
        title: 'تم التعديل بنجاح',
        description: `تم تعديل محافظة "${formData.name}" بنجاح`,
      });

      // الانتقال بعد 1.5 ثانية
      setTimeout(() => {
        navigate('/app/areas/governorates');
      }, 1500);
    } catch (err: any) {
      console.error('خطأ في تعديل المحافظة:', err);
      const errorMessage = err.message || 'فشل تعديل المحافظة. راجع البيانات وحاول تاني';
      setError(errorMessage);
      toast({
        title: 'فشل التعديل',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // معالجة حالة التحميل
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/20">
        <Card className="w-full max-w-md border-2 border-dashed border-primary/20">
          <CardContent className="pt-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري تحميل بيانات المحافظة...</h2>
            <p className="text-muted-foreground">برجاء الانتظار</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // معالجة حالة "مفيش محافظة"
  if (notFound || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-amber-800 mb-3 flex items-center justify-center gap-2">
              <MapPin className="h-6 w-6" />
              {notFound ? 'مفيش محافظة' : 'حصل خطأ'}
            </CardTitle>
            <CardDescription className="text-lg text-amber-700 font-medium">
              {error || 'المعرف المطلوب غير صحيح'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800">
                {notFound 
                  ? 'المحافظة دي محذوفة أو الرقم غلط. راجع الرقم وحاول تاني.' 
                  : 'حصل خطأ غير متوقع. حاول تاني بعد شوية.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate('/app/areas/governorates')}
                className="gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 text-base"
              >
                <ChevronLeft className="h-4 w-4" />
                رجوع لقائمة المحافظات
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-3 text-base"
              >
                <RefreshCcw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            </div>
            <div className="pt-4 border-t border-amber-200">
              <p className="text-sm text-amber-700">
                <span className="font-medium">تلميح:</span> لو الرقم صحيح والمحافظة موجودة، 
                ممكن يكون في مشكلة في الاتصال. تأكد من اتصالك بالإنترنت.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // التأكد من وجود بيانات المحافظة قبل العرض
  if (!governorate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">بيانات غير متوفرة</h2>
            <p className="text-gray-500 mb-6">مفيش بيانات متاحة دلوقتي. حاول تاني بعد شوية.</p>
            <Button onClick={() => navigate('/app/areas/governorates')} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              رجوع للمناطق
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 py-6 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* شريط التنقل العلوي */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/app/areas/governorates')}
            className="gap-2 text-gray-700 hover:bg-primary/5 hover:text-primary font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            رجوع للقائمة
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-px h-8 bg-border hidden sm:block"></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-gray-900">
                <Edit className="h-8 w-8 text-primary" />
                تعديل محافظة "{governorate.name}"
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                عدل معلومات المحافظة والبيانات المرتبطة بيها
              </p>
            </div>
          </div>
        </div>

        {/* ملاحظات هامة */}
        <Alert className="bg-blue-50/70 border-blue-200 mb-8">
          <AlertTitle className="flex items-center gap-2 text-blue-800 font-bold">
            <Info className="h-4 w-4 flex-shrink-0" />
            ملاحظات هامة قبل التعديل
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-1.5 text-blue-700 text-sm">
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>اسم المحافظة بالعربي مطلوب (مثال: القاهرة، الجيزة)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>كود المحافظة اختياري ويجب أن يكون 3 أحرف إنجليزية كبيرة (مثال: CAI)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>التعديلات هتتعمّل فوراً وهيتأثر على جميع المناطق التابعة لهذه المحافظة</span>
            </p>
          </AlertDescription>
        </Alert>

        {/* نموذج التعديل */}
        <Card className="shadow-xl border-primary/20 overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-blue-50/70">
            <CardTitle className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2.5">
              <MapPin className="h-6 w-6" />
              معلومات المحافظة
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              عدل البيانات المطلوبة واضغط "حفظ التعديلات" في الآخر
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* الصف الأول: الاسم العربي والإنجليزي */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 font-medium">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    اسم المحافظة (عربي) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: القاهرة"
                    dir="rtl"
                    disabled={submitting}
                    required
                    className={cn(
                      "text-right bg-background border-2 focus:border-primary/50 transition-colors",
                      formData.name && "border-green-500/30 bg-green-50/30 focus:border-green-500/50"
                    )}
                  />
                  <p className="text-xs text-gray-600 mt-1">الاسم الرسمي للمحافظة باللغة العربية</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 font-medium">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    اسم المحافظة (إنجليزي)
                  </Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="مثال: Cairo"
                    dir="ltr"
                    disabled={submitting}
                    className="bg-background border-2 focus:border-primary/50 transition-colors font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-1">الاسم بالإنجليزي (اختياري)</p>
                </div>
              </div>

              {/* الصف الثاني: الكود ورسوم الشحن */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 font-medium">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    كود المحافظة
                  </Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="مثال: CAI"
                    dir="ltr"
                    disabled={submitting}
                    className="bg-background border-2 focus:border-primary/50 transition-colors uppercase font-mono"
                    maxLength={3}
                  />
                  <p className="text-xs text-gray-600 mt-1">3 أحرف إنجليزية كبيرة (اختياري)</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 font-medium">
                    <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                    رسوم الشحن (ج.م)
                  </Label>
                  <Input
                    type="number"
                    value={formData.shipping_fee}
                    onChange={(e) => setFormData({ ...formData, shipping_fee: parseFloat(e.target.value) || 0 })}
                    placeholder="مثال: 30"
                    disabled={submitting}
                    className="bg-background border-2 focus:border-primary/50 transition-colors font-mono"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-600 mt-1">رسوم التوصيل لهذه المحافظة</p>
                </div>
              </div>

              {/* الصف الثالث: أيام التوصيل والحالة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-800 font-medium">
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                    أيام التوصيل
                  </Label>
                  <Input
                    type="number"
                    value={formData.delivery_days}
                    onChange={(e) => setFormData({ ...formData, delivery_days: parseInt(e.target.value) || 0 })}
                    placeholder="مثال: 2"
                    disabled={submitting}
                    className="bg-background border-2 focus:border-primary/50 transition-colors font-mono"
                    min="1"
                    max="7"
                  />
                  <p className="text-xs text-gray-600 mt-1">متوسط أيام التوصيل لهذه المحافظة</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-800 font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    حالة المحافظة
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
                    disabled={submitting}
                  >
                    <SelectTrigger className="bg-background border-2 focus:border-primary/50 transition-colors">
                      <SelectValue placeholder="اختر حالة المحافظة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="cursor-pointer hover:bg-green-50">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>نشطة (متاحة للشحنات)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive" className="cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-gray-600" />
                          <span>غير نشطة (مش متاحة للشحنات)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">
                    الحالة دي هتأثر على إمكانية تعيين شحنات لهذه المحافظة
                  </p>
                </div>
              </div>

              {/* رسالة خطأ عامة */}
              {error && !notFound && (
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <AlertTitle className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      خطأ في التعديل
                    </AlertTitle>
                    <AlertDescription className="mt-1 text-sm">{error}</AlertDescription>
                  </div>
                </Alert>
              )}

              {/* أزرار الإرسال */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border mt-2">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50/70 px-4 py-3 rounded-lg border border-amber-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>الحقل المميز بـ <span className="text-destructive">*</span> إجباري</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/app/areas/governorates')}
                    disabled={submitting}
                    className="w-full sm:w-auto gap-2 h-11 text-base px-6"
                  >
                    <XCircle className="h-4 w-4" />
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || !formData.name.trim()}
                    className="w-full sm:w-auto gap-2.5 h-11 bg-primary hover:bg-primary/90 text-white text-base px-8 shadow-md hover:shadow-lg transition-shadow"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        حفظ التعديلات
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ملاحظة أخيرة */}
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50/30 border-green-200 mt-8">
          <AlertTitle className="font-bold text-green-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            بعد الحفظ
          </AlertTitle>
          <AlertDescription className="mt-1.5 text-green-700">
            هيتم تحديث بيانات المحافظة فوراً وهيتم تحويلك لقائمة المحافظات. 
            جميع المناطق التابعة لهذه المحافظة هتتأثر بالتعديلات الجديدة.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default EditGovernoratePage;