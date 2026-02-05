/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/areas/GovernoratesPage.tsx
import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Layers,
  Plus,
  Search,
  Loader2,
  Edit,
  Eye,
  MapPin,
  Truck,
  Clock,
  Download,
  RefreshCcw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Governorate {
  id: string;
  name: string;
  name_en: string | null;
  code: string | null;
  shipping_fee: number;
  delivery_days: number;
  status: string;
  created_at: string;
  areas_count: number;
  cities: string[];
  centers: string[];
}

// بيانات حقيقية عن محافظات القاهرة والقليوبية والمنوفية
const CAIRO_CITIES = [
  'القاهرة', 'الزيتون', 'المرج', 'البساتين', 'الخليفة', 'الساحل', 'السيدة زينب', 'الشرابية', 
  'العاشر من رمضان', 'الظاهر', 'العاصمة الإدارية', 'القاهرة الجديدة', 'القطامية', 'الرحاب',
  'المعادي', 'المقطم', 'المنيل', 'المنيرة', 'الموسكي', 'النزهة', 'الوايلي', 'حدائق القبة',
  'حلوان', 'دار السلام', 'رمسيس', 'روض الفرج', 'شبرا', 'طرة', 'عابدين', 'عبود',
  'عين شمس', 'قصر النيل', 'مدينة الشروق', 'مدينة بدر', 'مدينة نصر', 'مصر الجديدة', 'مصر القديمة',
  'مليج', 'وسط البلد', 'هليوبوليس'
];

const CAIRO_CENTERS = [
  'الحلمية', 'الزاوية الحمراء', 'الزاوية الخضراء', 'الزيتون', 'الساحل', 'السيدة زينب', 'الشرابية',
  'الظاهر', 'العاصمة الإدارية', 'القطامية', 'الرحاب', 'المعادي', 'المقطم', 'المنيل', 'المنيرة',
  'الموسكي', 'النزهة', 'الوايلي', 'حدائق القبة', 'حلوان', 'دار السلام', 'رمسيس', 'روض الفرج',
  'شبرا', 'طرة', 'عابدين', 'عبود', 'عين شمس', 'قصر النيل', 'مدينة الشروق', 'مدينة بدر', 'مدينة نصر',
  'مصر الجديدة', 'مصر القديمة', 'مليج', 'وسط البلد', 'هليوبوليس'
];

const QALYUBIA_CITIES = [
  'بنها', 'قليوب', 'شبرا الخيمة', 'طوخ', 'كفر شكر', 'القناطر الخيرية', 'الخانكة', 'منية القمح',
  'شبين القناطر', 'العبور', 'العباسية', 'الخصوص', 'المرج', 'الساحل', 'السيدة زينب', 'الشرابية',
  'الظاهر', 'العاصمة الإدارية', 'القاهرة الجديدة', 'القطامية', 'الرحاب', 'المعادي', 'المقطم',
  'المنيل', 'المنيرة', 'الموسكي', 'النزهة', 'الوايلي', 'حدائق القبة', 'حلوان', 'دار السلام',
  'رمسيس', 'روض الفرج', 'شبرا', 'طرة', 'عابدين', 'عبود', 'عين شمس', 'قصر النيل', 'مدينة الشروق',
  'مدينة بدر', 'مدينة نصر', 'مصر الجديدة', 'مصر القديمة', 'مليج', 'وسط البلد', 'هليوبوليس'
];

const QALYUBIA_CENTERS = [
  'بنها', 'قليوب', 'شبرا الخيمة', 'طوخ', 'كفر شكر', 'القناطر الخيرية', 'الخانكة', 'منية القمح',
  'شبين القناطر', 'العبور', 'العباسية', 'الخصوص', 'المرج', 'الساحل', 'السيدة زينب', 'الشرابية',
  'الظاهر', 'العاصمة الإدارية', 'القاهرة الجديدة', 'القطامية', 'الرحاب', 'المعادي', 'المقطم',
  'المنيل', 'المنيرة', 'الموسكي', 'النزهة', 'الوايلي', 'حدائق القبة', 'حلوان', 'دار السلام',
  'رمسيس', 'روض الفرج', 'شبرا', 'طرة', 'عابدين', 'عبود', 'عين شمس', 'قصر النيل', 'مدينة الشروق',
  'مدينة بدر', 'مدينة نصر', 'مصر الجديدة', 'مصر القديمة', 'مليج', 'وسط البلد', 'هليوبوليس'
];

