/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/areas/DivideAreasPage.tsx
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
  CardDescription,
  CardFooter
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
  Textarea 
} from '@/components/ui/textarea';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  MapPin, 
  LayoutGrid,
  Building2, 
  Home, 
  Save, 
  RefreshCcw, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Info,
  Users,
  Truck,
  Plus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// هيكل بيانات المحافظة
interface Governorate {
  id: string;
  name: string;
  name_en: string;
  code: string;
}

// هيكل بيانات المنطقة
interface Area {
  id?: string;
  name: string;
  arabic_name: string;
  governorate_id: string;
  area_type: 'city' | 'center' | 'district' | 'village';
  coverage_rate: number;
  status: 'active' | 'inactive';
}

const DivideAreasPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState<Governorate | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [centers, setCenters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (authLoading) return;

    if (!role || !['head_manager', 'manager'].includes(role)) {
      toast({
        title: 'غير مصرح',
        description: 'ماعندكش الصلاحية تقسم المناطق',
        variant: 'destructive',
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب المحافظات الثلاث الرئيسية
  useEffect(() => {
    const fetchGovernorates = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('governorates')
          .select('id, name, name_en, code')
          .in('name', ['القاهرة', 'القليوبية', 'المنوفية'])
          .order('name');

        if (error) throw error;

        setGovernorates(data || []);
        
        // اختيار القاهرة افتراضياً إذا وجدت
        if (data && data.length > 0) {
          setSelectedGovernorate(data[0]);
          fetchAreasForGovernorate(data[0]);
        }
      } catch (err: any) {
        console.error('خطأ في جلب المحافظات:', err);
        setError('فشل تحميل قائمة المحافظات. يرجى المحاولة مرة تانية.');
        toast({
          title: 'فشل التحميل',
          description: 'مفيش محافظات متاحة دلوقتي. راجع اتصال الإنترنت.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchGovernorates();
    }
  }, [authLoading, role]);

  // جلب المناطق الحالية للمحافظة المختارة
  const fetchAreasForGovernorate = async (governorate: Governorate) => {
    try {
      setLoading(true);
      setError(null);

      // جلب المدن
      const { data: citiesData, error: citiesError } = await supabase
        .from('areas')
        .select('arabic_name')
        .eq('governorate_id', governorate.id)
        .eq('area_type', 'city')
        .order('arabic_name');

      if (citiesError) throw citiesError;

      // جلب المراكز
      const { data: centersData, error: centersError } = await supabase
        .from('areas')
        .select('arabic_name')
        .eq('governorate_id', governorate.id)
        .eq('area_type', 'center')
        .order('arabic_name');

      if (centersError) throw centersError;

      // تعيين البيانات
      setCities(citiesData.map(a => a.arabic_name) || []);
      setCenters(centersData.map(a => a.arabic_name) || []);
      
      toast({
        title: 'تم التحميل',
        description: `تم تحميل ${citiesData.length} مدينة و ${centersData.length} مركز لمحافظة ${governorate.name}`,
      });
    } catch (err: any) {
      console.error('خطأ في جلب المناطق:', err);
      setError('فشل تحميل المناطق. يرجى المحاولة مرة تانية.');
      toast({
        title: 'فشل التحميل',
        description: 'مفيش بيانات متاحة للمحافظة دي. حاول تاني بعد شوية.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // معالجة تغيير المحافظة المختارة
  const handleGovernorateChange = (governorateId: string) => {
    const governorate = governorates.find(g => g.id === governorateId);
    if (governorate) {
      setSelectedGovernorate(governorate);
      fetchAreasForGovernorate(governorate);
      setError(null);
      setSuccess(false);
    }
  };

  // معالجة إضافة مدينة جديدة
  const handleAddCity = () => {
    const newCity = prompt('أدخل اسم المدينة الجديدة:');
    if (newCity && newCity.trim() && !cities.includes(newCity.trim())) {
      setCities([...cities, newCity.trim()]);
      toast({
        title: 'تمت الإضافة',
        description: `تمت إضافة مدينة "${newCity.trim()}" بنجاح`,
      });
    } else if (newCity && cities.includes(newCity.trim())) {
      toast({
        title: 'موجودة مسبقاً',
        description: 'المدينة دي موجودة في القائمة بالفعل',
        variant: 'destructive',
      });
    }
  };

  // معالجة إضافة مركز جديد
  const handleAddCenter = () => {
    const newCenter = prompt('أدخل اسم المركز الجديد:');
    if (newCenter && newCenter.trim() && !centers.includes(newCenter.trim())) {
      setCenters([...centers, newCenter.trim()]);
      toast({
        title: 'تمت الإضافة',
        description: `تمت إضافة مركز "${newCenter.trim()}" بنجاح`,
      });
    } else if (newCenter && centers.includes(newCenter.trim())) {
      toast({
        title: 'موجود مسبقاً',
        description: 'المركز ده موجود في القائمة بالفعل',
        variant: 'destructive',
      });
    }
  };

  // معالجة الحذف (مدينة أو مركز)
  const handleDeleteItem = (type: 'city' | 'center', index: number) => {
    if (type === 'city') {
      const newCities = cities.filter((_, i) => i !== index);
      setCities(newCities);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المدينة بنجاح',
      });
    } else {
      const newCenters = centers.filter((_, i) => i !== index);
      setCenters(newCenters);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المركز بنجاح',
      });
    }
  };

  // حفظ التقسيم الجديد
  const handleSaveDivision = async () => {
    if (!selectedGovernorate) {
      toast({
        title: 'خطأ',
        description: 'مفيش محافظة مختارة. اختر محافظة تاني.',
        variant: 'destructive',
      });
      return;
    }

    if (cities.length === 0 && centers.length === 0) {
      toast({
        title: 'خطأ',
        description: 'لازم تضيف على الأقل مدينة أو مركز واحد للمحافظة',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm(`هل أنت متأكد من حفظ تقسيم محافظة ${selectedGovernorate.name}؟\n\nهذا هيحذف كل المناطق الحالية ويضيف التقسيم الجديد.`)) {
      setSaving(true);
      setError(null);
      setSuccess(false);

      try {
        // الخطوة 1: حذف جميع المناطق الحالية لهذه المحافظة
        const { error: deleteError } = await supabase
          .from('areas')
          .delete()
          .eq('governorate_id', selectedGovernorate.id);

        if (deleteError) throw deleteError;

        // الخطوة 2: إنشاء مصفوفة بالمناطق الجديدة
        const newAreas: Omit<Area, 'id'>[] = [
          ...cities.map(city => ({
            name: city.trim().replace(/\s+/g, '_').toLowerCase(),
            arabic_name: city.trim(),
            governorate_id: selectedGovernorate.id,
            area_type: 'city' as const,
            coverage_rate: 90, // معدل تغطية افتراضي
            status: 'active' as const
          })),
          ...centers.map(center => ({
            name: center.trim().replace(/\s+/g, '_').toLowerCase(),
            arabic_name: center.trim(),
            governorate_id: selectedGovernorate.id,
            area_type: 'center' as const,
            coverage_rate: 85, // معدل تغطية افتراضي للمراكز
            status: 'active' as const
          }))
        ];

        // الخطوة 3: إدخال المناطق الجديدة
        const { error: insertError } = await supabase
          .from('areas')
          .insert(newAreas);

        if (insertError) throw insertError;

        setSuccess(true);
        toast({
          title: 'تم الحفظ بنجاح',
          description: `تم تقسيم محافظة ${selectedGovernorate.name} إلى ${cities.length} مدينة و ${centers.length} مركز`,
        });

        // إعادة تحميل البيانات بعد 1.5 ثانية
        setTimeout(() => {
          fetchAreasForGovernorate(selectedGovernorate);
        }, 1500);
      } catch (err: any) {
        console.error('خطأ في حفظ التقسيم:', err);
        setError(err.message || 'فشل حفظ تقسيم المحافظة. يرجى المحاولة مرة تانية.');
        toast({
          title: 'فشل الحفظ',
          description: 'حصل خطأ أثناء حفظ تقسيم المحافظة. راجع البيانات وحاول تاني.',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // إعادة تعيين البيانات إلى القيم الافتراضية للمحافظة
  const handleResetToDefaults = () => {
    if (!selectedGovernorate) return;

    if (window.confirm(`هل أنت متأكد من إعادة تقسيم محافظة ${selectedGovernorate.name} للقيم الافتراضية؟\n\nالبيانات الحالية هتتعدل.`)) {
      switch (selectedGovernorate.name) {
        case 'القاهرة':
          setCities(['الدقي', 'العجوزة', 'المهندسين', 'الزمالك', 'جاردن سيتي', 'وسط البلد', 'العتبة', 'باب الشعرية', 'السيدة زينب', 'الخليفة', 'الساحل', 'المرج', 'البساتين', 'الزاوية الحمراء', 'الزيتون', 'النزهة', 'مدينة نصر', 'مصر الجديدة', 'مصر القديمة', 'المعادي', 'المقطم', 'المنيل', 'المنيرة', 'الموسكي', 'الوايلي', 'حدائق القبة', 'حلوان', 'دار السلام', 'رمسيس', 'روض الفرج', 'شبرا', 'طرة', 'عابدين', 'عبود', 'عين شمس', 'قصر النيل', 'مدينة الشروق', 'مدينة بدر', 'الرحاب', 'القطامية', 'العاصمة الإدارية', 'الحلمية', 'العباسية', 'الخصوص', 'الشرابية', 'الظاهر', 'هليوبوليس', 'مليج']);
          setCenters(['شبرا', 'المرج', 'الساحل', 'السلام', 'الزاوية الحمراء', 'الخليفة', 'طرة', 'دار السلام']);
          break;
        case 'القليوبية':
          setCities(['بنها', 'شبرا الخيمة', 'قليوب', 'طوخ', 'كفر شكر', 'القناطر الخيرية', 'الخانكة', 'منية القمح', 'شبين القناطر', 'العبور']);
          setCenters(['طوخ', 'كفر شكر', 'القناطر الخيرية', 'الخانكة', 'منية القمح', 'شبين القناطر']);
          break;
        case 'المنوفية':
          setCities(['شبين الكوم', 'قويسنا', 'بركة السبع', 'تلا', 'أشمون', 'منوف', 'سرس الليان', 'الباجور', 'شبراخيت']);
          setCenters(['بركة السبع', 'تلا', 'أشمون', 'منوف', 'سرس الليان', 'الباجور', 'شبراخيت']);
          break;
        default:
          setCities([]);
          setCenters([]);
      }
      
      toast({
        title: 'تمت إعادة التعيين',
        description: `تمت إعادة تقسيم محافظة ${selectedGovernorate.name} للقيم الافتراضية`,
      });
    }
  };

  // حالة التحميل
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/20">
        <Card className="w-full max-w-md border-2 border-dashed border-primary/20">
          <CardContent className="pt-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري تحميل بيانات المحافظات...</h2>
            <p className="text-muted-foreground">برجاء الانتظار</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 py-6 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* رأس الصفحة */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
              <LayoutGrid className="h-8 w-8 text-primary" />
              تقسيم المحافظات إلى مدن ومراكز
            </h1>
            <p className="text-muted-foreground mt-1">
              قسم المحافظات الرئيسية (القاهرة، القليوبية، المنوفية) إلى مدن ومراكز لتحسين التغطية الجغرافية
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/app/areas/governorates')}
            className="gap-2 border-2 hover:bg-gray-100 text-lg px-6 py-5 shadow-sm hover:shadow-md transition-all"
          >
            <MapPin className="h-5 w-5" />
            رجوع لقائمة المحافظات
          </Button>
        </div>

        {/* ملاحظات هامة */}
        <Alert className="bg-blue-50/50 border-blue-200">
          <AlertTitle className="flex items-center gap-2 text-blue-800 font-bold">
            <Info className="h-4 w-4 flex-shrink-0" />
            ملاحظات هامة قبل التقسيم
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-blue-700 text-sm">
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>المحافظات المتاحة للتقسيم: القاهرة، القليوبية، المنوفية</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>المدينة (City): منطقة حضرية رئيسية ذات كثافة سكانية عالية وخدمات متكاملة</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>المركز (Center): منطقة ريفية أو شبه حضرية تضم عدة قرى وتتبع إدارياً للمحافظة</span>
            </p>
            <p className="flex items-start gap-2 bg-blue-100 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-800 mt-0.5 flex-shrink-0" />
              <span className="font-bold">تنبيه هام:</span> 
              <span>حفظ التقسيم الجديد هيحذف كل المناطق الحالية لهذه المحافظة ويستبدلها بالتقسيم الجديد. 
              تأكد من صحة البيانات قبل الحفظ.</span>
            </p>
          </AlertDescription>
        </Alert>

        {/* بطاقة اختيار المحافظة */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-blue-50/40">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-xl md:text-2xl flex items-center gap-3 text-gray-800 font-bold">
              <MapPin className="h-6 w-6 text-primary" />
              اختر المحافظة للتقسيم
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600">
              اختر المحافظة اللي عايز تقسمها لمدن ومراكز
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="max-w-md mx-auto">
              <Select 
                value={selectedGovernorate?.id || ''} 
                onValueChange={handleGovernorateChange}
                disabled={loading}
              >
                <SelectTrigger className="w-full h-14 text-lg font-medium border-2 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="اختر المحافظة..." />
                </SelectTrigger>
                <SelectContent>
                  {governorates.map((gov) => (
                    <SelectItem 
                      key={gov.id} 
                      value={gov.id}
                      className="cursor-pointer hover:bg-blue-50 text-lg"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-bold">{gov.name}</p>
                          <p className="text-sm text-gray-600">{gov.name_en} • {gov.code}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* بطاقة التقسيم (تظهر فقط عند اختيار محافظة) */}
        {selectedGovernorate && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* المدن */}
            <Card className="border-0 shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50/30 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-green-700" />
                    <CardTitle className="text-xl text-gray-800 font-bold">
                      المدن ({cities.length})
                    </CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddCity}
                    className="gap-1.5 h-8 text-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة مدينة
                  </Button>
                </div>
                <CardDescription className="mt-2 text-sm text-gray-600">
                  المدن الرئيسية في محافظة {selectedGovernorate.name} (مناطق حضرية رئيسية)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {cities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium mb-2">مفيش مدن</p>
                    <p className="max-w-md mx-auto">
                      اضغط على "إضافة مدينة" عشان تبدأ في تقسيم المحافظة
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {cities.map((city, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-800 truncate">{city}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem('city', index)}
                          className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* المراكز */}
            <Card className="border-0 shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50/30 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-amber-700" />
                    <CardTitle className="text-xl text-gray-800 font-bold">
                      المراكز ({centers.length})
                    </CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddCenter}
                    className="gap-1.5 h-8 text-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة مركز
                  </Button>
                </div>
                <CardDescription className="mt-2 text-sm text-gray-600">
                  المراكز التابعة لمحافظة {selectedGovernorate.name} (مناطق ريفية/شبه حضرية)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {centers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Home className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium mb-2">مفيش مراكز</p>
                    <p className="max-w-md mx-auto">
                      اضغط على "إضافة مركز" عشان تبدأ في تقسيم المحافظة
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {centers.map((center, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-800 truncate">{center}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem('center', index)}
                          className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* أزرار الحفظ وإعادة التعيين */}
        {selectedGovernorate && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">ملاحظة قبل الحفظ:</p>
                    <p className="mt-1">
                      عند الحفظ، كل المناطق الحالية لمحافظة {selectedGovernorate.name} 
                      هتتحذف وتتستبدل بالتقسيم الجديد. تأكد من صحة البيانات قبل الحفظ.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleResetToDefaults}
                    disabled={saving}
                    className="gap-2 h-11 px-6 text-base"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    إعادة تعيين للإفتراضي
                  </Button>
                  
                  <Button
                    onClick={handleSaveDivision}
                    disabled={saving || (cities.length === 0 && centers.length === 0)}
                    className="gap-2 h-11 px-8 text-base bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        حفظ التقسيم
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* رسالة النجاح */}
              {success && (
                <Alert className="mt-6 border-green-200 bg-green-50/50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">تم الحفظ بنجاح!</AlertTitle>
                  <AlertDescription className="text-green-700 mt-1">
                    تم تقسيم محافظة {selectedGovernorate.name} إلى {cities.length} مدينة و {centers.length} مركز بنجاح. 
                    البيانات هتتظهر في النظام خلال ثوانٍ.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* رسالة الخطأ */}
              {error && (
                <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>حصل خطأ</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* ملخص التقسيم المقترح */}
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-700" />
              ملخص التقسيم المقترح للمحافظات المصرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">القاهرة</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  عاصمة مصر وأكبر مدنها، تضم مناطق حضرية متطورة ومراكز تابعة.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">عدد المدن:</span>
                    <span className="font-bold text-blue-700">43 مدينة</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">عدد المراكز:</span>
                    <span className="font-bold text-amber-700">8 مراكز</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">القليوبية</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  محافظة تقع شمال القاهرة، تضم مدن صناعية هامة ومراكز زراعية.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">عدد المدن:</span>
                    <span className="font-bold text-blue-700">10 مدن</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">عدد المراكز:</span>
                    <span className="font-bold text-amber-700">6 مراكز</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">المنوفية</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  محافظة زراعية في الدلتا، تتميز بأراضيها الخصبة ومدنها التاريخية.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">عدد المدن:</span>
                    <span className="font-bold text-blue-700">9 مدن</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">عدد المراكز:</span>
                    <span className="font-bold text-amber-700">7 مراكز</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-blue-50/30 border-t border-blue-200 pt-4">
            <div className="flex items-start gap-3 w-full">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">تلميح:</span> 
                يمكنك تعديل هذا التقسيم حسب احتياجات عملك الفعلية. 
                المدن تصلح للمناطق الحضرية عالية الكثافة، والمراكز للمناطق الريفية أو شبه الحضرية.
                يُنصح بتوزيع المناديب حسب هذا التقسيم لتحسين كفاءة التوصيل.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DivideAreasPage;