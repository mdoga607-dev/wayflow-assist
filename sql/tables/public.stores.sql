-- إنشاء جدول المتاجر إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  manager_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_stores_city ON public.stores(city);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_name ON public.stores(name);

-- تفعيل سياسات الأمان
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: المديرين فقط
CREATE POLICY "Enable read for managers" 
  ON public.stores FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

-- سياسة الإدخال: المديرين فقط
CREATE POLICY "Enable insert for managers" 
  ON public.stores FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

-- سياسة التحديث: المديرين فقط
CREATE POLICY "Enable update for managers" 
  ON public.stores FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

-- سياسة الحذف: المديرين فقط
CREATE POLICY "Enable delete for managers" 
  ON public.stores FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

-- إدخال بيانات مصرية حقيقية للمتاجر
INSERT INTO public.stores (name, city, address, phone, manager_name, status) 
VALUES 
  ('فرع القاهرة الرئيسي', 'القاهرة', 'شارع التسعين، التجمع الخامس، القاهرة الجديدة', '01001234567', 'أحمد محمد', 'active'),
  ('فرع المهندسين', 'القاهرة', 'شارع جامعة الدول العربية، المهندسين', '01002345678', 'محمد سيد', 'active'),
  ('فرع المعادي', 'القاهرة', 'شارع 90، المعادي الجديدة', '01003456789', 'خالد أحمد', 'active'),
  ('فرع مدينة نصر', 'القاهرة', 'شارع مكرم عبيد، مدينة نصر', '01004567890', 'محمود فؤاد', 'active'),
  ('فرع الجيزة', 'الجيزة', 'شارع السودان، المهندسين، الجيزة', '01005678901', 'إسلام محمد', 'active'),
  ('فرع الإسكندرية', 'الإسكندرية', 'شارع فلسطين، سموحة، الإسكندرية', '01006789012', 'مصطفى عبد العزيز', 'active'),
  ('فرع سموحة', 'الإسكندرية', 'كورنيش الإسكندرية، سموحة', '01007890123', 'عمرو سيد', 'active'),
  ('فرع الدقي', 'الجيزة', 'شارع الهرم، الدقي', '01008901234', 'وائل محمد', 'active'),
  ('فرع التجمع الأول', 'القاهرة', 'أمام الجامعة الأمريكية، التجمع الأول', '01009012345', 'إسلام خالد', 'active'),
  ('فرع المعادي القديمة', 'القاهرة', 'شارع النصر، المعادي القديمة', '01010123456', 'أحمد علي', 'active'),
  ('فرع الشروق', 'القاهرة', 'مدينة الشروق، الحي الخامس', '01011234567', 'محمد عبد الرحمن', 'active'),
  ('فرع 6 أكتوبر', 'الجيزة', 'حي الشيخ زايد، 6 أكتوبر', '01012345678', 'خالد سعيد', 'active'),
  ('فرع الإسكندرية سيدي جابر', 'الإسكندرية', 'سيدي جابر، الإسكندرية', '01013456789', 'محمود كامل', 'active'),
  ('فرع الإسكندرية لوران', 'الإسكندرية', 'شارع لوران، الإسكندرية', '01014567890', 'سامي عبد الفتاح', 'active'),
  ('فرع الإسكندرية سبورتنج', 'الإسكندرية', 'سبورتنج، الإسكندرية', '01015678901', 'إسلام علي', 'active'),
  ('فرع الإسكندرية زيزينيا', 'الإسكندرية', 'زيزينيا، الإسكندرية', '01016789012', 'مصطفى أحمد', 'active'),
  ('فرع المنصورة', 'الدقهلية', 'شارع الجمهورية، المنصورة', '01017890123', 'أحمد عبد العزيز', 'active'),
  ('فرع طنطا', 'الغربية', 'شارع البحر، طنطا', '01018901234', 'محمد فتحي', 'active'),
  ('فرع الزقازيق', 'الشرقية', 'شارع عبد الحليم محمود، الزقازيق', '01019012345', 'خالد إبراهيم', 'active'),
  ('فرع دمياط', 'دمياط', 'شارع النيل، دمياط', '01020123456', 'محمود سيد', 'active'),
  ('فرع بورسعيد', 'بورسعيد', 'شارع الجيش، بورسعيد', '01021234567', 'إسلام محمد', 'active'),
  ('فرع السويس', 'السويس', 'شارع النصر، السويس', '01022345678', 'أحمد سعيد', 'active'),
  ('فرع الإسماعيلية', 'الإسماعيلية', 'شارع محمد علي، الإسماعيلية', '01023456789', 'محمد عبد الله', 'active'),
  ('فرع أسوان', 'أسوان', 'شارع النيل، أسوان', '01024567890', 'خالد محمود', 'inactive'),
  ('فرع الأقصر', 'الأقصر', 'شارع المحطة، الأقصر', '01025678901', 'محمود أحمد', 'inactive')
ON CONFLICT DO NOTHING;