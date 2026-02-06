/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/shippers/AddEditShipperPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, Phone, Mail, MapPin, Building2, CheckCircle, AlertCircle, Loader2, 
  XCircle, Info, Store, Save, RefreshCcw, Edit3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Schema موحد للإضافة والتعديل
const formSchema = z.object({
  name: z.string().min(2, 'اسم التاجر مطلوب').max(100, 'الاسم طويل جداً'),
  phone: z.string()
    .regex(/^01[0125][0-9]{8}$/, 'رقم التليفون مش صح (مثال: 01012345678)'),
  email: z.string().email('البريد الإلكتروني مش صح').optional().or(z.literal('')),
  address: z.string().min(5, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  city: z.string().min(2, 'المدينة مطلوبة').max(50, 'المدينة طويلة جداً'),
  branch: z.string().optional(),
  status: z.string().default('active'),
});

type FormData = z.infer<typeof formSchema>;

const AddEditShipperPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { role, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingShipper, setLoadingShipper] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [shipperData, setShipperData] = useState<any>(null);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ماعندكش الصلاحية تضيف أو تعدّل تجار",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات التاجر في حالة التعديل
  useEffect(() => {
    if (id && !authLoading) {
      setIsEditMode(true);
      fetchShipperData(id);
    } else {
      setIsEditMode(false);
    }
  }, [id, authLoading]);

  const fetchShipperData = async (shipperId: string) => {
    try {
      setLoadingShipper(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('shippers')
        .select('*')
        .eq('id', shipperId)
        .single();

      if (error) throw error;
      
      setShipperData(data);
      
      // ملء النموذج ببيانات التاجر
      form.reset({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        branch: data.branch || '',
        status: data.status || 'active',
      });
      
      toast({
        title: "تم التحميل",
        description: "تم تحميل بيانات التاجر بنجاح",
      });
    } catch (err) {
      console.error('Error fetching shipper:', err);
      const errorMessage = err instanceof Error ? err.message : 'فشل تحميل بيانات التاجر';
      setError(errorMessage);
      toast({
        title: "فشل التحميل",
        description: "مفيش تاجر بهذا الرقم أو حصل خطأ في التحميل",
        variant: "destructive"
      });
      navigate('/app/shippers');
    } finally {
      setLoadingShipper(false);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      branch: '',
      status: 'active',
    }
  });

  // دالة الإرسال (إضافة أو تعديل)
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const shipperPayload = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        address: data.address.trim(),
        city: data.city.trim(),
        branch: data.branch?.trim() || null,
        status: data.status,
        updated_at: new Date().toISOString(),
      };

      let query;
      
      if (isEditMode && id) {
        // وضع التعديل
        query = supabase
          .from('shippers')
          .update(shipperPayload)
          .eq('id', id);
      } else {
        // وضع الإضافة
        query = supabase
          .from('shippers')
          .insert([{
            ...shipperPayload,
            total_shipments: 0,
            balance: 0,
            created_at: new Date().toISOString(),
          }]);
      }

      const { error: dbError } = await query;

      if (dbError) {
        console.error('Database error:', dbError);
        
        if (dbError.message.includes('duplicate key')) {
          throw new Error('البريد الإلكتروني أو رقم التليفون ده موجود قبل كده في النظام. اختار رقم أو بريد تاني.');
        }
        if (dbError.message.includes('violates not-null constraint')) {
          throw new Error('فيه حقول مطلوبة ناقصة. راجع البيانات المدخلة.');
        }
        throw dbError;
      }

      // عرض رسالة نجاح مناسبة
      const successMessage = isEditMode 
        ? `تم تعديل بيانات "${data.name}" بنجاح`
        : `تم إضافة تاجر "${data.name}" بنجاح`;
      
      toast({
        title: isEditMode ? "تم التعديل بنجاح" : "تمت الإضافة بنجاح",
        description: successMessage,
      });

      // الانتقال بعد 1.5 ثانية
      setTimeout(() => {
        navigate('/app/shippers');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : isEditMode 
          ? 'فشل تعديل التاجر. راجع البيانات وحاول تاني' 
          : 'فشل إضافة التاجر. راجع البيانات وحاول تاني';
      
      setError(errorMessage);
      console.error('Error processing shipper:', err);
      
      toast({
        title: isEditMode ? "فشل التعديل" : "فشل الإضافة",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // معالجة حالة التحميل
  if (authLoading || (isEditMode && loadingShipper)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-dashed border-primary/20">
          <CardContent className="pt-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isEditMode ? 'جاري تحميل بيانات التاجر...' : 'جاري التحقق من الصلاحيات...'}
            </h2>
            <p className="text-muted-foreground">برجاء الانتظار</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* شريط التنقل العلوي */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/app/shippers')}
              className="gap-2 text-gray-700 hover:bg-primary/5 hover:text-primary"
            >
              <XCircle className="h-4 w-4" />
              إلغاء
            </Button>
            <div className="w-px h-8 bg-border"></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-gray-900">
                {isEditMode ? (
                  <>
                    <Edit3 className="h-8 w-8 text-primary" />
                    تعديل بيانات التاجر
                  </>
                ) : (
                  <>
                    <Store className="h-8 w-8 text-primary" />
                    إضافة تاجر جديد
                  </>
                )}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                {isEditMode 
                  ? 'عدّل معلومات التاجر واحفظ التغييرات' 
                  : 'أدخل معلومات التاجر الجديد عشان تضيفه للنظام'}
              </p>
            </div>
          </div>
          
          {shipperData && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-700">
                تم التسجيل منذ {format(new Date(shipperData.created_at), 'dd/MM/yyyy', { locale: ar })}
              </span>
            </div>
          )}
        </div>

        {/* ملاحظات هامة */}
        <Alert className="bg-blue-50/70 border-blue-200 mb-6">
          <AlertTitle className="flex items-center gap-2 text-blue-800 font-bold">
            <Info className="h-4 w-4 flex-shrink-0" />
            {isEditMode ? 'ملاحظات هامة قبل التعديل' : 'ملاحظات هامة قبل الإضافة'}
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-1.5 text-blue-700 text-sm">
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>تأكد من صحة رقم التليفون (يبدأ بـ 010، 011، 012، أو 015 ويتكون من 11 رقم)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>
                {isEditMode 
                  ? 'التعديلات هتتعمّل فوراً وهيتأثر على شغل التاجر' 
                  : 'التاجر الجديد هيكون "نشط" افتراضياً وهيبدأ يستقبل شحنات فوراً'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>ممكن ترجع أي تعديلات من صفحة تفاصيل التاجر بعد كده</span>
            </p>
          </AlertDescription>
        </Alert>

        {/* معاينة الأفاتار */}
        {form.watch('email') && (
          <Card className="mb-6 border-blue-200 bg-blue-50/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarImage 
                    src={`https://www.gravatar.com/avatar/${(form.watch('email') || '').trim().toLowerCase()}?s=200&d=identicon`}
                    alt={form.watch('name') || 'صورة التاجر'}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-2xl font-bold">
                    {(form.watch('name') || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg">{form.watch('name') || 'اسم التاجر'}</p>
                  <p className="text-muted-foreground">{form.watch('email')}</p>
                  <p className="text-sm text-blue-700 mt-1">دي هتبقى صورة التاجر في النظام</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* نموذج الإضافة/التعديل */}
        <Card className="shadow-xl border-primary/20 overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-blue-50/70">
            <CardTitle className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2.5">
              {isEditMode ? <Edit3 className="h-6 w-6" /> : <Store className="h-6 w-6" />}
              {isEditMode ? 'تعديل معلومات التاجر' : 'معلومات التاجر الأساسية'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {isEditMode 
                ? 'عدّل البيانات المطلوبة واضغط "حفظ التعديلات" في الآخر' 
                : 'ملّي كل الحقول المطلوبة بدقة. الحقول المميزة بـ * إجبارية'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* الصف الأول: الاسم ورقم التليفون */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-800 font-medium">
                          <User className="h-4 w-4 text-primary flex-shrink-0" />
                          اسم التاجر <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isEditMode ? shipperData?.name : "مثال: متجر الأزياء"}
                            {...field}
                            dir="rtl"
                            disabled={submitting || loadingShipper}
                            className={cn(
                              "text-right bg-background border-2 focus:border-primary/50 transition-colors",
                              field.value && "border-green-500/30 bg-green-50/30",
                              field.value && "focus:border-green-500/50"
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-600 mt-1">
                          الاسم الكامل للتاجر زي ما هيظهر في النظام والتقارير
                        </FormDescription>
                        <FormMessage className="text-xs font-medium text-destructive" />
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
                            placeholder={isEditMode ? shipperData?.phone : "01012345678"}
                            {...field}
                            dir="ltr"
                            disabled={submitting || loadingShipper}
                            className={cn(
                              "font-mono bg-background border-2 focus:border-primary/50 transition-colors",
                              field.value && "border-green-500/30 bg-green-50/30",
                              field.value && "focus:border-green-500/50"
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-600 mt-1">
                          مثال: 01012345678 (رقم مصري صحيح)
                        </FormDescription>
                        <FormMessage className="text-xs font-medium text-destructive" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* الصف الثاني: البريد الإلكتروني والمدينة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-800 font-medium">
                          <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                          البريد الإلكتروني
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={isEditMode ? shipperData?.email || "example@email.com" : "example@email.com"}
                            {...field}
                            dir="ltr"
                            disabled={submitting || loadingShipper}
                            className="bg-background border-2 focus:border-primary/50 transition-colors"
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-600 mt-1">
                          البريد الإلكتروني للتواصل مع التاجر (اختياري لكن موصى بيه)
                        </FormDescription>
                        <FormMessage className="text-xs font-medium text-destructive" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-800 font-medium">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          المدينة <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isEditMode ? shipperData?.city : "القاهرة"}
                            {...field}
                            dir="rtl"
                            disabled={submitting || loadingShipper}
                            className="bg-background border-2 focus:border-primary/50 transition-colors"
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-600 mt-1">
                          المدينة اللي التاجر بيستقبل منها شحنات
                        </FormDescription>
                        <FormMessage className="text-xs font-medium text-destructive" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* الصف الثالث: العنوان والفرع */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-800 font-medium">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          العنوان الكامل <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isEditMode ? shipperData?.address : "شارع التحرير، الدور 3"}
                            {...field}
                            dir="rtl"
                            disabled={submitting || loadingShipper}
                            className="bg-background border-2 focus:border-primary/50 transition-colors"
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-600 mt-1">
                          العنوان التفصيلي للتاجر (شارع، عمارة، دور، إلخ)
                        </FormDescription>
                        <FormMessage className="text-xs font-medium text-destructive" />
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
                            placeholder={isEditMode ? shipperData?.branch || "فرع المعادي" : "فرع المعادي"}
                            {...field}
                            dir="rtl"
                            disabled={submitting || loadingShipper}
                            className="bg-background border-2 focus:border-primary/50 transition-colors"
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-600 mt-1">
                          الفرع التابع ليه التاجر (اختياري)
                        </FormDescription>
                        <FormMessage className="text-xs font-medium text-destructive" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* الصف الرابع: الحالة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-800 font-medium flex items-center gap-2">
                          <Store className="h-4 w-4 text-primary" />
                          حالة التاجر
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value} 
                          disabled={submitting || loadingShipper}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background border-2 focus:border-primary/50 transition-colors">
                              <SelectValue placeholder="اختر حالة التاجر" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active" className="cursor-pointer hover:bg-green-50">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>نشط (بيضيف شحنات)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive" className="cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-gray-600" />
                                <span>مش نشط (مش بيضيف شحنات)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-gray-600 mt-1">
                          الحالة دي هتأثر على إضافة التاجر للشحنات الجديدة
                        </FormDescription>
                        <FormMessage className="text-xs font-medium text-destructive" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* رسالة خطأ عامة */}
                {error && (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1">
                      <AlertTitle className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {isEditMode ? 'خطأ في التعديل' : 'خطأ في الإضافة'}
                      </AlertTitle>
                      <AlertDescription className="mt-1 text-sm">{error}</AlertDescription>
                    </div>
                  </Alert>
                )}

                {/* أزرار الإرسال */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border mt-2">
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50/70 px-4 py-3 rounded-lg border border-amber-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>كل الحقول المميزة بـ <span className="text-destructive">*</span> إجبارية</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate('/app/shippers')}
                      disabled={submitting || loadingShipper}
                      className="w-full sm:w-auto gap-2 h-11 text-base px-6"
                    >
                      <XCircle className="h-4 w-4" />
                      إلغاء
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting || loadingShipper}
                      className="w-full sm:w-auto gap-2.5 h-11 bg-primary hover:bg-primary/90 text-white text-base px-8 shadow-md hover:shadow-lg transition-shadow"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {isEditMode ? 'جاري الحفظ...' : 'جاري الإضافة...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          {isEditMode ? 'حفظ التعديلات' : 'إضافة التاجر'}
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
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50/30 border-green-200 mt-6">
          <AlertTitle className="font-bold text-green-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {isEditMode ? 'بعد الحفظ' : 'بعد الإضافة'}
          </AlertTitle>
          <AlertDescription className="mt-1.5 text-green-700">
            {isEditMode 
              ? 'هيتم تحديث بيانات التاجر فوراً وهيتم تحويلك لقائمة التجار.' 
              : 'هيتم تحويلك تلقائياً لقائمة التجار بعد الإضافة الناجحة. التاجر الجديد هيظهر في القائمة ويمكنك تعديل بياناته أو تعيين شحنات ليه فوراً.'}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default AddEditShipperPage;