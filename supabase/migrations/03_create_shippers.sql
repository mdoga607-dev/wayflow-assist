-- ========================================
-- إنشاء جدول التجار
-- ========================================
CREATE TABLE IF NOT EXISTS public.shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  branch TEXT,
  logo_url TEXT,
  total_shipments INTEGER DEFAULT 0,
  active_shipments INTEGER DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.shippers ENABLE ROW LEVEL SECURITY;

-- Trigger لتحديث التاريخ
DROP TRIGGER IF EXISTS update_shippers_updated_at ON public.shippers;
CREATE TRIGGER update_shippers_updated_at
  BEFORE UPDATE ON public.shippers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_shippers_status ON public.shippers(status);
CREATE INDEX IF NOT EXISTS idx_shippers_name ON public.shippers(name);
CREATE INDEX IF NOT EXISTS idx_shippers_city ON public.shippers(city);