-- جدول الشحنات (لعرض شحنات المندوب)
CREATE TABLE shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT NOT NULL UNIQUE,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_city TEXT NOT NULL DEFAULT 'القاهرة',
  recipient_area TEXT DEFAULT NULL,
  cod_amount NUMERIC(10, 2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'transit', 'delivered', 'delayed', 'returned')),
  delegate_id UUID REFERENCES delegates(id) ON DELETE SET NULL,
  shipper_id UUID REFERENCES shippers(id) ON DELETE SET NULL,
  notes TEXT DEFAULT NULL,
  return_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- فهارس لتحسين الأداء
CREATE INDEX idx_shipments_delegate_id ON shipments(delegate_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_created_at ON shipments(created_at DESC);