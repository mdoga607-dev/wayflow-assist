CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    delegate_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date DATE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل الحماية
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- سياسة تسمح للمديرين برؤية وإضافة كل المهام
CREATE POLICY "Managers can manage all tasks" 
ON public.tasks FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('manager', 'head_manager')));

-- سياسة تسمح للمندوب برؤية مهامه فقط
CREATE POLICY "Delegates can view their tasks" 
ON public.tasks FOR SELECT 
TO authenticated 
USING (auth.uid() = delegate_id);