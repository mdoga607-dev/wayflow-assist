/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/CashCollectionPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Wallet, User, Building2, Receipt, Plus, X } from 'lucide-react';

const CashCollectionPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [delegates, setDelegates] = useState<any[]>([]);
  const [shippers, setShippers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    transaction_type: 'collection',
    payment_method: 'cash',
    delegate_id: '',
    shipper_id: '',
    store_id: '',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [delegatesRes, shippersRes, storesRes] = await Promise.all([
          supabase.from('delegates').select('id, name').eq('status', 'active').order('name'),
          supabase.from('shippers').select('id, name').eq('status', 'active').order('name'),
          supabase.from('stores').select('id, name').eq('status', 'active').order('name')
        ]);

        setDelegates(delegatesRes.data || []);
        setShippers(shippersRes.data || []);
        setStores(storesRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('المبلغ يجب أن يكون أكبر من الصفر');
      }

      const { error } = await supabase
        .from('balance_transactions')
        .insert([{
          amount: amount,
          transaction_type: formData.transaction_type,
          payment_method: formData.payment_method,
          delegate_id: formData.delegate_id || null,
          shipper_id: formData.shipper_id || null,
          store_id: formData.store_id || null,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          transaction_date: new Date().toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id || null
        }]);

      if (error) throw error;

      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم تسجيل تحصيل نقدي بقيمة ${amount.toLocaleString()} ر.س`
      });

      // إعادة تعيين النموذج
      setFormData({
        amount: '',
        transaction_type: 'collection',
        payment_method: 'cash',
        delegate_id: '',
        shipper_id: '',
        store_id: '',
        reference_number: '',
        notes: ''
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل إضافة التحصيل';
      toast({
        title: "فشل الإضافة",
        description: errorMessage,
        variant: "destructive"
      });
      console.error('Error adding collection:', err);
    } finally {
      setLoading(false);
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
    <div className="container py-8" dir="rtl">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="h-6 w-6 text-primary" />
                إضافة تحصيل نقدي
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                سجل عملية تحصيل نقدي من التاجر أو للمندوب
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/app/balance')}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* المبلغ */}
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (ر.س) <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="أدخل المبلغ"
                  className="pl-10"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* نوع العملية */}
            <div className="space-y-2">
              <Label>نوع العملية</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={formData.transaction_type === 'collection' ? 'default' : 'outline'}
                  onClick={() => setFormData({...formData, transaction_type: 'collection'})}
                  className="gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  تحصيل
                </Button>
                <Button
                  type="button"
                  variant={formData.transaction_type === 'payment' ? 'default' : 'outline'}
                  onClick={() => setFormData({...formData, transaction_type: 'payment'})}
                  className="gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  دفع
                </Button>
              </div>
            </div>

            {/* طريقة الدفع */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">طريقة الدفع</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(value) => setFormData({...formData, payment_method: value})}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="bank_transfer">حوالة بنكية</SelectItem>
                  <SelectItem value="wallet">محفظة إلكترونية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الجهة */}
            <div className="space-y-2">
              <Label>الجهة</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={formData.delegate_id ? 'default' : 'outline'}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      delegate_id: delegates[0]?.id || '',
                      shipper_id: '',
                      store_id: ''
                    });
                  }}
                  className="gap-2"
                >
                  <Truck className="h-4 w-4" />
                  مندوب
                </Button>
                <Button
                  type="button"
                  variant={formData.shipper_id ? 'default' : 'outline'}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      shipper_id: shippers[0]?.id || '',
                      delegate_id: '',
                      store_id: ''
                    });
                  }}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  تاجر
                </Button>
                <Button
                  type="button"
                  variant={formData.store_id ? 'default' : 'outline'}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      store_id: stores[0]?.id || '',
                      delegate_id: '',
                      shipper_id: ''
                    });
                  }}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  فرع
                </Button>
              </div>
            </div>

            {/* اختيار الجهة المحددة */}
            {formData.delegate_id && (
              <div className="space-y-2">
                <Label htmlFor="delegate">اختر المندوب</Label>
                <Select onValueChange={(value) => setFormData({...formData, delegate_id: value})}>
                  <SelectTrigger id="delegate">
                    <SelectValue placeholder="اختر المندوب" />
                  </SelectTrigger>
                  <SelectContent>
                    {delegates.map(delegate => (
                      <SelectItem key={delegate.id} value={delegate.id}>
                        {delegate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.shipper_id && (
              <div className="space-y-2">
                <Label htmlFor="shipper">اختر التاجر</Label>
                <Select onValueChange={(value) => setFormData({...formData, shipper_id: value})}>
                  <SelectTrigger id="shipper">
                    <SelectValue placeholder="اختر التاجر" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippers.map(shipper => (
                      <SelectItem key={shipper.id} value={shipper.id}>
                        {shipper.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.store_id && (
              <div className="space-y-2">
                <Label htmlFor="store">اختر الفرع</Label>
                <Select onValueChange={(value) => setFormData({...formData, store_id: value})}>
                  <SelectTrigger id="store">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* رقم المرجع والملاحظات */}
            <div className="space-y-2">
              <Label htmlFor="reference">رقم المرجع (اختياري)</Label>
              <Input
                id="reference"
                value={formData.reference_number}
                onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                placeholder="أدخل رقم الفاتورة أو الإيصال"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="أي ملاحظات إضافية عن العملية"
                rows={3}
              />
            </div>

            {/* أزرار الإرسال */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/app/balance')}
                disabled={loading}
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة التحصيل
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// أيقونة الشاحنة
const Truck = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="16" height="10" x="2" y="6" rx="2" />
    <path d="M22 17h-6" />
    <path d="M6 17v-4" />
    <circle cx="6" cy="15" r="2" />
    <circle cx="16" cy="15" r="2" />
  </svg>
);

export default CashCollectionPage;