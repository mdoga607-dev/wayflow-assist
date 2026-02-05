/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/areas/AddAreaPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  MapPin, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Users,
  TrendingUp
} from 'lucide-react';

interface Governorate {
  id: string;
  name: string;
}

const AddAreaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const governorateId = searchParams.get('governorate');
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loadingGovernorates, setLoadingGovernorates] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    governorate_id: governorateId || '',
    coverage_rate: '90',
    couriers_count: '10',
    status: 'active'
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإضافة مناطق جديدة",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب المحافظات
  useEffect(() => {
    const fetchGovernorates = async () => {
      try {
        setLoadingGovernorates(true);
        
        const {  data, error } = await supabase
          .from('governorates')
          .select('id, name')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        
        setGovernorates(data || []);
        
        // إذا كانت هناك محافظة محددة في الرابط، اضبطها تلقائياً
        if (governorateId && data?.some(g => g.id === governorateId)) {
          setFormData(prev => ({ ...prev, governorate_id: governorateId }));
        } else if (data && data.length > 0) {
          // اضبط أول محافظة افتراضياً
          setFormData(prev => ({ ...prev, governorate_id: data[0].id }));
        }
      } catch (error: any) {
        console.error('Error fetching governorates:', error);
        toast({
          title: "فشل التحميل",
          description: error.message || "حدث خطأ أثناء تحميل قائمة المحافظات. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      } finally {
        setLoadingGovernorates(false);
      }
    };

    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchGovernorates();
    }
  }, [authLoading, role, governorateId]);

  // التحقق من صحة النموذج
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم المنطقة",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.name.length < 2) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم المنطقة يجب أن يكون على الأقل حرفين",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.governorate_id) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار المحافظة",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.coverage_rate && (isNaN(Number(formData.coverage_rate)) || Number(formData.coverage_rate) < 0 || Number(formData.coverage_rate) > 100)) {
      toast({
        title: "خطأ في البيانات",
        description: "معدل التغطية يجب أن يكون بين 0 و 100",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.couriers_count && isNaN(Number(formData.couriers_count))) {
      toast({
        title: "خطأ في البيانات",
        description: "عدد المناديب يجب أن يكون رقماً",
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
        .from('areas')
        .insert([{
          name: formData.name.trim(),
          governorate_id: formData.governorate_id,
          coverage_rate: Number(formData.coverage_rate),
          couriers_count: Number(formData.couriers_count),
          status: formData.status,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة منطقة "${formData.name}" بنجاح إلى النظام`
      });
      
      // الانتقال إلى صفحة المناطق بعد ثانيتين
      setTimeout(() => {
        navigate(`/app/areas?governorate=${formData.governorate_id}`);
      }, 2000);
    } catch (error: any) {
      console.error('Error adding area:', error);
      
      if (error.code === '23505') {
        toast({
          title: "المنطقة موجودة مسبقاً",
          description: "توجد منطقة بنفس الاسم في نفس المحافظة. يرجى اختيار اسم فريد.",
          variant: "destructive"
        });
      } else if (error.code === '23503') {
        toast({
          title: "خطأ في البيانات",
          description: "المحافظة المحددة غير موجودة. يرجى اختيار محافظة صالحة.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل الإضافة",
          description: error.message || "حدث خطأ أثناء إضافة المنطقة. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingGovernorates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // الحصول على اسم المحافظة المحددة
  const selectedGovernorate = governorates.find(g => g.id === formData.governorate_id)?.name || 'غير معروف';

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            إضافة منطقة جديدة
          </h1>
          <p className="text-gray-600 mt-1">
            أدخل بيانات المنطقة الجديدة لإضافتها إلى نظام التغطية الجغرافية
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="gap-2 border-gray-300 hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          إلغاء
        </Button>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ملاحظات هامة قبل الإضافة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>المنطقة هي وحدة جغرافية أصغر من المحافظة (مثل: مدينة، مركز، حي)</li>
                <li>معدل التغطية يشير إلى نسبة التغطية الجغرافية للمنطقة (95%+ ممتاز)</li>
                <li>عدد المناديب هو العدد الموصى به لتغطية هذه المنطقة</li>
                <li>يمكنك تعديل أي معلومة لاحقاً من صفحة تعديل المنطقة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نموذج الإضافة */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-700" />
              بيانات المنطقة
            </CardTitle>
            <CardDescription>
              أدخل تفاصيل المنطقة التي تريد إضافتها إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اسم المنطقة والمحافظة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-800 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    اسم المنطقة <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: مدينة نصر، المعادي، شبرا"
                    required
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    الاسم الرسمي للمنطقة كما هو معروف
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="governorate_id" className="text-gray-800 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    المحافظة <span className="text-red-600">*</span>
                  </Label>
                  <Select 
                    value={formData.governorate_id} 
                    onValueChange={(value) => setFormData({ ...formData, governorate_id: value })}
                    required
                    disabled={!!governorateId}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="اختر المحافظة" />
                    </SelectTrigger>
                    <SelectContent>
                      {governorates.map((governorate) => (
                        <SelectItem key={governorate.id} value={governorate.id}>
                          {governorate.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {governorateId ? (
                      <span className="font-medium text-blue-700">محدد مسبقاً: {selectedGovernorate}</span>
                    ) : (
                      "اختر المحافظة التي تتبع لها هذه المنطقة"
                    )}
                  </p>
                </div>
              </div>

              {/* معدل التغطية وعدد المناديب */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="coverage_rate" className="text-gray-800 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                    معدل التغطية (%)
                  </Label>
                  <Input
                    id="coverage_rate"
                    type="number"
                    value={formData.coverage_rate}
                    onChange={(e) => setFormData({ ...formData, coverage_rate: e.target.value })}
                    placeholder="مثال: 95"
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    نسبة التغطية الجغرافية المتوقعة لهذه المنطقة
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="couriers_count" className="text-gray-800 flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-600" />
                    عدد المناديب
                  </Label>
                  <Input
                    id="couriers_count"
                    type="number"
                    value={formData.couriers_count}
                    onChange={(e) => setFormData({ ...formData, couriers_count: e.target.value })}
                    placeholder="مثال: 10"
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    min="1"
                    step="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    العدد الموصى به من المناديب لتغطية هذه المنطقة
                  </p>
                </div>
              </div>

              {/* الحالة */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-800">
                  الحالة
                </Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        نشط
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        غير نشط
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  المناطق غير النشطة لن تظهر في قوائم التعيين التلقائي
                </p>
              </div>

              {/* أزرار الإرسال */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      إضافة المنطقة
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* معلومات إرشادية */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-700" />
              معلومات إرشادية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2 text-blue-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">أمثلة على المناطق:</p>
                  <ul className="text-xs mt-1 space-y-0.5 pr-4 list-disc">
                    <li>القاهرة: مدينة نصر، المعادي، المهندسين</li>
                    <li>القليوبية: بنها، شبرا الخيمة، طوخ</li>
                    <li>المنوفية: شبين الكوم، قويسنا، أشمون</li>
                  </ul>
                  <p className="text-xs mt-2">
                    <span className="font-medium">ملاحظة:</span> استخدم الأسماء الرسمية للمناطق كما هي معروفة محلياً
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">معدل التغطية الموصى به</span>
                </div>
                <span className="text-sm font-bold text-green-900">90%+</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-800">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">متوسط المناديب</span>
                </div>
                <span className="text-sm font-bold text-purple-900">5-15 مندوب</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">المناطق لكل محافظة</span>
                </div>
                <span className="text-sm font-bold text-yellow-900">20-50 منطقة</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-xs text-gray-700 font-medium mb-2">نصائح هامة:</p>
              <ul className="text-xs text-gray-600 space-y-1 pr-3">
                <li>• استخدم أسماء المناطق الرسمية كما هي معروفة محلياً</li>
                <li>• حدد معدل تغطية واقعي بناءً على كثافة السكان والبنية التحتية</li>
                <li>• راعي حجم المنطقة عند تحديد عدد المناديب</li>
                <li>• راجع البيانات جيداً قبل الحفظ لتجنب الأخطاء</li>
              </ul>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2 text-red-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  <span className="font-medium">تنبيه:</span> المنطقة التي تضيفها ستكون مرتبطة بالمحافظة المحددة ولن يمكن تغيير المحافظة لاحقاً. تأكد من اختيار المحافظة الصحيحة.
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
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">مراجعة المنطقة</p>
              <p className="text-sm text-gray-600 mt-1">
                ستظهر المنطقة الجديدة في قائمة المناطق التابعة لمحافظتها
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">تعيين المناديب</p>
              <p className="text-sm text-gray-600 mt-1">
                قم بتعيين المناديب للمنطقة الجديدة من صفحة إدارة المناديب
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">اختبار التغطية</p>
              <p className="text-sm text-gray-600 mt-1">
                قم بإنشاء شحنة تجريبية للمنطقة الجديدة للتأكد من التغطية
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">تحسين الأداء</p>
              <p className="text-sm text-gray-600 mt-1">
                راقب أداء المنطقة وقم بتعديل عدد المناديب أو معدل التغطية حسب الحاجة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddAreaPage;