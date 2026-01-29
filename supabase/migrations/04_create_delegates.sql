-- ========================================
-- إنشاء جدول المناديب
-- ========================================
CREATE TABLE IF NOT EXISTS public.delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  branch TEXT,
  city TEXT,
  avatar_url TEXT,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  total_delivered INTEGER DEFAULT 0,
  total_delayed INTEGER DEFAULT 0,
  total_returned INTEGER DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  commission_due DECIMAL(12,2) DEFAULT 0,
  courier_limit INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.delegates ENABLE ROW LEVEL SECURITY;

-- Trigger لتحديث التاريخ
DROP TRIGGER IF EXISTS update_delegates_updated_at ON public.delegates;
CREATE TRIGGER update_delegates_updated_at
  BEFORE UPDATE ON public.delegates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_delegates_status ON public.delegates(status);
CREATE INDEX IF NOT EXISTS idx_delegates_store ON public.delegates(store_id);
CREATE INDEX IF NOT EXISTS idx_delegates_city ON public.delegates(city);
CREATE INDEX IF NOT EXISTS idx_delegates_name ON public.delegates(name);