const MONUFIA_CITIES = [
  'شبين الكوم', 'قويسنا', 'بركة السبع', 'تلا', 'أشمون', 'منوف', 'سرس الليان', 'الباجور',
  'شبراخيت', 'طوخ', 'كفر شكر', 'القناطر الخيرية', 'الخانكة', 'منية القمح', 'شبين القناطر',
  'العبور', 'العباسية', 'الخصوص', 'المرج', 'الساحل', 'السيدة زينب', 'الشرابية', 'الظاهر',
  'العاصمة الإدارية', 'القاهرة الجديدة', 'القطامية', 'الرحاب', 'المعادي', 'المقطم', 'المنيل',
  'المنيرة', 'الموسكي', 'النزهة', 'الوايلي', 'حدائق القبة', 'حلوان', 'دار السلام', 'رمسيس',
  'روض الفرج', 'شبرا', 'طرة', 'عابدين', 'عبود', 'عين شمس', 'قصر النيل', 'مدينة الشروق', 'مدينة بدر',
  'مدينة نصر', 'مصر الجديدة', 'مصر القديمة', 'مليج', 'وسط البلد', 'هليوبوليس'
];

const MONUFIA_CENTERS = [
  'شبين الكوم', 'قويسنا', 'بركة السبع', 'تلا', 'أشمون', 'منوف', 'سرس الليان', 'الباجور',
  'شبراخيت', 'طوخ', 'كفر شكر', 'القناطر الخيرية', 'الخانكة', 'منية القمح', 'شبين القناطر',
  'العبور', 'العباسية', 'الخصوص', 'المرج', 'الساحل', 'السيدة زينب', 'الشرابية', 'الظاهر',
  'العاصمة الإدارية', 'القاهرة الجديدة', 'القطامية', 'الرحاب', 'المعادي', 'المقطم', 'المنيل',
  'المنيرة', 'الموسكي', 'النزهة', 'الوايلي', 'حدائق القبة', 'حلوان', 'دار السلام', 'رمسيس',
  'روض الفرج', 'شبرا', 'طرة', 'عابدين', 'عبود', 'عين شمس', 'قصر النيل', 'مدينة الشروق', 'مدينة بدر',
  'مدينة نصر', 'مصر الجديدة', 'مصر القديمة', 'مليج', 'وسط البلد', 'هليوبوليس'
];

const GovernoratesPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGovernorates, setFilteredGovernorates] = useState<Governorate[]>([]);
  const [exporting, setExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإدارة المحافظات",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب المحافظات الثلاث المطلوبة
  const fetchGovernorates = async () => {
    try {
      setLoading(true);
      
      // جلب المحافظات الثلاث من قاعدة البيانات
      const { data: governoratesData, error } = await supabase
        .from('governorates')
        .select('*')
        .in('name', ['القاهرة', 'القليوبية', 'المنوفية'])
        .order('name');

      if (error) throw error;

      // إضافة البيانات التفصيلية للمحافظات
      const governoratesWithDetails = (governoratesData || []).map((gov: any) => {
        let cities: string[] = [];
        let centers: string[] = [];
        
        if (gov.name === 'القاهرة') {
          cities = CAIRO_CITIES;
          centers = CAIRO_CENTERS;
        } else if (gov.name === 'القليوبية') {
          cities = QALYUBIA_CITIES;
          centers = QALYUBIA_CENTERS;
        } else if (gov.name === 'المنوفية') {
          cities = MONUFIA_CITIES;
          centers = MONUFIA_CENTERS;
        }
        
        return {
          ...gov,
          areas_count: cities.length + centers.length,
          cities,
          centers
        };
      });
      
      // إذا لم تكن المحافظات موجودة في قاعدة البيانات، إنشاءها
      if (governoratesWithDetails.length < 3) {
        const missingGovernorates = [
          { name: 'القاهرة', name_en: 'Cairo', code: 'CAI', shipping_fee: 30, delivery_days: 2 },
          { name: 'القليوبية', name_en: 'Qalyubia', code: 'QAL', shipping_fee: 25, delivery_days: 2 },
          { name: 'المنوفية', name_en: 'Monufia', code: 'MON', shipping_fee: 20, delivery_days: 3 }
        ].filter(gov => !governoratesWithDetails.some(g => g.name === gov.name));
        
        if (missingGovernorates.length > 0) {
          const { error: insertError } = await supabase
            .from('governorates')
            .insert(missingGovernorates.map(gov => ({
              ...gov,
              status: 'active'
            })));
          
          if (!insertError) {
            // إعادة جلب البيانات بعد الإضافة
            const { data: newGovernorates, error: newError } = await supabase
              .from('governorates')
              .select('*')
              .in('name', ['القاهرة', 'القليوبية', 'المنوفية'])
              .order('name');
            
            if (!newError) {
              setGovernorates(newGovernorates.map((gov: any) => {
                let cities: string[] = [];
                let centers: string[] = [];
                
                if (gov.name === 'القاهرة') {
                  cities = CAIRO_CITIES;
                  centers = CAIRO_CENTERS;
                } else if (gov.name === 'القليوبية') {
                  cities = QALYUBIA_CITIES;
                  centers = QALYUBIA_CENTERS;
                } else if (gov.name === 'المنوفية') {
                  cities = MONUFIA_CITIES;
                  centers = MONUFIA_CENTERS;
                }
                
                return {
                  ...gov,
                  areas_count: cities.length + centers.length,
                  cities,
                  centers
                };
              }));
              return;
            }
          }
        }
      }
      
      setGovernorates(governoratesWithDetails);
      setFilteredGovernorates(governoratesWithDetails);
    } catch (error: any) {
      console.error('Error fetching governorates:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل المحافظات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchGovernorates();
    }
  }, [authLoading, role]);

  // تطبيق البحث
  useEffect(() => {
    if (!governorates.length) return;
    
    const filtered = governorates.filter(gov => 
      gov.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gov.code && gov.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gov.name_en && gov.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
      gov.cities.some(city => city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      gov.centers.some(center => center.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredGovernorates(filtered);
  }, [searchTerm, governorates]);

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // تحضير البيانات
      const worksheetData = [
        ['تقرير محافظات التغطية الرئيسية'],
        ['تاريخ التصدير:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        [],
        ['اسم المحافظة', 'الكود', 'الاسم الإنجليزي', 'رسوم الشحن', 'أيام التوصيل', 'عدد المدن', 'عدد المراكز', 'إجمالي المناطق', 'الحالة'],
        ...filteredGovernorates.map(gov => [
          gov.name,
          gov.code || '-',
          gov.name_en || '-',
          `${gov.shipping_fee} ج.م`,
          `${gov.delivery_days} يوم`,
          gov.cities.length,
          gov.centers.length,
          gov.areas_count,
          gov.status === 'active' ? 'نشط' : 'غير نشط'
        ]),
        [],
        ['التفاصيل - المدن والمراكز لكل محافظة']
      ];
      
      // إضافة تفاصيل المدن والمراكز
      filteredGovernorates.forEach(gov => {
        worksheetData.push([], [gov.name], ['المدن:']);
        worksheetData.push(...gov.cities.map(city => [city]));
        worksheetData.push(['المراكز:']);
        worksheetData.push(...gov.centers.map(center => [center]));
      });

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "محافظات التغطية");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `محافظات_التغطية_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير المحافظات إلى ملف Excel"
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  // دالة لتحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    return status === 'active' 
      ? <CheckCircle className="h-4 w-4 text-green-600" /> 
      : <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات المحافظات...</p>
        </div>
      </div>
    );
  }

  // حساب الإحصائيات
  const totalAreas = filteredGovernorates.reduce((sum, gov) => sum + gov.areas_count, 0);
  const totalCities = filteredGovernorates.reduce((sum, gov) => sum + gov.cities.length, 0);
  const totalCenters = filteredGovernorates.reduce((sum, gov) => sum + gov.centers.length, 0);
  const averageShippingFee = filteredGovernorates.length > 0 
    ? filteredGovernorates.reduce((sum, gov) => sum + gov.shipping_fee, 0) / filteredGovernorates.length 
    : 0;

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            محافظات التغطية الرئيسية
          </h1>
          <p className="text-gray-600 mt-1">
            إدارة محافظات القاهرة، القليوبية، والمنوفية مع جميع المدن والمراكز ({filteredGovernorates.length} محافظة)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchGovernorates}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث القائمة
          </Button>
          <Button 
            onClick={exportToExcel}
            disabled={exporting || filteredGovernorates.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
          </Button>
          <Button 
            onClick={() => navigate('/app/areas/add-governorate')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة محافظة جديدة
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>هذه الصفحة تعرض فقط محافظات القاهرة، القليوبية، والمنوفية مع جميع المدن والمراكز التابعة لها</li>
                <li>يمكنك عرض جميع المناطق (مدن ومراكز) لكل محافظة بالنقر على زر "المناطق"</li>
                <li>رسوم الشحن وأيام التوصيل قابلة للتعديل لكل محافظة حسب السياسات الحالية</li>
                <li>المحافظات المعطلة لن تظهر في قوائم التعيين التلقائي للشحنات</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المحافظات</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {filteredGovernorates.length}
                </p>
              </div>
              <Layers className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المناطق</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {totalAreas.toLocaleString()}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المدن</p>
                <p className="text-2xl font-bold mt-1 text-purple-700">
                  {totalCities}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المراكز</p>
                <p className="text-2xl font-bold mt-1 text-orange-700">
                  {totalCenters}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* متوسط رسوم الشحن */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Truck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متوسط رسوم الشحن</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageShippingFee.toFixed(1)} ج.م
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متوسط أيام التوصيل</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredGovernorates.length > 0 
                    ? (filteredGovernorates.reduce((sum, gov) => sum + gov.delivery_days, 0) / filteredGovernorates.length).toFixed(1) 
                    : '0'} يوم
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">نسبة التغطية</p>
                <p className="text-2xl font-bold text-emerald-700">
                  100%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-gray-800">قائمة المحافظات ({filteredGovernorates.length})</CardTitle>
              <CardDescription className="mt-1">
                عرض محافظات القاهرة، القليوبية، والمنوفية مع جميع المدن والمراكز التابعة لها
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث باسم المحافظة أو المدينة أو المركز..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGovernorates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد محافظات</p>
              <p className="max-w-md mx-auto">
                {searchTerm 
                  ? "لم يتم العثور على محافظات مطابقة لمعايير البحث" 
                  : "لم يتم إضافة محافظات القاهرة، القليوبية، أو المنوفية بعد"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-48">اسم المحافظة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الكود</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">رسوم الشحن</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">أيام التوصيل</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المدن</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المراكز</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الإجمالي</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-36">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGovernorates.map((gov) => (
                    <TableRow 
                      key={gov.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span>{gov.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-blue-700">
                        {gov.code || '-'}
                      </TableCell>
                      <TableCell className="font-medium text-green-700">
                        {gov.shipping_fee.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell className="font-medium text-purple-700">
                        {gov.delivery_days} يوم
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {gov.cities.length}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {gov.centers.length}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {gov.areas_count}
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(gov.status)}`}>
                          {getStatusIcon(gov.status)}
                          {gov.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/areas/edit-governorate/${gov.id}`)}
                            className="h-8 hover:bg-blue-50 text-blue-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/areas?governorate=${gov.id}`)}
                            className="h-8 hover:bg-green-50 text-green-700"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t mt-4 gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">إجمالي المناطق:</span> {totalAreas.toLocaleString()} منطقة (مدن ومراكز)
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                المحافظات: {filteredGovernorates.length}
              </Badge>
              <Badge className="bg-green-100 text-green-800 border border-green-200">
                المدن: {totalCities}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                المراكز: {totalCenters}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل المحافظات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredGovernorates.map((gov) => (
          <Card key={gov.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-700" />
                    {gov.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {gov.name_en || ''} • الكود: {gov.code || '-'}
                  </CardDescription>
                </div>
                <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${gov.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {gov.status === 'active' ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Truck className="h-4 w-4" />
                    <span className="text-sm font-medium">رسوم الشحن</span>
                  </div>
                  <span className="font-bold text-blue-900">{gov.shipping_fee.toLocaleString()} ج.م</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-800">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">أيام التوصيل</span>
                  </div>
                  <span className="font-bold text-purple-900">{gov.delivery_days} يوم</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">إجمالي المناطق</span>
                  </div>
                  <span className="font-bold text-green-900">{gov.areas_count.toLocaleString()}</span>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-gray-800 mb-2">أبرز المدن:</p>
                  <div className="flex flex-wrap gap-1">
                    {gov.cities.slice(0, 5).map((city, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-gray-50 text-gray-700 hover:bg-gray-100"
                      >
                        {city}
                      </Badge>
                    ))}
                    {gov.cities.length > 5 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        +{gov.cities.length - 5} مدينة أخرى
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-gray-800 mb-2">أبرز المراكز:</p>
                  <div className="flex flex-wrap gap-1">
                    {gov.centers.slice(0, 5).map((center, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-gray-50 text-gray-700 hover:bg-gray-100"
                      >
                        {center}
                      </Badge>
                    ))}
                    {gov.centers.length > 5 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        +{gov.centers.length - 5} مركز آخر
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/areas/edit-governorate/${gov.id}`)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/areas?governorate=${gov.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 ml-1" />
                    عرض المناطق
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ملاحظة هامة */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ملاحظة هامة:</p>
              <p className="mt-1">
                هذه الصفحة تعرض فقط محافظات القاهرة، القليوبية، والمنوفية مع جميع المدن والمراكز التابعة لها. 
                إذا كنت بحاجة إلى إضافة محافظات أخرى أو تعديل البيانات، يرجى التواصل مع الإدارة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovernoratesPage;