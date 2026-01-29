-- ========================================
-- إنشاء جدول المتاجر بدون الحاجة لدالة خارجية
-- ========================================
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Trigger لتحديث التاريخ (بدون دالة خارجية)
DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION (
    SELECT public.update_updated_at_column()
    WHERE EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    )
    OR (
      NEW.updated_at := NOW(),
      TRUE
    )
  );

-- فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_name ON public.stores(name);