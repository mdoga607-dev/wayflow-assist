// src/pages/balance/AddBalance.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BalanceForm } from '@/components/balance/BalanceForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, FileText } from 'lucide-react';

const AddBalance = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/balance')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-primary" />
              إضافة عملية مالية
            </h1>
            <p className="text-muted-foreground mt-1">
              أضف عملية مالية جديدة (دفع، تحصيل، مصروف، إلخ) إلى النظام
            </p>
          </div>
        </div>
      </div>

      {/* نموذج إضافة العملية المالية */}
      <BalanceForm 
        onSuccess={() => {
          navigate('/balance');
        }} 
      />

      {/* ملاحظات هامة */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          ملاحظات هامة
        </h3>
        <ul className="space-y-2 text-muted-foreground pr-4 list-disc">
          <li>المبلغ المطلوب يجب أن يكون رقماً موجباً (يمكن إدخال أرقام عشرية)</li>
          <li>نوع العملية مطلوب، بينما باقي الحقول اختيارية</li>
          <li>يمكن ربط العملية بتاجر أو مندوب أو فرع واحد فقط (أو بدون أي منهم)</li>
          <li>التاريخ الافتراضي هو اليوم الحالي، ويمكن تعديله</li>
          <li>جميع العمليات تخضع لمراجعة المدير العام</li>
        </ul>
      </Card>
    </div>
  );
};

export default AddBalance;