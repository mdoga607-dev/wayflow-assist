// src/pages/DelegateDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, Phone, MapPin, Truck, Wallet, Clock, AlertCircle, 
  Package, CheckCircle, XCircle, RefreshCcw 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Delegate {
  id: string;
  name: string;
  phone: string;
  city: string;
  branch: string;
  avatar_url?: string;
  status: string;
  total_delivered: number;
  total_delayed: number;
  total_returned: number;
  balance: number;
  commission_due: number;
  courier_limit: number;
  created_at: string;
}

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  status: string;
  cod_amount: number;
  created_at: string;
}

const DelegateDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [delegate, setDelegate] = useState<Delegate | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager', 'courier'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات المندوب
  useEffect(() => {
    if (!id) {
      setError('معرف المندوب غير موجود');
      setLoading(false);
      return;
    }

    const fetchDelegate = async () => {
      try {
        setLoading(true);
        setError(null);

        // جلب بيانات المندوب
        const { data: delegateData, error: delegateError } = await supabase
          .from('delegates')
          .select('*')
          .eq('id', id)
          .single();

        if (delegateError || !delegateData) {
          throw new Error('لم يتم العثور على المندوب');
        }

        setDelegate(delegateData);

        // جلب شحنات المندوب
        const { data: shipmentsData, error: shipmentsError } = await supabase
          .from('shipments')
          .select('id, tracking_number, recipient_name, status, cod_amount, created_at')
          .eq('delegate_id', id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!shipmentsError && shipmentsData) {
          setShipments(shipmentsData);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'فشل تحميل بيانات المندوب';
        setError(errorMessage);
        console.error('Error fetching delegate details:', err);
        toast({
          title: "خطأ في التحميل",
          description: "فشل تحميل بيانات المندوب. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDelegate();
  }, [id]);

  // معالجة حالة التحميل والخطأ
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري تحميل بيانات المندوب...</p>
          <p className="mt-2 text-muted-foreground">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  if (error || !delegate) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">خطأ في تحميل الصفحة</CardTitle>
            <CardDescription className="text-lg mt-2">
              {error || 'لم يتم العثور على المندوب المطلوب'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              قد يكون المندوب محذوفاً أو غير موجود في النظام
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/app/delegates')}>
                <Truck className="h-4 w-4 ml-2" />
                العودة لقائمة المناديب
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCcw className="h-4 w-4 ml-2" />
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // تحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'on_leave': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={delegate.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-white">
                {delegate.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {delegate.name}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {delegate.city} - {delegate.branch}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            رجوع
          </Button>
          <Button onClick={() => navigate(`/app/delegates`)}>
            <Truck className="h-4 w-4 ml-2" />
            عرض جميع المناديب
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* البطاقة الرئيسية */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              معلومات المندوب الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">الاسم الكامل</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {delegate.name}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${delegate.phone}`} className="hover:text-primary transition-colors">
                    {delegate.phone}
                  </a>
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">المدينة</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {delegate.city}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">الفرع</p>
                <p className="font-medium">{delegate.branch || '-'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">الحالة</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(delegate.status)}
                  <Badge className={getStatusColor(delegate.status)}>
                    {delegate.status === 'active' ? 'نشط' : 
                     delegate.status === 'inactive' ? 'غير نشط' : 
                     delegate.status === 'on_leave' ? 'في إجازة' : 'غير معروف'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">تاريخ التسجيل</p>
                <p className="font-medium">
                  {new Date(delegate.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الإحصائيات */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              إحصائيات الأداء
            </CardTitle>
            <CardDescription>
              أداء المندوب في تسليم الشحنات خلال الفترة الأخيرة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تم التسليم</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {delegate.total_delivered}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50/5 rounded-lg border border-yellow-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">متأخر</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {delegate.total_delayed}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="p-4 bg-red-50/5 rounded-lg border border-red-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مرتجع</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {delegate.total_returned}
                    </p>
                  </div>
                  <RefreshCcw className="h-8 w-8 text-red-500" />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50/5 rounded-lg border border-blue-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الحد الأقصى</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {delegate.courier_limit}
                    </p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {delegate.balance.toLocaleString()} ر.س
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">العمولة المستحقة</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {delegate.commission_due.toLocaleString()} ر.س
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* آخر الشحنات */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              آخر الشحنات الموكلة للمندوب
            </CardTitle>
            <CardDescription>
              عرض آخر 20 شحنة تم تعيينها لهذا المندوب
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shipments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">لا توجد شحنات لهذا المندوب</p>
                <p className="mt-2">سيتم عرض الشحنات هنا فور تعيينها للمندوب</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 text-right">
                      <th className="p-4 font-medium text-muted-foreground">رقم البوليصة</th>
                      <th className="p-4 font-medium text-muted-foreground">اسم المستلم</th>
                      <th className="p-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="p-4 font-medium text-muted-foreground text-left">المبلغ (ر.س)</th>
                      <th className="p-4 font-medium text-muted-foreground">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment) => (
                      <tr key={shipment.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-4 font-medium text-primary">
                          #{shipment.tracking_number}
                        </td>
                        <td className="p-4">{shipment.recipient_name}</td>
                        <td className="p-4">
                          <Badge variant={
                            shipment.status === 'delivered' ? 'default' :
                            shipment.status === 'delayed' ? 'destructive' :
                            shipment.status === 'returned' ? 'secondary' : 'outline'
                          }>
                            {shipment.status === 'delivered' ? 'تم التسليم' :
                             shipment.status === 'pending' ? 'قيد الانتظار' :
                             shipment.status === 'transit' ? 'قيد التوصيل' :
                             shipment.status === 'delayed' ? 'متأخر' :
                             shipment.status === 'returned' ? 'مرتجع' : 'غير معروف'}
                          </Badge>
                        </td>
                        <td className="p-4 font-bold text-green-600 text-left">
                          {shipment.cod_amount?.toLocaleString() || '0'}
                        </td>
                        <td className="p-4">
                          {new Date(shipment.created_at).toLocaleDateString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DelegateDetails;