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
  XCircle, Info, Truck 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, 'اسم المندوب مطلوب').max(100, 'الاسم طويل جداً'),
  phone: z.string()
    .regex(/^01[0-9]{9}$/, 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)'),
  city: z.string().min(2, 'المدينة مطلوبة').max(50, 'المدينة طويلة جداً'),
  branch: z.string().optional(),
  status: z.string().default('active'),
  courier_limit: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const AddDelegatePage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
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
      courier_limit: '0',
    }
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const courierLimit = data.courier_limit ? parseInt(data.courier_limit) : 0;

      // ✅ تم التصحيح: إدخال جميع الحقول المطلوبة مع قيم افتراضية
      const { error: insertError } = await supabase
        .from('delegates')
        .insert([{
          name: data.name.trim(),
          phone: data.phone.trim(),
          city: data.city.trim(),
          branch: data.branch?.trim() || null,
          status: data.status,
          courier_limit: courierLimit,
          total_delivered: 0,
          total_delayed: 0,
          total_returned: 0,
          balance: 0,
          commission_due: 0,
          store_id: null, // يمكن تغييره لاحقاً
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة مندوب "${data.name}" بنجاح`,
      });

      setTimeout(() => {
        navigate('/app/delegates');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل إضافة المندوب. يرجى المحاولة مرة أخرى.';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            إضافة مندوب جديد
          </h1>
          <p className="text-muted-foreground mt-1">
            أدخل معلومات المندوب الجديد لإضافته إلى النظام
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/delegates')}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          إلغاء وإغلاق
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="flex items-center gap-2 text-blue-800">
          <Info className="h-4 w-4" />
          ملاحظات هامة قبل الإضافة
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-1 text-blue-700 text-sm">
          <p>• تأكد من صحة رقم الهاتف (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)</p>
          <p>• المندوب الجديد سيكون في حالة "نشط" افتراضياً</p>
          <p>• يمكن تعديل حد التوصيل لاحقاً من صفحة تعديل المندوب</p>
        </AlertDescription>
      </Alert>

      <Card className="shadow-xl border-primary/20">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-blue-50">
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <User className="h-6 w-6" />
            معلومات المندوب الأساسية
          </CardTitle>
          <CardDescription>
            يرجى ملء جميع الحقول المطلوبة بدقة لضمان إضافة صحيحة
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        اسم المندوب <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="أدخل اسم المندوب الكامل"
                          {...field}
                          dir="rtl"
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormDescription>
                        الاسم الكامل للمندوب كما سيظهر في النظام
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        المدينة التي يعمل فيها المندوب
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        الفرع
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: فرع القاهرة"
                          {...field}
                          dir="rtl"
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormDescription>
                        الفرع الذي يتبع له المندوب
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة المندوب</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر حالة المندوب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="inactive">غير نشط</SelectItem>
                          <SelectItem value="on_leave">في إجازة</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        حالة المندوب في النظام (نشط/غير نشط/في إجازة)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courier_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        حد التوصيل اليومي
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          disabled={submitting}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        الحد الأقصى لعدد الشحنات التي يمكن للمندوب توصيلها يومياً
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {error && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>خطأ في الإضافة</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>جميع الحقول المميزة بـ * مطلوبة</span>
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/app/delegates')}
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
    </div>
  );
};

export default AddDelegatePage;