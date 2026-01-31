// src/components/balance/BalanceForm.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBalance } from '@/hooks/useBalance';
import { useShippers } from '@/hooks/useShippers';
import { useDelegates } from '@/hooks/useDelegates';
import { useStores } from '@/hooks/useStores';
import { toast } from '@/hooks/use-toast';
import { Loader2, DollarSign, Calendar, FileText, Users, MapPin } from 'lucide-react';

// Schema للتحقق من صحة البيانات
const formSchema = z.object({
  shipper_id: z.string().optional(),
  delegate_id: z.string().optional(),
  store_id: z.string().optional(),
  amount: z.string().min(1, 'المبلغ مطلوب').regex(/^\d+(\.\d{1,2})?$/, 'المبلغ غير صحيح'),
  transaction_type: z.string({ required_error: 'نوع العملية مطلوب' }),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  notes: z.string().max(500, 'الحد الأقصى 500 حرف').optional(),
  transaction_date: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface BalanceFormProps {
  onSuccess?: () => void;
}

export function BalanceForm({ onSuccess }: BalanceFormProps) {
  const { createTransaction, loading: balanceLoading } = useBalance();
  const { shippers, loading: shippersLoading, error: shippersError } = useShippers();
  const { delegates, loading: delegatesLoading, error: delegatesError } = useDelegates();
  const { stores, loading: storesLoading, error: storesError } = useStores();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // إعداد النموذج
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      transaction_type: '',
      transaction_date: new Date().toISOString().split('T')[0],
      shipper_id: 'none',
      delegate_id: 'none',
      store_id: 'none',
      payment_method: '',
      reference_number: '',
      notes: ''
    }
  });

  // معالجة الأخطاء من الـ hooks
  useEffect(() => {
    if (shippersError || delegatesError || storesError) {
      setFormError('فشل تحميل البيانات الأساسية. يرجى المحاولة مرة أخرى.');
      toast({
        title: "خطأ في التحميل",
        description: "فشل تحميل بعض البيانات. تأكد من اتصالك بالإنترنت.",
        variant: "destructive"
      });
    }
  }, [shippersError, delegatesError, storesError]);

  // معالجة الإرسال
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setFormError(null);
    
    // تحويل المبلغ إلى رقم
    const amount = parseFloat(data.amount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({ 
        title: "خطأ", 
        description: "المبلغ يجب أن يكون رقماً موجباً", 
        variant: "destructive" 
      });
      setSubmitting(false);
      return;
    }

    // تحويل "none" إلى undefined قبل الإرسال
    const cleanedData = {
      ...data,
      shipper_id: data.shipper_id === 'none' ? undefined : data.shipper_id,
      delegate_id: data.delegate_id === 'none' ? undefined : data.delegate_id,
      store_id: data.store_id === 'none' ? undefined : data.store_id,
    };

    const result = await createTransaction({
      ...cleanedData,
      amount,
      transaction_date: cleanedData.transaction_date 
        ? `${cleanedData.transaction_date}T${new Date().toISOString().split('T')[1]}`
        : new Date().toISOString()
    });
    
    setSubmitting(false);
    
    if (result.success) {
      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة العملية المالية بنجاح"
      });
      
      // إعادة تعيين النموذج
      form.reset({
        amount: '',
        transaction_type: '',
        transaction_date: new Date().toISOString().split('T')[0],
        shipper_id: 'none',
        delegate_id: 'none',
        store_id: 'none',
        payment_method: '',
        reference_number: '',
        notes: ''
      });
      
      onSuccess?.();
    } else {
      setFormError(result.error || "حدث خطأ أثناء إضافة العملية المالية");
      toast({
        title: "فشل الإضافة",
        description: result.error || "حدث خطأ أثناء إضافة العملية المالية",
        variant: "destructive"
      });
    }
  };

  // حالة التحميل الشاملة
  const isLoading = shippersLoading || delegatesLoading || storesLoading || balanceLoading;

  // إذا كان هناك خطأ جوهري
  if (formError && !isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-destructive">
            <FileText className="h-7 w-7" />
            خطأ في تحميل الصفحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center py-8">
            <p className="text-lg font-medium">{formError}</p>
            <Button onClick={() => window.location.reload()}>
              إعادة تحميل الصفحة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <DollarSign className="h-7 w-7 text-primary" />
          إضافة عملية مالية
        </CardTitle>
        <CardDescription>
          أدخل تفاصيل العملية المالية الجديدة (دفع، تحصيل، مصروف، إلخ)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* نوع العملية */}
              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      نوع العملية <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع العملية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment">دفع</SelectItem>
                          <SelectItem value="collection">تحصيل</SelectItem>
                          <SelectItem value="refund">مرتجع</SelectItem>
                          <SelectItem value="expense">مصروف</SelectItem>
                          <SelectItem value="transfer">تحويل</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* المبلغ */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      المبلغ (ر.س) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          {...field}
                          disabled={submitting}
                          className="pr-12 text-2xl font-bold"
                          onChange={(e) => {
                            // السماح فقط بالأرقام والفاصلة العشرية
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            // منع أكثر من فاصلة عشرية واحدة
                            if ((value.match(/\./g) || []).length > 1) return;
                            field.onChange(value);
                          }}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ر.س
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      أدخل المبلغ بالريال السعودي (يمكن إدخال أرقام عشرية مثل 150.50)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* الطرف المتعامل (تاجر/مندوب/متجر) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="shipper_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        التاجر
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر تاجراً" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون تاجر</SelectItem>
                            {shippers.map((shipper) => (
                              <SelectItem key={shipper.id} value={shipper.id}>
                                {shipper.name} {shipper.phone && `(${shipper.phone})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        اختر التاجر المرتبط بالعملية (اختياري)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delegate_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        المندوب
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مندوباً" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون مندوب</SelectItem>
                            {delegates.map((delegate) => (
                              <SelectItem key={delegate.id} value={delegate.id}>
                                {delegate.name} {delegate.phone && `(${delegate.phone})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        اختر المندوب المرتبط بالعملية (اختياري)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="store_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        الفرع
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر فرعاً" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون فرع</SelectItem>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.name} {store.city && `(${store.city})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        اختر الفرع المرتبط بالعملية (اختياري)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* طريقة الدفع والمرجع */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        طريقة الدفع
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر طريقة الدفع" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">نقداً</SelectItem>
                            <SelectItem value="bank_transfer">حوالة بنكية</SelectItem>
                            <SelectItem value="wallet">محفظة إلكترونية</SelectItem>
                            <SelectItem value="credit">دفع آجل</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        اختر طريقة الدفع (نقداً، بنك، إلخ)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        رقم المرجع
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="رقم الحوالة أو الفاتورة"
                          {...field}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormDescription>
                        أدخل رقم المرجع للحوالة البنكية أو الفاتورة (اختياري)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* التاريخ والملاحظات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transaction_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        تاريخ العملية
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={submitting}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormDescription>
                        التاريخ الذي تمت فيه العملية (الافتراضي: اليوم)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        ملاحظات
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل أي ملاحظات إضافية عن العملية المالية..."
                          {...field}
                          disabled={submitting}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        ملاحظات إضافية عن العملية (اختياري، الحد الأقصى 500 حرف)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* زر الإرسال */}
              <Button 
                type="submit" 
                className="w-full text-lg py-6"
                disabled={submitting || isLoading}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-2" />
                    إضافة العملية المالية
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}