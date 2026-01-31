CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  phone TEXT,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_casual BOOLEAN DEFAULT false,
  central_branch BOOLEAN DEFAULT false,
  operating_days JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);