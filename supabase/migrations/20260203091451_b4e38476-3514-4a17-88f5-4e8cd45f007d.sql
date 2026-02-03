-- 1. إنشاء جدول المتاجر (stores)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    manager_name TEXT,
    working_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء جدول الفروع (branches)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    governorate TEXT NOT NULL,
    city TEXT,
    address TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    opening_time TIME DEFAULT '09:00:00',
    closing_time TIME DEFAULT '18:00:00',
    manager_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إنشاء جدول الشيتات (sheets)
CREATE TABLE IF NOT EXISTS public.sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sheet_type TEXT NOT NULL CHECK (sheet_type IN ('pickup', 'courier', 'returned', 'delivery', 'travel', 'returned_travel', 'return')),
    delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
    store_id UUID,
    shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
    notes TEXT,
    total_shipments INTEGER DEFAULT 0,
    total_cod NUMERIC DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. إنشاء جدول المعاملات المالية (balance_transactions)
CREATE TABLE IF NOT EXISTS public.balance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
    delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
    store_id UUID,
    amount NUMERIC NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'collection', 'refund', 'expense', 'transfer', 'credit', 'debit')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'wallet', 'credit')),
    reference_number TEXT,
    notes TEXT,
    receipt_url TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. إنشاء جدول الجرد (inventory)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    branch_id UUID,
    store_id UUID,
    delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
    total_items INTEGER DEFAULT 0,
    counted_items INTEGER DEFAULT 0,
    discrepancy INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    inventory_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. إنشاء جدول المهام (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID,
    delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. إنشاء جدول المحافظات (governorates)
CREATE TABLE IF NOT EXISTS public.governorates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    name_en TEXT,
    code TEXT,
    shipping_fee NUMERIC DEFAULT 50,
    delivery_days INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. إنشاء جدول المناطق (areas)
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    governorate_id UUID REFERENCES public.governorates(id) ON DELETE CASCADE,
    shipping_fee NUMERIC DEFAULT 50,
    delivery_days INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. إنشاء جدول طلبات البيك أب (pickup_requests)
CREATE TABLE IF NOT EXISTS public.pickup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_id UUID REFERENCES public.shippers(id) ON DELETE CASCADE,
    delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
    store_id UUID,
    pickup_address TEXT NOT NULL,
    pickup_time TIMESTAMP WITH TIME ZONE,
    scheduled_date DATE,
    notes TEXT,
    items_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'collected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. إضافة عمود sheet_id لجدول الشحنات إذا لم يكن موجوداً
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'sheet_id') THEN
        ALTER TABLE public.shipments ADD COLUMN sheet_id UUID REFERENCES public.sheets(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 11. تفعيل RLS لجميع الجداول الجديدة
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

-- 12. سياسات الوصول للمستخدمين المسجلين
CREATE POLICY "Authenticated users can view stores" ON public.stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head managers can manage stores" ON public.stores FOR ALL TO authenticated USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Authenticated users can view branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Head managers can manage branches" ON public.branches FOR ALL TO authenticated USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Authenticated users can view sheets" ON public.sheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage sheets" ON public.sheets FOR ALL TO authenticated USING (has_role(auth.uid(), 'head_manager') OR has_role(auth.uid(), 'user'));

CREATE POLICY "Authenticated users can view transactions" ON public.balance_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage transactions" ON public.balance_transactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Authenticated users can view inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage inventory" ON public.inventory FOR ALL TO authenticated USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Authenticated users can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage tasks" ON public.tasks FOR ALL TO authenticated USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Anyone can view governorates" ON public.governorates FOR SELECT USING (true);
CREATE POLICY "Head managers can manage governorates" ON public.governorates FOR ALL TO authenticated USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Anyone can view areas" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Head managers can manage areas" ON public.areas FOR ALL TO authenticated USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Authenticated users can view pickup_requests" ON public.pickup_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage pickup_requests" ON public.pickup_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'head_manager'));