CREATE TABLE IF NOT EXISTS public.delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  branch TEXT,
  city TEXT NOT NULL,
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