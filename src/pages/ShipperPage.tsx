// src/pages/ShipperPage.tsx
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
import { Label } from '@/components/ui/label';
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
  Package,
  Truck,
  Wallet,
  FileText,
  Plus,
  Search,
  RefreshCcw,
  MapPin,
  Phone,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Printer,
  User,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import * as XLSX from 'xlsx';

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: string;
  cod_amount: number;
  status: string;
  created_at: string;
  delivered_at?: string;
}

interface ShipperProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  balance: number;
  total_shipments: number;
  total_delivered: number;
  total_revenue: number;
}

const ShipperPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [profile, setProfile] = useState<ShipperProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [exporting, setExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role !== 'shipper') {
      toast({
        title: "غير مصرح",
        description: "هذه الصفحة مخصصة للتاجر فقط",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات التاجر والشحنات
  const fetchData = async () => {
    if (!user || role !== 'shipper') return;
    
    try {
      setLoading(true);
      
      // جلب بيانات التاجر
      const { data: profileData, error: profileError } = await supabase
        .from('shippers')
        .select(`
          id,
          name,
          phone,
          email,
          address,
          city,
          balance,
          total_shipments,
          total_delivered,
          total_revenue
        `)
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      
      setProfile({
        id: profileData.id,
        name: profileData.name,
        phone: profileData.phone || '',
        email: profileData.email || '',
        address: profileData.address || '',
        city: profileData.city || '',
        balance: profileData.balance || 0,
        total_shipments: profileData.total_shipments || 0,
        total_delivered: profileData.total_delivered || 0,
        total_revenue: profileData.total_revenue || 0
      });

      // جلب الشحنات
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select(`
          id,
          tracking_number,
          recipient_name,
          recipient_phone,
          recipient_address,
          recipient_city,
          cod_amount,
          status,
          created_at,
          delivered_at
        `)
        .eq('shipper_id', profileData.id)
        .order('created_at', { ascending: false });

      if (shipmentsError) throw shipmentsError;
      
      setShipments(shipmentsData || []);
      setFilteredShipments(shipmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "فشل التحميل",
        description: "حدث خطأ أثناء تحميل بياناتك. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && user && role === 'shipper') {
      fetchData();
    }
  }, [authLoading, user, role]);

  // تطبيق البحث
  useEffect(() => {
    if (!shipments.length) return;
    
    const filtered = shipments.filter(shipment => 
      shipment.tracking_number.includes(searchQuery) ||
      shipment.recipient_name.includes(searchQuery) ||
      shipment.recipient_phone.includes(searchQuery) ||
      shipment.recipient_address.includes(searchQuery) ||
      shipment.status.includes(searchQuery)
    );
    
    setFilteredShipments(filtered);
  }, [searchQuery, shipments]);

  // تحديث البيانات
  const handleRefresh = () => {
    fetchData();
    toast({
      title: "تم التحديث",
      description: "تم تحديث بياناتك بنجاح"
    });
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // تحضير البيانات
      const worksheetData = [
        ['تقرير شحنات التاجر'],
        ['اسم التاجر:', profile?.name || '', 'التاريخ:', format(new Date(), 'yyyy-MM-dd', { locale: ar })],
        ['الهاتف:', profile?.phone || '', 'المدينة:', profile?.city || ''],
        [],
        ['رقم التتبع', 'اسم المستلم', 'الهاتف', 'العنوان', 'المدينة', 'المبلغ', 'الحالة', 'تاريخ الإنشاء', 'تاريخ التسليم'],
        ...filteredShipments.map(shipment => [
          shipment.tracking_number,
          shipment.recipient_name,
          shipment.recipient_phone,
          shipment.recipient_address,
          shipment.recipient_city,
          shipment.cod_amount.toLocaleString(),
          getArabicStatus(shipment.status),
          format(new Date(shipment.created_at), 'yyyy-MM-dd HH:mm', { locale: ar }),
          shipment.delivered_at ? format(new Date(shipment.delivered_at), 'yyyy-MM-dd HH:mm', { locale: ar }) : '-'
        ]),
        [],
        ['الإجماليات'],
        ['إجمالي الشحنات', 'الشحنات المُسلمة', 'إجمالي الإيرادات', 'الرصيد الحالي'],
        [
          profile?.total_shipments || 0,
          profile?.total_delivered || 0,
          (profile?.total_revenue || 0).toLocaleString() + ' ر.س',
          (profile?.balance || 0).toLocaleString() + ' ر.س'
        ]
      ];

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الشحنات");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `تقرير_شحنات_${profile?.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير تقرير شحناتك إلى ملف Excel"
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

  // طباعة التقرير
  const handlePrint = () => {
    window.print();
  };

  // دالة لتحويل حالة الشحنة للعربية
  const getArabicStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'transit': return 'في الطريق';
      case 'out_for_delivery': return 'خارج للتوصيل';
      case 'delivered': return 'تم التسليم';
      case 'delayed': return 'متأخرة';
      case 'returned': return 'مرتجعة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'transit': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delayed': return 'bg-orange-100 text-orange-800';
      case 'returned': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // دالة لتحديد الأيقونة المناسبة للحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'transit': return <Truck className="h-4 w-4 text-blue-600" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4 text-purple-600" />;
      case 'delayed': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'returned': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بياناتك...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">لم يتم العثور على حساب التاجر</h2>
          <p className="text-gray-600 mb-6">
            يرجى التواصل مع الإدارة لإنشاء حساب تاجر مرتبط بحسابك.
          </p>
          <Button onClick={() => navigate('/app/dashboard')}>
            العودة للرئيسية
          </Button>
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
            <Package className="h-6 w-6 text-blue-600" />
            لوحة تحكم التاجر
          </h1>
          <p className="text-gray-600 mt-1">
            مرحبًا بك {profile.name}، يمكنك إدارة شحناتك ومتابعة أرباحك من هنا
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث البيانات
          </Button>
          <Button 
            onClick={() => navigate('/app/add-shipment')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة شحنة جديدة
          </Button>
        </div>
      </div>

      {/* معلومات التاجر */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-700" />
            معلومات التاجر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">الاسم</span>
              </div>
              <p className="font-medium text-gray-900">{profile.name}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">الهاتف</span>
              </div>
              <p className="font-medium text-gray-900" dir="ltr">{profile.phone}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">المدينة</span>
              </div>
              <p className="font-medium text-gray-900">{profile.city}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">الرصيد</span>
              </div>
              <p className="font-bold text-lg text-blue-600">{profile.balance.toLocaleString()} ر.س</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الشحنات</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {profile.total_shipments}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الشحنات المُسلمة</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {profile.total_delivered}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">
                  {profile.total_revenue.toLocaleString()} ر.س
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل التسليم</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {profile.total_shipments > 0 
                    ? Math.round((profile.total_delivered / profile.total_shipments) * 100) 
                    : 0}%
                </p>
              </div>
              <Truck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">البحث عن شحنة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ابحث برقم التتبع أو اسم المستلم أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            <Info className="h-3 w-3 inline-block ml-1" />
            أدخل جزء من رقم التتبع أو اسم المستلم للبحث
          </p>
        </CardContent>
      </Card>

      {/* جدول الشحنات */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-700" />
                شحناتك ({filteredShipments.length})
              </CardTitle>
              <CardDescription className="mt-1">
                جميع شحناتك مع حالة كل شحنة وتاريخ التسليم
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToExcel}
                disabled={exporting || filteredShipments.length === 0}
                className="gap-1"
              >
                <Download className="h-3 w-3" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
                className="gap-1"
              >
                <Printer className="h-3 w-3" />
                طباعة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد شحنات</p>
              <p className="max-w-md mx-auto">
                {searchQuery 
                  ? "لم يتم العثور على شحنات مطابقة لمعايير البحث" 
                  : "لم تقم بإضافة أي شحنات حتى الآن"}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/app/add-shipment')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة شحنة جديدة
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-32">رقم التتبع</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">المستلم</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">الهاتف</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">العنوان</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">المبلغ</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">التاريخ</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-24">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow 
                      key={shipment.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-mono font-medium text-blue-600">
                        {shipment.tracking_number}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {shipment.recipient_name}
                      </TableCell>
                      <TableCell dir="ltr" className="font-mono">
                        {shipment.recipient_phone}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span>{shipment.recipient_address}, {shipment.recipient_city}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        {shipment.cod_amount.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(shipment.status)}>
                          {getStatusIcon(shipment.status)}
                          <span className="mr-1">{getArabicStatus(shipment.status)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/track/${shipment.tracking_number}`)}
                          className="h-8"
                        >
                          تتبع
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t mt-4 gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">إجمالي الشحنات:</span> {filteredShipments.length} شحنة
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">إجمالي المبالغ:</span> {filteredShipments.reduce((sum, s) => sum + s.cod_amount, 0).toLocaleString()} ر.س
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملاحظات هامة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-700" />
            ملاحظات هامة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">إضافة شحنة جديدة</p>
              <p className="text-sm text-gray-600 mt-1">
                يمكنك إضافة شحنة جديدة بالنقر على زر "إضافة شحنة جديدة" في أعلى الصفحة.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">تتبع الشحنات</p>
              <p className="text-sm text-gray-600 mt-1">
                يمكنك تتبع أي شحنة بالنقر على زر "تتبع" بجانب كل شحنة لعرض موقعها الحالي وحالتها.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">تصدير التقارير</p>
              <p className="text-sm text-gray-600 mt-1">
                يمكنك تصدير جميع شحناتك إلى ملف Excel أو طباعتها بالنقر على الأزرار المخصصة لذلك.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">الرصيد والمدفوعات</p>
              <p className="text-sm text-gray-600 mt-1">
                رصيدك الموضح هو المبلغ المستحق لك بعد خصم العمولات. يمكنك سحب أرباحك من صفحة المحفظة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipperPage;