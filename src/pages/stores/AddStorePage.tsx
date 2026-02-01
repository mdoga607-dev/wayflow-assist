// src/pages/stores/AddStorePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Store, MapPin, Phone, Building2, CheckCircle, AlertCircle, Loader2, 
  Calendar, Clock, XCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// Schema للتحقق من صحة البيانات
const formSchema = z.object({
  name: z.string().min(2, 'اسم الفرع مطلوب').max(100, 'الاسم طويل جداً'),
  address: z.string().min(5, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  city: z.string().min(2, 'المدينة مطلوبة').max(50, 'المدينة طويلة جداً'),
  phone: z.string()
    .regex(/^01[0-9]{9}$/, 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)'),
  branch: z.string().optional(),
  is_casual: z.boolean().default(false),
  central_branch: z.boolean().default(false),
  status: z.string().default('active'),
  operating_days: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

const AddStorePage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // إعداد النموذج
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      phone: '',
      branch: '',
      is_casual: false,
      central_branch: false,
      status: 'active',
      operating_days: [],
    }
  });

  // معالجة الإرسال
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);

    try {
      // تحويل أيام العمل إلى JSON
      const operatingDays = data.operating_days || ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
      
      const { error: insertError } = await supabase
        .from('stores')
        .insert([{
          name: data.name.trim(),
          address: data.address.trim(),
          city: data.city.trim(),
          phone: data.phone.trim(),
          branch: data.branch?.trim() || null,
          is_casual: data.is_casual,
          central_branch: data.central_branch,
          status: data.status,
          operating_days: operatingDays,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة فرع "${data.name}" بنجاح`,
      });

      // إعادة التوجيه بعد 1.5 ثانية
      setTimeout(() => {
        navigate('/app/stores');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل إضافة الفرع. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
      console.error('Error adding store:', err);
      
      toast({
        title: "فشل الإضافة",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            إضافة فرع جديد
          </h1>
          <p className="text-muted-foreground mt-1">
            أدخل معلومات الفرع الجديد لإضافته إلى النظام
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/stores')}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          إلغاء وإغلاق
        </Button>
      </div>

      {/* تنبيهات هامة */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="flex items-center gap-2 text-blue-800">
          <Info className="h-4 w-4" />
          ملاحظات هامة قبل الإضافة
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-1 text-blue-700 text-sm">
          <p>• تأكد من صحة رقم الهاتف (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)</p>
          <p>• الفرع المركزي سيكون مسؤولاً عن إدارة الفروع الأخرى</p>
          <p>• يمكن تغيير حالة الفرع لاحقاً من صفحة تعديل الفرع</p>
        </AlertDescription>
      </Alert>

      {/* نموذج الإضافة */}
      <Card className="shadow-xl border-primary/20">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-blue-50">
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            معلومات الفرع الأساسية
          </CardTitle>
          <CardDescription>
            يرجى ملء جميع الحقول المطلوبة بدقة لضمان إضافة صحيحة
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* اسم الفرع والمدينة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        اسم الفرع <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: فرع القاهرة - المعادي"
                          {...field}
                          dir="rtl"
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormDescription>
                        الاسم الكامل للفـرع كما سيظهر في النظام
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        المدينة <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: القاهرة، جدة، الدمام"
                          {...field}
                          dir="rtl"
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormDescription>
                        المدينة التي يتواجد فيها الفرع
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* العنوان ورقم الهاتف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        العنوان الكامل <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل العنوان الكامل مع تفاصيل المنطقة"
                          {...field}
                          dir="rtl"
                          disabled={submitting}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        العنوان التفصيلي للفـرع (شارع، مبنى، دور، إلخ)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        رقم الهاتف <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="01XXXXXXXXX"
                          {...field}
                          dir="ltr"
                          disabled={submitting}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription dir="rtl">
                        يجب أن يبدأ بـ 01 ويتكون من 11 رقم (مثال: 01012345678)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* الفرع والخيارات الإضافية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        اسم المنطقة/الحي
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: المعادي، حي السفارات"
                          {...field}
                          dir="rtl"
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormDescription>
                        المنطقة أو الحي الذي يتواجد فيه الفرع
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>خيارات الفرع</FormLabel>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                    <FormField
                      control={form.control}
                      name="central_branch"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-reverse space-x-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={submitting}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                فرع مركزي
                              </div>
                            </FormLabel>
                            <FormDescription className="text-xs">
                              هذا الفرع سيكون مسؤولاً عن إدارة الفروع الأخرى
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_casual"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-reverse space-x-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={submitting}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                فرع مؤقت/موسمي
                              </div>
                            </FormLabel>
                            <FormDescription className="text-xs">
                              يُستخدم للفروع المؤقتة أو الموسمية (مثل مواسم التخفيضات)
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>حالة الفرع</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={submitting}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر حالة الفرع" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">نشط</SelectItem>
                              <SelectItem value="inactive">غير نشط</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            حالة الفرع في النظام (نشط/غير نشط)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* رسالة الخطأ */}
              {error && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>خطأ في الإضافة</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* أزرار الإرسال */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>جميع الحقول المميزة بـ * مطلوبة</span>
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/app/stores')}
                    disabled={submitting}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري الإضافة...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        إضافة الفرع
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* دليل سريع */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-primary" />
            دليل إدخال البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-medium">اسم الفرع</p>
              <p className="text-sm text-muted-foreground">استخدم اسم واضح يميز الفرع (مثال: فرع القاهرة - المعادي)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-medium">رقم الهاتف</p>
              <p className="text-sm text-muted-foreground">يجب أن يبدأ بـ 01 ويتكون من 11 رقم بدون مسافات أو شرطات</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">3</div>
            <div>
              <p className="font-medium">الفرع المركزي</p>
              <p className="text-sm text-muted-foreground">اختر هذا الخيار فقط للفـرع الرئيسي الذي سيدير الفروع الأخرى</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">4</div>
            <div>
              <p className="font-medium">الفرع المؤقت</p>
              <p className="text-sm text-muted-foreground">اختر هذا الخيار للفروع الموسمية أو المؤقتة التي سيتم إغلاقها لاحقاً</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// أيقونات مخصصة
const Info = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="8" />
  </svg>
);

const Star = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const HelpCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default AddStorePage;