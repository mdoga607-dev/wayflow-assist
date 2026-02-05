/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/delegates/AddDelegatePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Phone,
  MapPin,
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  XCircle,
  Info,
  Truck,
  AlertTriangle,
  Edit3,
  Save,
  RefreshCcw,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────
//                  Schema التحقق (Zod)
// ────────────────────────────────────────────────
const phoneRegex = /^01[0125][0-9]{8}$/;

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'اسم المندوب مطلوب (حد أدنى حرفين)' })
    .max(100, { message: 'الاسم طويل جدًا (الحد الأقصى 100 حرف)' })
    .trim(),
  phone: z
    .string()
    .regex(phoneRegex, { message: 'رقم التليفون غير صحيح (مثال: 01012345678)' })
    .trim(),
  city: z
    .string()
    .min(2, { message: 'المحافظة مطلوبة' })
    .max(50, { message: 'اسم المحافظة طويل جدًا' })
    .trim(),
  branch: z.string().max(100).optional().nullable(),
  status: z.enum(['active', 'inactive', 'on_leave'], {
    required_error: 'يرجى اختيار حالة المندوب',
  }),
});

type FormData = z.infer<typeof formSchema>;

// ────────────────────────────────────────────────
//              قائمة المحافظات المصرية
// ────────────────────────────────────────────────
const egyptianGovernorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'الغربية', 'المنوفية',
  'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'جنوب سيناء',
  'شمال سيناء', 'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'الفيوم', 'بني سويف',
  'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
] as const;

