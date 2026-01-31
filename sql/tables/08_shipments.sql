-- ========================================
-- جدول الشحنات (القلب الرئيسي للنظام)
-- ========================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE,
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
  sheet_id UUID REFERENCES public.sheets(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_city TEXT NOT NULL,
  recipient_area TEXT,
  product_name TEXT,
  cod_amount DECIMAL(12,2) DEFAULT 0 CHECK (cod_amount >= 0),
  shipping_fee DECIMAL(12,2) DEFAULT 0 CHECK (shipping_fee >= 0),
  weight DECIMAL(8,2),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'transit', 'out_for_delivery', 'delivered', 'delayed', 'returned', 'cancelled', 'partial_return')),
  return_reason TEXT,
  pickup_requested BOOLEAN DEFAULT false,
  pickup_address TEXT,
  pickup_time TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  returned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_delegate ON public.shipments(delegate_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper ON public.shipments(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipments_area ON public.shipments(area_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created ON public.shipments(created_at DESC);