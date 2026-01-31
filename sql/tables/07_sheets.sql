-- src/01-sample_sheet.sql
-- ✅ الكود المصحح كاملاً (انسخه كاملاً واستبدله)
CREATE TABLE IF NOT EXISTS public.sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sheet_type TEXT NOT NULL CHECK (sheet_type IN ('courier', 'returned', 'pickup', 'travel', 'returned_travel')),
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_sheets_type ON public.sheets(sheet_type);
CREATE INDEX IF NOT EXISTS idx_sheets_delegate ON public.sheets(delegate_id);
CREATE INDEX IF NOT EXISTS idx_sheets_status ON public.sheets(status);

-- سياسات الأمان
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" 
  ON public.sheets FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for managers" 
  ON public.sheets FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );