-- إنشاء جدول عمليات الجرد إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
  total_items INTEGER DEFAULT 0,
  counted_items INTEGER DEFAULT 0,
  discrepancy INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  inventory_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- إنشاء جدول سجلات الجرد إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  expected_quantity INTEGER NOT NULL DEFAULT 0,
  counted_quantity INTEGER NOT NULL DEFAULT 0,
  discrepancy INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('matched', 'missing', 'extra')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_inventory_branch ON public.inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_created_by ON public.inventory(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_inventory ON public.inventory_logs(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_shipment ON public.inventory_logs(shipment_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_status ON public.inventory_logs(status);

-- تفعيل سياسات الأمان
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- سياسات عمليات الجرد
CREATE POLICY "Enable read for managers on inventory" 
  ON public.inventory FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable insert for managers on inventory" 
  ON public.inventory FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable update for managers on inventory" 
  ON public.inventory FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable delete for managers on inventory" 
  ON public.inventory FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

-- سياسات سجلات الجرد
CREATE POLICY "Enable read for managers on inventory_logs" 
  ON public.inventory_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable insert for managers on inventory_logs" 
  ON public.inventory_logs FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );