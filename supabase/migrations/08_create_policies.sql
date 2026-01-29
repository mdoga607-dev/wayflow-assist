-- ========================================
-- سياسات الوصول لجميع الجداول
-- ========================================

-- جدول الملفات الشخصية
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Head managers can view all profiles" ON public.profiles;
CREATE POLICY "Head managers can view all profiles" 
  ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'head_manager'));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- جدول الرتب
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" 
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Head managers can view all roles" ON public.user_roles;
CREATE POLICY "Head managers can view all roles" 
  ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'head_manager'));

DROP POLICY IF EXISTS "Head managers can manage roles" ON public.user_roles;
CREATE POLICY "Head managers can manage roles" 
  ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'head_manager'));

-- جدول المتاجر
DROP POLICY IF EXISTS "Head managers can manage stores" ON public.stores;
CREATE POLICY "Head managers can manage stores" 
  ON public.stores FOR ALL USING (public.has_role(auth.uid(), 'head_manager'));

DROP POLICY IF EXISTS "Users can view stores" ON public.stores;
CREATE POLICY "Users can view stores" 
  ON public.stores FOR SELECT USING (auth.uid() IS NOT NULL);

-- جدول التجار
DROP POLICY IF EXISTS "Head managers can manage shippers" ON public.shippers;
CREATE POLICY "Head managers can manage shippers" 
  ON public.shippers FOR ALL USING (public.has_role(auth.uid(), 'head_manager'));

DROP POLICY IF EXISTS "Users can view shippers" ON public.shippers;
CREATE POLICY "Users can view shippers" 
  ON public.shippers FOR SELECT USING (auth.uid() IS NOT NULL);

-- جدول المناديب
DROP POLICY IF EXISTS "Head managers can manage delegates" ON public.delegates;
CREATE POLICY "Head managers can manage delegates" 
  ON public.delegates FOR ALL USING (public.has_role(auth.uid(), 'head_manager'));

DROP POLICY IF EXISTS "Delegates can view own record" ON public.delegates;
CREATE POLICY "Delegates can view own record" 
  ON public.delegates FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'head_manager'));

-- جدول الشيتات
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.sheets;
CREATE POLICY "Enable read access for authenticated users" 
  ON public.sheets FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.sheets;
CREATE POLICY "Enable insert for authenticated users" 
  ON public.sheets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for head managers" ON public.sheets;
CREATE POLICY "Enable delete for head managers" 
  ON public.sheets FOR DELETE USING (public.has_role(auth.uid(), 'head_manager'));

-- جدول الشحنات
DROP POLICY IF EXISTS "Head managers can manage all shipments" ON public.shipments;
CREATE POLICY "Head managers can manage all shipments" 
  ON public.shipments FOR ALL USING (public.has_role(auth.uid(), 'head_manager'));

DROP POLICY IF EXISTS "Users can view shipments" ON public.shipments;
CREATE POLICY "Users can view shipments" 
  ON public.shipments FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Guests can view shipments by tracking number" ON public.shipments;
CREATE POLICY "Guests can view shipments by tracking number" 
  ON public.shipments FOR SELECT USING (true);

-- جدول العمليات المالية
DROP POLICY IF EXISTS "Head managers can manage balance transactions" ON public.balance_transactions;
CREATE POLICY "Head managers can manage balance transactions"
  ON public.balance_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'head_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'head_manager'));

DROP POLICY IF EXISTS "Managers can view balance transactions" ON public.balance_transactions;
CREATE POLICY "Managers can view balance transactions"
  ON public.balance_transactions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'manager') OR 
    public.has_role(auth.uid(), 'head_manager')
  );