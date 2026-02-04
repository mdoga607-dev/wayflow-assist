/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/TrackDelegates.tsx
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
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Truck, 
  Clock, 
  RefreshCcw, 
  Loader2, 
  Search,
  Filter,
  Smartphone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Delegate {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive' | 'on_leave' | 'busy';
  current_location?: string;
  last_location_update?: string;
  active_shipments: number;
  total_delivered: number;
  avatar_url?: string;
  city: string;
  last_seen?: string;
}

const TrackDelegates = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [filteredDelegates, setFilteredDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لعرض تتبع المناديب",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات المناديب من قاعدة البيانات
  const fetchDelegates = async () => {
    try {
      setLoading(true);
      
      // جلب المناديب مع عدد الشحنات النشطة
      const { data: delegatesData, error } = await supabase
        .from('delegates')
        .select(`
          id,
          name,
          phone,
          status,
          current_location,
          last_location_update,
          avatar_url,
          city,
          last_seen,
          total_delivered,
          shipments_count:shipments(count)
        `)
        .order('name');

      if (error) throw error;

      // معالجة البيانات
      const processedDelegates = (delegatesData || []).map((delegate: any) => ({
        id: delegate.id,
        name: delegate.name,
        phone: delegate.phone,
        status: delegate.status as 'active' | 'inactive' | 'on_leave' | 'busy',
        current_location: delegate.current_location || 'غير معروف',
        last_location_update: delegate.last_location_update || delegate.last_seen,
        active_shipments: delegate.shipments_count?.count || 0,
        total_delivered: delegate.total_delivered || 0,
        avatar_url: delegate.avatar_url,
        city: delegate.city || 'غير معروف',
        last_seen: delegate.last_seen
      }));

      setDelegates(processedDelegates);
      applyFilters(processedDelegates);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching delegates:', error);
      toast({
        title: "فشل التحميل",
        description: "حدث خطأ أثناء تحميل بيانات المناديب. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // تطبيق عوامل التصفية
  const applyFilters = (delegateList: Delegate[]) => {
    let filtered = [...delegateList];
    
    // تصفية البحث
    if (searchQuery.trim()) {
      filtered = filtered.filter(delegate => 
        delegate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delegate.phone.includes(searchQuery) ||
        delegate.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (delegate.current_location && delegate.current_location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // تصفية الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(delegate => delegate.status === statusFilter);
    }
    
    // تصفية المدينة
    if (cityFilter !== 'all') {
      filtered = filtered.filter(delegate => delegate.city === cityFilter);
    }
    
    setFilteredDelegates(filtered);
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchDelegates();
      
      // إعداد التحديث التلقائي كل 60 ثانية
      const interval = setInterval(() => {
        if (autoRefresh) {
          fetchDelegates();
        }
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [authLoading, role, autoRefresh]);

  // مراقبة التغييرات في عوامل التصفية
  useEffect(() => {
    applyFilters(delegates);
  }, [searchQuery, statusFilter, cityFilter, delegates]);

  const handleRefresh = () => {
    fetchDelegates();
    toast({
      title: "تم التحديث",
      description: "تم تحديث بيانات المناديب بنجاح"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'busy':
        return <Badge className="bg-yellow-100 text-yellow-800">مشغول</Badge>;
      case 'on_leave':
        return <Badge className="bg-blue-100 text-blue-800">في إجازة</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">غير نشط</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">غير معروف</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'on_leave': return 'text-blue-600';
      case 'inactive': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getCities = () => {
    const cities = new Set(delegates.map(d => d.city));
    return Array.from(cities).filter(city => city !== 'غير معروف').sort();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات المناديب...</p>
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
            <MapPin className="h-6 w-6 text-blue-600" />
            تتبع المناديب
          </h1>
          <p className="text-gray-600 mt-1">
            تتبع موقع وحالة المناديب في الوقت الفعلي
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
          <Button 
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            {autoRefresh ? (
              <>
                <CheckCircle className="h-4 w-4" />
                تحديث تلقائي
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                تحديث يدوي
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>ملاحظات هامة:</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pr-5 space-y-1 mt-1">
            <li>يتم تحديث موقع المناديب تلقائياً كل دقيقة عند تفعيل "التحديث التلقائي"</li>
            <li>الموقع المعروض هو آخر موقع تم تسجيله بواسطة تطبيق المندوب على هاتفه</li>
            <li>المناديب النشطون يظهرون باللون الأخضر، والمشغولون باللون الأصفر</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* عوامل التصفية والبحث */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
            <Filter className="h-4 w-4 text-gray-600" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث بالاسم أو الهاتف أو الموقع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="busy">مشغول</SelectItem>
                <SelectItem value="on_leave">في إجازة</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المدن</SelectItem>
                {getCities().map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCityFilter('all');
                toast({ title: "تمت إعادة التعيين", description: "تمت إعادة تعيين عوامل التصفية" });
              }}
            >
              <RefreshCcw className="h-4 w-4 ml-2" />
              إعادة التعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المناديب النشطون</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {delegates.filter(d => d.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الشحنات النشطة</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {delegates.reduce((sum, d) => sum + d.active_shipments, 0)}
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الشحنات المطلوبة</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {delegates.reduce((sum, d) => sum + (d.active_shipments > 0 ? 1 : 0), 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المدن المغطاة</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">
                  {getCities().length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المناديب */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-700" />
                قائمة المناديب ({filteredDelegates.length})
              </CardTitle>
              <CardDescription className="mt-1">
                تتبع موقع وحالة المناديب في الوقت الفعلي
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              آخر تحديث: {lastUpdate.toLocaleTimeString('ar-EG', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDelegates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد بيانات مطابقة</p>
              <p className="max-w-md mx-auto">
                لم يتم العثور على مناديب مطابقين لمعايير البحث والتصفية الحالية.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDelegates.map((delegate) => (
                <Card 
                  key={delegate.id} 
                  className="border rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => navigate(`/app/delegates/${delegate.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          {delegate.avatar_url ? (
                            <img 
                              src={delegate.avatar_url} 
                              alt={delegate.name} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-base font-bold text-blue-700">
                              {delegate.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                            {delegate.name}
                            <span className={`text-sm ${getStatusColor(delegate.status)}`}>
                              • {delegate.status === 'active' ? 'نشط' : 
                                  delegate.status === 'busy' ? 'مشغول' : 
                                  delegate.status === 'on_leave' ? 'في إجازة' : 'غير نشط'}
                            </span>
                          </CardTitle>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Smartphone className="h-3 w-3" />
                              <span dir="ltr">{delegate.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{delegate.city}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(delegate.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                        <MapPin className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">الموقع الحالي</p>
                          <p className="font-medium mt-0.5 text-gray-800">
                            {delegate.current_location || 'غير متاح'}
                          </p>
                          {delegate.last_location_update && (
                            <p className="text-xs text-gray-500 mt-1">
                              آخر تحديث: {new Date(delegate.last_location_update).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                        <Truck className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">الشحنات النشطة</p>
                          <p className="font-bold text-lg mt-0.5 text-blue-600">
                            {delegate.active_shipments}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {delegate.active_shipments > 0 
                              ? `${delegate.active_shipments} شحنة قيد التوصيل` 
                              : 'لا توجد شحنات نشطة'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">إجمالي التسليمات</p>
                          <p className="font-bold text-lg mt-0.5 text-green-600">
                            {delegate.total_delivered.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* دليل الاستخدام */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            دليل الاستخدام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">التحديث التلقائي</p>
              <p className="text-sm text-gray-600 mt-1">
                عند تفعيل "التحديث التلقائي"، يتم تحديث موقع المناديب كل دقيقة تلقائياً.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">تصفية المناديب</p>
              <p className="text-sm text-gray-600 mt-1">
                يمكنك تصفية المناديب حسب الحالة (نشط، مشغول، في إجازة) أو المدينة (القاهرة، الجيزة، الإسكندرية).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">عرض تفاصيل المندوب</p>
              <p className="text-sm text-gray-600 mt-1">
                انقر على أي مندوب لعرض تفاصيله الكاملة بما في ذلك سجل الشحنات وأداء التوصيل.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackDelegates;