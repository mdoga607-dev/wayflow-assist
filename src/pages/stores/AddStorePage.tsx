/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/stores/AddStorePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  Store, 
  MapPin, 
  Phone, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  XCircle,
  Info,
  Star,
  HelpCircle,
  Clock,
  Users,
  Package,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// Schema للتحقق من صحة البيانات
const formSchema = z.object({
  name: z.string().min(2, 'اسم الفرع مطلوب').max(100, 'الاسم طويل جداً'),
  address: z.string().min(5, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  city: z.string().min(1, 'المدينة مطلوبة'),
  phone: z.string()
    .regex(/^01[0-9]{9}$/, 'رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم'),
  branch: z.string().optional(),
  is_casual: z.boolean().default(false),
  central_branch: z.boolean().default(false),
  status: z.string().default('active'),
});

type FormData = z.infer<typeof formSchema>;

const AddStorePage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);

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
    }
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager', 'admin'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإضافة فروع",
        variant: "destructive"
      });
      navigate('/app');
    }
  }, [authLoading, role, navigate]);

  // جلب المدن من قاعدة البيانات
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('stores')
          .select('city');
        
        if (!fetchError && data) {
          const uniqueCities = Array.from(new Set(data.map(s => s.city))).filter(Boolean).sort();
          setCities(uniqueCities);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCities();
  }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('stores')
        .insert([{
          name: data.name.trim(),
          address: data.address.trim(),
          city: data.city,
          phone: data.phone.trim(),
          branch: data.branch?.trim() || null,
          is_casual: data.is_casual,
          central_branch: data.central_branch,
          status: data.status,
          created_by: user?.id
        }]);

      if (insertError) throw insertError;

      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة فرع "${data.name}" بنجاح`
      });

      setTimeout(() => navigate('/app/stores'), 1500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الإضافة');
      toast({ title: "فشل الإضافة", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // معالجة حالة التحميل لتجنب الصفحة البيضاء
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="h-6 w-6 text-blue-600" />
            إضافة فرع جديد
          </h1>
          <p className="text-gray-600 mt-1">أدخل معلومات الفرع الجديد لإضافته إلى النظام</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/stores')}
          className="gap-2 border-gray-300"
        >
          <XCircle className="h-4 w-4" /> إلغاء
        </Button>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium">ملاحظات هامة قبل الإضافة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>تأكد من صحة رقم الهاتف (11 رقم)</li>
                <li>جميع الحقول المميزة بـ * إلزامية</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" /> معلومات الفرع الأساسية
            </CardTitle>
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
                        <FormLabel>اسم الفرع *</FormLabel>
                        <FormControl><Input placeholder="مثال: فرع القاهرة" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="القاهرة">القاهرة</SelectItem>
                            <SelectItem value="الجيزة">الجيزة</SelectItem>
                            <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
                            {cities.map(c => !['القاهرة', 'الجيزة', 'الإسكندرية'].includes(c) && (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العنوان التفصيلي *</FormLabel>
                        <FormControl><Textarea rows={3} {...field} className="resize-none" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف *</FormLabel>
                        <FormControl><Input dir="ltr" placeholder="01XXXXXXXXX" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المنطقة / الحي</FormLabel>
                        <FormControl><Input placeholder="مثال: المعادي" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 p-3 bg-gray-50 rounded-lg border">
                    <FormField
                      control={form.control}
                      name="central_branch"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-reverse space-x-3">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <div className="leading-none">
                            <FormLabel className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-600"/> فرع مركزي</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_casual"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-reverse space-x-3">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <div className="leading-none">
                            <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600"/> فرع مؤقت</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>خطأ</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => navigate('/app/stores')} disabled={submitting}>إلغاء</Button>
                  <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="ml-2 h-4 w-4" />}
                    إضافة الفرع
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5" /> معلومات النظام</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-md text-green-800">
                <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span className="text-sm">إدارة الفروع</span></div>
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md text-purple-800">
                <div className="flex items-center gap-2"><Package className="h-4 w-4" /><span className="text-sm">تتبع الشحنات</span></div>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-md text-yellow-800">
                <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /><span className="text-sm">التقارير</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddStorePage;