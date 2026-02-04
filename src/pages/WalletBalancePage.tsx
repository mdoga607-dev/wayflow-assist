/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/WalletBalancePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  CreditCard, 
  Plus, 
  Minus, 
  History, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  QrCode, 
  Smartphone 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  transaction_date: string;
  created_by: string | null;
}

const WalletBalancePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // التأكد من تسجيل الدخول وجلب البيانات
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchWalletData();
    }
  }, [user, authLoading, navigate]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // جلب الرصيد الحالي - استخدام maybeSingle لتجنب الخطأ إذا كان السجل غير موجود
      const { data: balanceData, error: balanceError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (balanceError) throw balanceError;
      setBalance(balanceData?.balance || 0);

      // جلب سجل المعاملات
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error: any) {
      console.error('Error fetching wallet ', error);
      toast({
        title: "فشل التحميل",
        description: "حدث خطأ أثناء تحميل بيانات المحفظة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      toast({ title: "خطأ", description: "المبلغ غير صالح (الحد الأدنى 100 ر.س)", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      // 1. إنشاء معاملة إيداع
      const { error: transError } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: user?.id,
          amount: amount,
          transaction_type: 'deposit',
          payment_method: 'bank_transfer',
          reference_number: `DEP-${Date.now()}`,
          notes: 'إيداع بنكي عبر التطبيق',
          transaction_date: new Date().toISOString()
        }]);

      if (transError) throw transError;

      // 2. تحديث الرصيد (Upsert لضمان الإنشاء إذا لم يوجد)
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .upsert({
          user_id: user?.id,
          balance: (balance + amount),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (updateError) throw updateError;

      toast({
        title: "تم الإيداع بنجاح",
        description: `تم إيداع ${amount.toLocaleString()} ر.س في محفظتك الإلكترونية`
      });

      setDepositAmount('');
      fetchWalletData();
    } catch (error: any) {
      toast({ title: "فشل الإيداع", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 50) {
      toast({ title: "خطأ", description: "المبلغ غير صالح (الحد الأدنى 50 ر.س)", variant: "destructive" });
      return;
    }
    if (amount > balance) {
      toast({ title: "خطأ", description: "رصيد غير كافٍ", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      // 1. إنشاء معاملة سحب
      const { error: transError } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: user?.id,
          amount: amount,
          transaction_type: 'withdrawal',
          payment_method: 'bank_transfer',
          reference_number: `WTH-${Date.now()}`,
          notes: 'سحب رصيد من التطبيق',
          transaction_date: new Date().toISOString()
        }]);

      if (transError) throw transError;

      // 2. تحديث الرصيد
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .update({ balance: (balance - amount) })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "تم السحب بنجاح",
        description: `تم سحب ${amount.toLocaleString()} ر.س من محفظتك الإلكترونية`
      });

      setWithdrawAmount('');
      fetchWalletData();
    } catch (error: any) {
      toast({ title: "فشل السحب", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <Plus className="h-4 w-4 text-green-600" />;
      case 'withdrawal': return <Minus className="h-4 w-4 text-red-600" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-blue-600" />;
      default: return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-green-600';
      case 'withdrawal': return 'text-red-600';
      case 'payment': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="inline-block animate-spin h-12 w-12 text-primary" />
          <p className="mt-4 text-lg font-medium">جاري تحميل بيانات المحفظة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* رأس الصفحة */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              المحفظة الإلكترونية
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة رصيدك ومشاهدة سجل المعاملات المالية
            </p>
          </div>
          <Button variant="outline" onClick={fetchWalletData}>
            <History className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
        </div>

        {/* بطاقة الرصيد الحالي */}
        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-50 border-b">
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              رصيد المحفظة الحالي
            </CardTitle>
            <CardDescription>
              رصيدك المتاح للاستخدام الفوري في جميع خدمات النظام
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-6xl font-black text-primary mb-2">
                {balance.toLocaleString()} <span className="text-2xl font-normal">ر.س</span>
              </div>
              <p className="text-muted-foreground font-medium">
                {balance >= 1000 ? 'رصيد ممتاز' : balance >= 500 ? 'رصيد جيد' : 'رصيد منخفض - يوصى بإعادة الشحن'}
              </p>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200 mt-6">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <AlertTitle className="text-blue-800">ملاحظات هامة:</AlertTitle>
              <AlertDescription className="text-blue-700 mt-2 space-y-1">
                <p>• يمكن استخدام رصيد المحفظة لدفع ثمن الشحنات والخدمات</p>
                <p>• الحد الأدنى للإيداع: 100 ر.س | الحد الأدنى للسحب: 50 ر.س</p>
                <p>• تتم معالجة طلبات الإيداع والسحب خلال 24 ساعة عمل</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* عمليات الإيداع والسحب */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* إيداع */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-green-600">
                <Plus className="h-5 w-5" />
                إيداع رصيد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit">المبلغ (ر.س)</Label>
                <div className="relative">
                  <Wallet className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="deposit"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="الحد الأدنى 100 ر.س"
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['100', '500', '1000', '5000'].map(amt => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setDepositAmount(amt)}>
                    {amt} ر.س
                  </Button>
                ))}
              </div>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleDeposit}
                disabled={processing || !depositAmount || parseFloat(depositAmount) < 100}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "إيداع الرصيد"}
              </Button>
            </CardContent>
          </Card>
          
          {/* سحب */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <Minus className="h-5 w-5" />
                سحب رصيد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw">المبلغ (ر.س)</Label>
                <div className="relative">
                  <Wallet className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="withdraw"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`الرصيد المتاح: ${balance} ر.س`}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['100', '500', '1000'].map(amt => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setWithdrawAmount(amt)}>
                    {amt} ر.س
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setWithdrawAmount(balance.toString())}>سحب الكل</Button>
              </div>
              
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={handleWithdraw}
                disabled={processing || !withdrawAmount || parseFloat(withdrawAmount) > balance || parseFloat(withdrawAmount) < 50}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "سحب الرصيد"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* سجل المعاملات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              سجل أحدث المعاملات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>لا توجد معاملات حتى الآن</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>المرجع</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {new Date(transaction.transaction_date).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.transaction_type)}
                            <span className={getTransactionColor(transaction.transaction_type)}>
                              {transaction.transaction_type === 'deposit' ? 'إيداع' : 'سحب'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          {transaction.amount.toLocaleString()} ر.س
                        </TableCell>
                        <TableCell className="font-mono text-xs">{transaction.reference_number}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">مكتمل</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* طرق الدفع */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 flex flex-col items-center text-center space-y-2">
            <QrCode className="h-10 w-10 text-primary" />
            <h3 className="font-bold">الدفع بالكود</h3>
            <p className="text-xs text-muted-foreground">امسح الكود للإيداع الفوري</p>
          </Card>
          <Card className="p-4 flex flex-col items-center text-center space-y-2">
            <Smartphone className="h-10 w-10 text-primary" />
            <h3 className="font-bold">التطبيقات البنكية</h3>
            <p className="text-xs text-muted-foreground">دعم جميع تطبيقات البنوك</p>
          </Card>
          <Card className="p-4 flex flex-col items-center text-center space-y-2">
            <CreditCard className="h-10 w-10 text-primary" />
            <h3 className="font-bold">البطاقات</h3>
            <p className="text-xs text-muted-foreground">فيزا، ماستركارد، ومدى</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WalletBalancePage;