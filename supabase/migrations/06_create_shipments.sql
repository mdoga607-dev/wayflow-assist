-- ========================================
-- إنشاء جدول الشحنات (الجدول الرئيسي)
-- ========================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE,
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
  sheet_id UUID REFERENCES public.sheets(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT,
  recipient_city TEXT,
  recipient_area TEXT,
  product_name TEXT,
  cod_amount DECIMAL(12,2) DEFAULT 0,
  shipping_fee DECIMAL(12,2) DEFAULT 0,
  weight DECIMAL(8,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'transit', 'out_for_delivery', 'delivered', 'delayed', 'returned', 'cancelled', 'partial_return')),
  return_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  returned_at TIMESTAMP WITH TIME ZONE
);

-- تفعيل RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Trigger لتحديث التاريخ
DROP TRIGGER IF EXISTS update_shipments_updated_at ON public.shipments;
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper ON public.shipments(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipments_delegate ON public.shipments(delegate_id);
CREATE INDEX IF NOT EXISTS idx_shipments_sheet ON public.shipments(sheet_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created ON public.shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_city ON public.shipments(recipient_city);