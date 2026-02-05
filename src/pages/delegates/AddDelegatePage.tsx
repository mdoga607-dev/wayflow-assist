// src/pages/delegates/AddDelegatePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  User, Phone, MapPin, Building2, CheckCircle, AlertCircle, Loader2, 
  XCircle, Info, Truck, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ✅ التصحيح: إزالة courier_limit من السكيما لأن العمود غير موجود في قاعدة البيانات
const formSchema = z.object({
  name: z.string().min(2, 'اسم المندوب مطلوب').max(100, 'الاسم طويل جداً'),
  phone: z.string()
    .regex(/^01[0125][0-9]{8}$/, 'رقم التليفون مش صح (مثال: 01012345678)'),
  city: z.string().min(2, 'المحافظة مطلوبة').max(50, 'المحافظة طويلة جداً'),
  branch: z.string().optional(),
  status: z.string().default('active'),
});

type FormData = z.infer<typeof formSchema>;

const AddDelegatePage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities] = useState([
    "القاهرة", "الجيزة", "الإسكندرية", "السويس", "المنصورة", "شبين الكوم", 
    "طنطا", "الإسماعيلية", "بورسعيد", "دمياط", "الزقازيق", "بنها", 
    "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "الفيوم", "بني سويف"
  ]);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ماعندكش الصلاحية تضيف مناديب",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      city: '',
      branch: '',
      status: 'active',
    }
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);

    try {
      // ✅ التصحيح الجذري: إدخال البيانات بدون الأعمدة غير الموجودة (courier_limit, store_id)
      const { error: insertError } = await supabase
        .from('delegates')
        .insert([{
          name: data.name.trim(),
          phone: data.phone.trim(),
          city: data.city.trim(),
          branch: data.branch?.trim() || null,
          status: data.status,
          total_delivered: 0,
          total_delayed: 0,
          total_returned: 0,
          balance: 0,
          commission_due: 0,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        
        // معالجة أخطاء محددة
        if (insertError.message.includes('duplicate key')) {
          throw new Error('رقم التليفون ده موجود قبل كده في النظام');
        }
        if (insertError.message.includes('violates not-null constraint')) {
          throw new Error('فيه حقول مطلوبة ناقصة. راجع البيانات المدخلة');
        }
        throw insertError;
      }

      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة مندوب "${data.name}" بنجاح`,
      });

      // الانتقال بعد 1.5 ثانية
      setTimeout(() => {
        navigate('/app/delegates');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'فشل إضافة المندوب. راجع البيانات وحاول تاني';
      
      setError(errorMessage);
      console.error('Error adding delegate:', err);
      
      toast({
        title: "فشل الإضافة",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // حالة التحميل
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-8 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-gray-900">
            <User className="h-8 w-8 text-primary" />
            إضافة مندوب جديد
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            أدخل معلومات المندوب الجديد عشان تضيفه للنظام
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/delegates')}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          إلغاء
        </Button>
      </div>

      {/* تنبيهات هامة */}
      <Alert className="bg-blue-50/70 border-blue-200">
        <AlertTitle className="flex items-center gap-2 text-blue-800 font-bold">
          <Info className="h-4 w-4 flex-shrink-0" />
          ملاحظات هامة قبل الإضافة
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-1.5 text-blue-700 text-sm">
          <p className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>تأكد من صحة رقم التليفون (يبدأ بـ 010، 011، 012، أو 015 ويتكون من 11 رقم)</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>المندوب الجديد هيكون "نشط" افتراضياً وهيبدأ يستقبل شحنات فوراً</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>ممكن تعديل أي بيانات للمندوب بعد كده من صفحة تعديل المندوب</span>
          </p>
        </AlertDescription>
      </Alert>

      {/* نموذج الإضافة */}
      <Card className="shadow-xl border-primary/20 overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-blue-50/70">
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2.5">
            <User className="h-6 w-6" />
            معلومات المندوب الأساسية
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 mt-1">
            ملّي كل الحقول المطلوبة بدقة. الحقول المميزة بـ * إجبارية
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* الصف الأول: الاسم ورقم التليفون */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-800 font-medium">
                        <User className="h-4 w-4 text-primary flex-shrink-0" />
                        اسم المندوب <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: أحمد محمد سعيد"
                          {...field}
                          dir="rtl"
                          disabled={submitting}
                          className={cn(
                            "text-right bg-background",
                            field.value && "border-green-500/30 bg-green-50/30"
                          )}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-600 mt-1">
                        الاسم الكامل زي ما هيظهر في النظام والتقارير
                      </FormDescription>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-800 font-medium">
                        <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                        رقم التليفون <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="01012345678"
                          {...field}
                          dir="ltr"
                          disabled={submitting}
                          className={cn(
                            "font-mono bg-background",
                            field.value && "border-green-500/30 bg-green-50/30"
                          )}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-600 mt-1">
                        مثال: 01012345678 (رقم مصري صحيح)
                      </FormDescription>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />
              </div>

              {/* الصف الثاني: المحافظة والفرع */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-800 font-medium">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        المحافظة <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger 
                            className={cn(
                              "bg-background",
                              field.value && "border-green-500/30 bg-green-50/30"
                            )}
                          >
                            <SelectValue placeholder="اختر المحافظة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">اختر المحافظة</SelectItem>
                          {cities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-gray-600 mt-1">
                        المحافظة اللي المندوب بيستقبل فيها شحنات
                      </FormDescription>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-800 font-medium">
                        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                        الفرع
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: فرع المعادي"
                          {...field}
                          dir="rtl"
                          disabled={submitting}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-600 mt-1">
                        الفرع التابع ليه المندوب (اختياري)
                      </FormDescription>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />
              </div>

              {/* الصف الثالث: الحالة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-medium">حالة المندوب</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="اختر حالة المندوب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">نشط (بيستقبل شحنات)</SelectItem>
                          <SelectItem value="inactive">مش نشط (مش بيستقبل شحنات)</SelectItem>
                          <SelectItem value="on_leave">فى إجازة (مؤقت)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-gray-600 mt-1">
                        الحالة دي هتأثر على استقبال المندوب للشحنات الجديدة
                      </FormDescription>
                      <FormMessage className="text-xs font-medium" />
                    </FormItem>
                  )}
                />
              </div>

              {/* رسالة خطأ عامة */}
              {error && (
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <AlertTitle className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      خطأ في الإضافة
                    </AlertTitle>
                    <AlertDescription className="mt-1">{error}</AlertDescription>
                  </div>
                </Alert>
              )}

              {/* أزرار الإرسال */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-border mt-2">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50/70 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>كل الحقول المميزة بـ <span className="text-destructive">*</span> إجبارية</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/app/delegates')}
                    disabled={submitting}
                    className="w-full sm:w-auto gap-2 h-11"
                  >
                    <XCircle className="h-4 w-4" />
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full sm:w-auto gap-2.5 h-11 bg-primary hover:bg-primary/90 text-white text-base px-8"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري الإضافة...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        إضافة المندوب
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ملاحظة أخيرة */}
      <Alert className="bg-gradient-to-r from-green-50 to-emerald-50/30 border-green-200">
        <AlertTitle className="font-bold text-green-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          بعد الإضافة
        </AlertTitle>
        <AlertDescription className="mt-1.5 text-green-700">
          هيتم تحويلك تلقائياً لقائمة المناديب بعد الإضافة الناجحة. 
          المندوب الجديد هيظهر في القائمة ويمكنك تعديل بياناته أو تعيين شحنات ليه فوراً.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AddDelegatePage;