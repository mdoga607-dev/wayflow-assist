/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/inventory/AddInventoryPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Calendar, 
  Plus, 
  X, 
  Loader2, 
  AlertCircle, 
  Database, 
  MapPin, 
  Info,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Branch {
  id: string;
  name: string;
  city: string;
}

const AddInventoryPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    branch_id: '',
    inventory_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإضافة عمليات جرد",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب الفروع النشطة
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        
        const { data: branchesData, error } = await supabase
          .from('branches')
          .select('id, name, city')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        
        setBranches(branchesData || []);
      } catch (error: any) {
        console.error('Error fetching branches:', error);
        toast({
          title: "فشل التحميل",
          description: "حدث خطأ أثناء تحميل قائمة الفروع. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      } finally {
        setLoadingBranches(false);
      }
    };

    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchBranches();
    }
  }, [authLoading, role]);

  // التحقق من صحة النموذج
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم عملية الجرد",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.name.length < 3) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم عملية الجرد يجب أن يكون على الأقل 3 أحرف",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.branch_id) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار الفرع المراد جرده",
        variant: "destructive"
      });
      return false;
    }
    
    if (new Date(formData.inventory_date) < new Date(new Date().setDate(new Date().getDate() - 1))) {
      toast({
        title: "خطأ في التاريخ",
        description: "تاريخ الجرد لا يمكن أن يكون قبل الأمس",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // معالجة الإرسال
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('inventory')
        .insert([{
          name: formData.name.trim(),
          branch_id: formData.branch_id,
          inventory_date: formData.inventory_date,
          notes: formData.notes.trim() || null,
          status: 'pending',
          total_items: 0,
          counted_items: 0,
          discrepancy: 0,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة عملية الجرد "${formData.name}" بنجاح`
      });
      
      // الانتقال إلى صفحة الجرد الرئيسية بعد ثانيتين
      setTimeout(() => {
        navigate('/app/inventory');
      }, 2000);
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      
      if (error.code === '23503') {
        toast({
          title: "خطأ في البيانات",
          description: "الفرع المحدد غير موجود. يرجى اختيار فرع صالح.",
          variant: "destructive"
        });
      } else if (error.code === '23505') {
        toast({
          title: "العملية موجودة مسبقاً",
          description: "توجد عملية جرد بنفس الاسم. يرجى اختيار اسم فريد.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل الإضافة",
          description: error.message || "حدث خطأ أثناء إضافة عملية الجرد. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingBranches) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-purple-600" />
            إضافة عملية جرد جديدة
          </h1>
          <p className="text-gray-600 mt-1">
            أنشئ عملية جرد جديدة لجرد الشحنات في أحد الفروع
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/inventory')}
          className="gap-2 border-gray-300 hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          إلغاء
        </Button>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
            <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-800">
              <p className="font-medium">ملاحظات هامة قبل الإضافة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>عملية الجرد ستكون في حالة "مجدول" حتى يتم بدء تنفيذها</li>
                <li>يمكنك تحديد تاريخ الجرد (اليوم أو غداً أو تاريخ لاحق)</li>
                <li>تأكد من اختيار الفرع الصحيح لتجنب الالتباس لاحقاً</li>
                <li>أضف ملاحظات توضيحية لمساعدة الفريق على فهم طبيعة الجرد</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نموذج الإضافة */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Plus className="h-5 w-5 text-gray-700" />
              بيانات عملية الجرد
            </CardTitle>
            <CardDescription>
              أدخل تفاصيل عملية الجرد التي تريد إضافتها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اسم عملية الجرد والتاريخ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-800 flex items-center gap-1">
                    <Database className="h-4 w-4 text-gray-600" />
                    اسم عملية الجرد <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: جرد يناير 2026 - فرع القاهرة"
                    required
                    className="bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    اختر اسماً واضحاً يصف عملية الجرد لتسهيل التعرف عليها لاحقاً
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inventory_date" className="text-gray-800 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    تاريخ الجرد <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="inventory_date"
                    type="date"
                    value={formData.inventory_date}
                    onChange={(e) => setFormData({ ...formData, inventory_date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    حدد التاريخ الذي سيتم فيه تنفيذ عملية الجرد
                  </p>
                </div>
              </div>

              {/* اختيار الفرع والملاحظات */}
              <div className="space-y-2">
                <Label htmlFor="branch_id" className="text-gray-800 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  الفرع المراد جرده <span className="text-red-600">*</span>
                </Label>
                <Select 
                  value={formData.branch_id} 
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  required
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-purple-600 flex-shrink-0" />
                          <span>{branch.name}</span>
                          <span className="text-xs text-gray-500">({branch.city})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  اختر الفرع الذي سيتم جرد شحناته
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-800">
                  ملاحظات (اختياري)
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أضف أي ملاحظات أو تعليمات إضافية للفريق..."
                  rows={4}
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {formData.notes.length}/500
                </p>
              </div>

              {/* أزرار الإرسال */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/app/inventory')}
                  disabled={loading}
                  className="border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      إضافة عملية الجرد
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-700" />
              معلومات إرشادية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-start gap-2 text-purple-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">خطوات عملية الجرد:</p>
                  <ol className="text-xs mt-1 space-y-1 pr-4 list-decimal">
                    <li>إنشاء عملية جرد جديدة (هذه الصفحة)</li>
                    <li>بدء عملية الجرد من صفحة العمليات</li>
                    <li>عد الشحنات وتسجيل النتائج</li>
                    <li>إنهاء الجرد ومراجعة النتائج</li>
                    <li>تصدير التقرير النهائي</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">الشحنات المتوقعة</span>
                </div>
                <span className="text-sm font-bold text-green-900">تلقائي</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">الجرد التلقائي</span>
                </div>
                <span className="text-sm font-bold text-blue-900">متوفر</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">التاريخ المرن</span>
                </div>
                <span className="text-sm font-bold text-yellow-900">مدعوم</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-xs text-gray-700 font-medium mb-2">نصائح هامة:</p>
              <ul className="text-xs text-gray-600 space-y-1 pr-3">
                <li>• خطط لعملية الجرد قبل 24 ساعة على الأقل</li>
                <li>• أخبر الفريق المعني بموعد الجرد مسبقاً</li>
                <li>• تأكد من توفر جميع السجلات قبل البدء</li>
                <li>• خصص وقتاً كافياً لتجنب التسرع</li>
              </ul>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2 text-red-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  <span className="font-medium">تنبيه:</span> لا يمكن تعديل الفرع بعد إنشاء عملية الجرد. تأكد من اختيار الفرع الصحيح قبل الحفظ.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* خطوات بعد الإضافة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Info className="h-5 w-5 text-gray-700" />
            الخطوات التالية بعد الإضافة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">مراجعة العملية</p>
              <p className="text-sm text-gray-600 mt-1">
                ستظهر عملية الجرد الجديدة في قائمة العمليات بحالة "مجدول"
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">بدء الجرد</p>
              <p className="text-sm text-gray-600 mt-1">
                عند حلول موعد الجرد، اضغط على "بدء الجرد" لتحويل الحالة إلى "قيد التنفيذ"
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">تسجيل النتائج</p>
              <p className="text-sm text-gray-600 mt-1">
                قم بعد الشحنات وتسجيل النتائج في النظام مع الإشارة لأي اختلافات
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">إنهاء الجرد</p>
              <p className="text-sm text-gray-600 mt-1">
                بعد الانتهاء من العد، أنهِ عملية الجرد لعرض التقرير النهائي وتصديره
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddInventoryPage;