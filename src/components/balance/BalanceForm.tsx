// src/components/balance/BalanceForm.tsx
import { useState } from 'react';
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
import { TransactionTypeSelector } from './TransactionTypeSelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';
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
  const [submitting, setSubmitting] = useState(false);

  // إعداد النموذج
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      transaction_type: '',
      transaction_date: new Date().toISOString().split('T')[0]
    }
  });

  // معالجة الإرسال
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    
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

    // ✅ الحل: تحويل "none" إلى undefined قبل الإرسال
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
      toast({
        title: "فشل الإضافة",
        description: result.error || "حدث خطأ أثناء إضافة العملية المالية",
        variant: "destructive"
      });
    }
  };

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
                    <TransactionTypeSelector 
                      value={field.value} 
                      onValueChange={field.onChange} 
                      disabled={submitting}
                    />
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
                      <Select onValueChange={field.onChange} value={field.value || 'none'} disabled={submitting}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر تاجراً" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون تاجر</SelectItem>
                          <SelectItem value="demo1">شركة النور للتجارة</SelectItem>
                          <SelectItem value="demo2">متجر الفخر الإلكتروني</SelectItem>
                          <SelectItem value="demo3">محلات السعادة العامة</SelectItem>
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
                      <Select onValueChange={field.onChange} value={field.value || 'none'} disabled={submitting}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مندوباً" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون مندوب</SelectItem>
                          <SelectItem value="demo1">أحمد محمد</SelectItem>
                          <SelectItem value="demo2">خالد عبدالله</SelectItem>
                          <SelectItem value="demo3">محمد سعيد</SelectItem>
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
                      <Select onValueChange={field.onChange} value={field.value || 'none'} disabled={submitting}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر فرعاً" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون فرع</SelectItem>
                          <SelectItem value="demo1">فرع الرياض</SelectItem>
                          <SelectItem value="demo2">فرع جدة</SelectItem>
                          <SelectItem value="demo3">فرع الدمام</SelectItem>
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
                      <PaymentMethodSelector 
                        value={field.value} 
                        onValueChange={field.onChange} 
                        disabled={submitting}
                      />
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
              disabled={submitting || balanceLoading}
            >
              {submitting || balanceLoading ? (
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
      </CardContent>
    </Card>
  );
}