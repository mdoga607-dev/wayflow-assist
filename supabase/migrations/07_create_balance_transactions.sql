-- 1. إنشاء جدول العمليات المالية
CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'collection', 'refund', 'expense', 'transfer')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'wallet', 'credit')),
  reference_number TEXT,
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. تفعيل RLS
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- 3. سياسات الوصول
DROP POLICY IF EXISTS "Head managers can manage balance transactions" ON public.balance_transactions;
CREATE POLICY "Head managers can manage balance transactions"
  ON public.balance_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'head_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'head_manager'));

DROP POLICY IF EXISTS "Managers can view balance transactions" ON public.balance_transactions;
CREATE POLICY "Managers can view balance transactions"
  ON public.balance_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'head_manager'));