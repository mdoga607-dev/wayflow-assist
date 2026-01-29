-- ========================================
-- إنشاء جدول الشيتات (مهم جداً لشحنات المناديب)
-- ========================================
CREATE TABLE IF NOT EXISTS public.sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sheet_type TEXT NOT NULL CHECK (sheet_type IN ('courier', 'returned', 'pickup', 'travel', 'returned_travel')),
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل RLS
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_sheets_delegate ON public.sheets(delegate_id);
CREATE INDEX IF NOT EXISTS idx_sheets_type ON public.sheets(sheet_type);
CREATE INDEX IF NOT EXISTS idx_sheets_created ON public.sheets(created_at DESC);