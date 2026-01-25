-- Create shippers table (التجار/الراسلين)
CREATE TABLE public.shippers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create delegates table (المناديب)
CREATE TABLE public.delegates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  branch TEXT,
  city TEXT,
  avatar_url TEXT,
  total_delivered INTEGER DEFAULT 0,
  total_delayed INTEGER DEFAULT 0,
  total_returned INTEGER DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  commission_due DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT NOT NULL UNIQUE,
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
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

-- Enable RLS
ALTER TABLE public.shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shippers
CREATE POLICY "Head managers can manage shippers"
  ON public.shippers FOR ALL
  USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Users can view shippers"
  ON public.shippers FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for delegates
CREATE POLICY "Head managers can manage delegates"
  ON public.delegates FOR ALL
  USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Users can view delegates"
  ON public.delegates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Delegates can view own record"
  ON public.delegates FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for shipments
CREATE POLICY "Head managers can manage all shipments"
  ON public.shipments FOR ALL
  USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Users can view shipments"
  ON public.shipments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Guests can view shipments by tracking number"
  ON public.shipments FOR SELECT
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_shippers_updated_at
  BEFORE UPDATE ON public.shippers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delegates_updated_at
  BEFORE UPDATE ON public.delegates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for shipments
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;

-- Create indexes for better performance
CREATE INDEX idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_shipper ON public.shipments(shipper_id);
CREATE INDEX idx_shipments_delegate ON public.shipments(delegate_id);
CREATE INDEX idx_shipments_created ON public.shipments(created_at DESC);