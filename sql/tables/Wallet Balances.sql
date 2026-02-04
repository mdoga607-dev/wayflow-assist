-- 1. إنشاء جدول شيتات المناديب
CREATE TABLE IF NOT EXISTS public.sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_name TEXT NOT NULL,
    sheet_type TEXT NOT NULL, -- courier, pickup, etc.
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء جدول طلبات البيك أب (لحل مشكلة الصورة الثانية)
CREATE TABLE IF NOT EXISTS public.pickup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES auth.users(id),
    courier_id UUID REFERENCES auth.users(id),
    pickup_address TEXT NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. إنشاء جداول المحفظة (لحل مشكلة الصورة الثالثة والرابعة)
CREATE TABLE IF NOT EXISTS public.wallet_balances (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment')),
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW()
);

-- 4. تفعيل نظام الحماية (Row Level Security)
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 5. إضافة صلاحيات الوصول (Policies)
CREATE POLICY "Users can access their own sheets" ON public.sheets FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Users can access their own pickup requests" ON public.pickup_requests FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY "Users can view their own balance" ON public.wallet_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);