// ────────────────────────────────────────────────
//                 الصفحة الرئيسية
// ────────────────────────────────────────────────
const AddDelegatePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { role, loading: authLoading } = useAuth() ?? { role: null, loading: true };

  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingDelegate, setLoadingDelegate] = useState(!!id);
  const [isEditMode, setIsEditMode] = useState(!!id);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      city: '',
      branch: '',
      status: 'active',
    },
    mode: 'onChange',
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (authLoading) return;

    if (!role || !['head_manager', 'manager'].includes(role as string)) {
      toast({
        title: 'غير مصرح',
        description: 'ليس لديك صلاحية إضافة أو تعديل المناديب',
        variant: 'destructive',
      });
      navigate('/unauthorized', { replace: true });
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات المندوب في حالة التعديل
  useEffect(() => {
    if (!id || authLoading) return;

    const loadDelegate = async () => {
      try {
        setLoadingDelegate(true);
        setPageError(null);

        const { data, error } = await supabase
          .from('delegates')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('المندوب غير موجود');

        form.reset({
          name: data.name || '',
          phone: data.phone || '',
          city: data.city || '',
          branch: data.branch || '',
          status: data.status || 'active',
        });
      } catch (err: any) {
        const msg = err.message || 'فشل تحميل بيانات المندوب';
        setPageError(msg);
        toast({ title: 'فشل التحميل', description: msg, variant: 'destructive' });
        setTimeout(() => navigate('/app/delegates'), 2500);
      } finally {
        setLoadingDelegate(false);
      }
    };

    loadDelegate();
  }, [id, authLoading, form, navigate]);

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    setPageError(null);

    try {
      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        city: values.city.trim(),
        branch: values.branch?.trim() || null,
        status: values.status,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (isEditMode && id) {
        result = await supabase.from('delegates').update(payload).eq('id', id);
      } else {
        result = await supabase.from('delegates').insert([
          {
            ...payload,
            total_delivered: 0,
            total_delayed: 0,
            total_returned: 0,
            balance: 0,
            commission_due: 0,
            avatar_url: null,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      if (result.error) {
        if (result.error.message.includes('duplicate key')) {
          throw new Error('رقم التليفون موجود مسبقاً. يرجى استخدام رقم آخر.');
        }
        throw result.error;
      }

      toast({
        title: isEditMode ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح',
        description: isEditMode
          ? `تم تحديث بيانات ${values.name}`
          : `تم إضافة المندوب ${values.name} بنجاح`,
        variant: 'default',
      });

      setTimeout(() => navigate('/app/delegates'), 1800);
    } catch (err: any) {
      const msg =
        err.message ||
        (isEditMode ? 'فشل تحديث بيانات المندوب' : 'فشل إضافة المندوب');
      setPageError(msg);
      toast({ title: 'فشل العملية', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────
  //                   حالات التحميل / الخطأ
  // ────────────────────────────────────────────────
  if (authLoading || loadingDelegate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
        <Card className="w-full max-w-md border-primary/20 shadow-xl">
          <CardContent className="pt-12 pb-10 text-center">
            <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              {isEditMode ? 'جاري تحميل بيانات المندوب...' : 'جاري التحقق من الصلاحيات...'}
            </h2>
            <p className="text-muted-foreground">برجاء الانتظار لحظات</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50/30 p-4">
        <Card className="w-full max-w-lg border-destructive/30 shadow-xl">
          <CardHeader className="text-center pb-2">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl text-destructive">حدث خطأ</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <AlertDescription className="text-lg text-muted-foreground">
              {pageError}
            </AlertDescription>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/app/delegates')}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة للقائمة
              </Button>
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  //                     الواجهة الرئيسية
  // ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* شريط الرجوع + العنوان */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/app/delegates')}
              className="rounded-full border-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 flex items-center gap-3">
                {isEditMode ? (
                  <>
                    <Edit3 className="h-9 w-9 text-primary" />
                    تعديل بيانات المندوب
                  </>
                ) : (
                  <>
                    <User className="h-9 w-9 text-primary" />
                    إضافة مندوب جديد
                  </>
                )}
              </h1>
              <p className="text-muted-foreground mt-1.5 text-lg">
                {isEditMode
                  ? 'قم بتعديل المعلومات ثم اضغط حفظ التغييرات'
                  : 'املأ البيانات التالية لإضافة مندوب جديد للنظام'}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            تاريخ اليوم:{' '}
            <span className="font-medium">
              {format(new Date(), 'dd MMMM yyyy', { locale: ar })}
            </span>
          </div>
          
        </div>

        {/* تنبيه هام */}
        <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <AlertTitle className="text-blue-800 font-bold flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            تعليمات هامة قبل البدء
          </AlertTitle>
          <AlertDescription className="mt-3 text-blue-700 space-y-2 text-[15px]">
            <div className="flex items-start gap-2">
              <span className="font-bold mt-1">•</span>
              <span>
                تأكد من كتابة رقم التليفون بشكل صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold mt-1">•</span>
              <span>
                {isEditMode
                  ? 'أي تغيير في الحالة أو الرقم سيؤثر فوراً على استقبال الشحنات'
                  : 'المندوب الجديد سيظهر "نشط" تلقائياً ويمكنه استقبال الشحنات مباشرة'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold mt-1">•</span>
              <span>يمكنك تعديل أو حذف المندوب لاحقاً من صفحة التفاصيل</span>
            </div>
          </AlertDescription>
        </Alert>

        {/* النموذج الرئيسي */}
        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-blue-50/70 to-indigo-50/50 pb-6">
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-3">
              {isEditMode ? <Edit3 className="h-7 w-7" /> : <User className="h-7 w-7" />}
              {isEditMode ? 'تعديل بيانات المندوب' : 'إضافة مندوب جديد'}
            </CardTitle>
            <CardDescription className="text-base mt-2 text-gray-700">
              {isEditMode
                ? 'قم بتعديل الحقول المطلوبة ثم اضغط "حفظ التعديلات"'
                : 'املأ جميع الحقول المميزة بعلامة * بدقة'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 pb-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* الصف الأول: الاسم + التليفون */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          الاسم الكامل <span className="text-red-600 text-lg">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="محمد أحمد علي"
                            className={cn(
                              'h-12 text-lg text-right transition-all',
                              field.value && 'border-green-400 focus:border-green-500 bg-green-50/30'
                            )}
                            disabled={submitting}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-gray-500">
                          الاسم الذي سيظهر في النظام والتقارير
                        </FormDescription>
                        <FormMessage className="text-sm font-medium" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Phone className="h-5 w-5 text-primary" />
                          رقم الجوال <span className="text-red-600 text-lg">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="01012345678"
                            dir="ltr"
                            className={cn(
                              'h-12 text-lg font-mono transition-all',
                              field.value && 'border-green-400 focus:border-green-500 bg-green-50/30'
                            )}
                            disabled={submitting}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-gray-500">
                          رقم مصري صحيح مكون من 11 رقم
                        </FormDescription>
                        <FormMessage className="text-sm font-medium" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* الصف الثاني: المحافظة + الفرع */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          المحافظة <span className="text-red-600 text-lg">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={submitting}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="اختر المحافظة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[320px]">
                            {egyptianGovernorates.map((gov) => (
                              <SelectItem
                                key={gov}
                                value={gov}
                                className="text-base py-3 cursor-pointer"
                              >
                                {gov}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-sm text-gray-500">
                          المحافظة التي يعمل بها المندوب بشكل أساسي
                        </FormDescription>
                        <FormMessage className="text-sm font-medium" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          الفرع / المركز
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="مثال: فرع المنصورة - الجامعة"
                            className="h-12 text-base transition-all"
                            disabled={submitting}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-gray-500">
                          الفرع التابع له المندوب (اختياري)
                        </FormDescription>
                        <FormMessage className="text-sm font-medium" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* حالة المندوب */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        حالة المندوب
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={submitting}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="اختر حالة المندوب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active" className="py-3">
                            <div className="flex items-center gap-3 text-base">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              نشط – يستقبل شحنات جديدة
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive" className="py-3">
                            <div className="flex items-center gap-3 text-base">
                              <XCircle className="h-5 w-5 text-gray-600" />
                              غير نشط – لا يستقبل شحنات حالياً
                            </div>
                          </SelectItem>
                          <SelectItem value="on_leave" className="py-3">
                            <div className="flex items-center gap-3 text-base">
                              <AlertCircle className="h-5 w-5 text-blue-600" />
                              في إجازة مؤقتة
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-sm text-gray-500">
                        الحالة تتحكم في إمكانية استقبال المندوب للشحنات الجديدة
                      </FormDescription>
                      <FormMessage className="text-sm font-medium" />
                    </FormItem>
                  )}
                />

                {/* رسالة خطأ عامة */}
                {pageError && (
                  <Alert variant="destructive" className="mt-6 border-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-bold">خطأ</AlertTitle>
                    <AlertDescription className="text-base mt-1">{pageError}</AlertDescription>
                  </Alert>
                )}

                {/* أزرار التحكم */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pt-8 border-t">
                  <div className="text-sm text-amber-700 bg-amber-50 px-5 py-3 rounded-xl border border-amber-200 w-full sm:w-auto text-center">
                    الحقول المميزة بـ <span className="text-red-600 font-bold">*</span> إجبارية
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={submitting}
                      onClick={() => navigate('/app/delegates')}
                      className="h-14 text-base px-8 gap-2 border-2"
                    >
                      <XCircle className="h-5 w-5" />
                      إلغاء
                    </Button>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="h-14 px-10 text-base font-semibold gap-3 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/90"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {isEditMode ? 'جاري الحفظ...' : 'جاري الإضافة...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          {isEditMode ? 'حفظ التعديلات' : 'إضافة المندوب'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* نصيحة نهائية */}
        <Alert className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <AlertTitle className="text-emerald-800 font-bold flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5" />
            بعد الحفظ
          </AlertTitle>
          <AlertDescription className="mt-2 text-emerald-700 text-[15px]">
            {isEditMode
              ? 'سيتم تحديث بيانات المندوب فوراً وسيتم نقلك إلى قائمة المناديب.'
              : 'سيتم إضافة المندوب الجديد مباشرة وسيظهر في القائمة جاهزاً لاستقبال الشحنات.'}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default AddDelegatePage;