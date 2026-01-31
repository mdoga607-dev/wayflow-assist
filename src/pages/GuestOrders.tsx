// src/pages/GuestOrders.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Search, Phone, Truck, MapPin, Clock, CheckCircle, 
  AlertCircle, RefreshCcw, HelpCircle, Loader2, User, MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  delegate?: {
    name: string;
    phone: string;
  } | null;
}

const GuestOrders = () => {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'tracking' | 'phone'>('tracking');

  // دالة البحث عن الشحنة
  const searchShipment = async () => {
    if (!trackingNumber.trim() && searchMode === 'tracking') {
      toast({ title: "يرجى إدخال رقم البوليصة", variant: "destructive" });
      return;
    }

    if (!phone.trim() && searchMode === 'phone') {
      toast({ title: "يرجى إدخال رقم الهاتف", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);
    setShipment(null);

    try {
      let query = supabase
        .from('shipments')
        .select(`
          *,
          delegate:delegate_id (name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(1);

      if (searchMode === 'tracking') {
        // البحث برقم البوليصة (بدون حساسية للأحرف الكبيرة/الصغيرة)
        query = query.ilike('tracking_number', `%${trackingNumber.trim()}%`);
      } else {
        // البحث برقم الهاتف (بدون المسافات أو الشرطات)
        const cleanPhone = phone.trim().replace(/[\s\-+]/g, '');
        query = query.ilike('recipient_phone', `%${cleanPhone}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setError(searchMode === 'tracking' 
          ? 'لم يتم العثور على شحنة بهذا الرقم. تأكد من صحة الرقم وحاول مرة أخرى.'
          : 'لم يتم العثور على شحنات بهذا الرقم. تأكد من صحة الرقم وحاول مرة أخرى.');
        return;
      }

      setShipment(data[0]);
    } catch (err) {
      console.error('Error searching shipment:', err);
      setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى لاحقاً.');
      toast({
        title: "فشل البحث",
        description: "حدث خطأ أثناء البحث عن الشحنة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // معالجة الضغط على زر الإدخال
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchShipment();
    }
  };

  // دالة عرض حالة الشحنة بشكل مرئي
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      transit: { label: 'قيد التوصيل', color: 'bg-blue-100 text-blue-800', icon: Truck },
      out_for_delivery: { label: 'خارج للتوصيل', color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      delayed: { label: 'متأخرة', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      returned: { label: 'مرتجعة', color: 'bg-red-100 text-red-800', icon: AlertCircle },
      cancelled: { label: 'ملغاة', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      partial_return: { label: 'مرتجع جزئي', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // دالة عرض تفاصيل الشحنة
  const renderShipmentDetails = () => {
    if (!shipment) return null;

    return (
      <Card className="mt-6 animate-fade-in">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                تفاصيل الشحنة #{shipment.tracking_number}
              </CardTitle>
              <CardDescription className="mt-1">
                تم إنشاء الشحنة في: {new Date(shipment.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </CardDescription>
            </div>
            {renderStatusBadge(shipment.status)}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* معلومات المستلم */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                اسم المستلم
              </Label>
              <div className="p-3 bg-muted/30 rounded-lg font-medium">
                {shipment.recipient_name}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                رقم الهاتف
              </Label>
              <div dir="ltr" className="p-3 bg-muted/30 rounded-lg font-mono font-medium">
                {shipment.recipient_phone}
              </div>
            </div>
          </div>

          {/* العنوان */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              العنوان بالكامل
            </Label>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="font-medium">{shipment.recipient_address}</p>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                {shipment.recipient_city}
              </p>
            </div>
          </div>

          {/* تفاصيل إضافية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="text-sm text-muted-foreground mb-1">المبلغ المستحق (كاش)</Label>
              <p className="text-2xl font-bold text-primary">{shipment.cod_amount.toLocaleString()} ر.س</p>
            </div>
            
            {shipment.delegate && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-sm text-muted-foreground mb-1">المندوب المسؤول</Label>
                <p className="font-medium">{shipment.delegate.name}</p>
                <p dir="ltr" className="text-sm text-blue-600 mt-1 font-mono">{shipment.delegate.phone}</p>
              </div>
            )}
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <Label className="text-sm text-muted-foreground mb-1">حالة التوصيل</Label>
              <div className="mt-2">
                {renderStatusBadge(shipment.status)}
                {shipment.status === 'delivered' && shipment.delivered_at && (
                  <p className="text-xs text-green-600 mt-2">
                    تم التسليم في: {new Date(shipment.delivered_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* إجراءات */}
          <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              <span>للاستفسار عن الشحنة، اتصل بخدمة العملاء</span>
            </div>
            <Button 
              onClick={() => window.open('https://wa.me/01097950437', '_blank')}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              تواصل عبر الواتساب
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // معالجة حالة التحميل الأولي
  if (loading && !shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-xl font-medium text-foreground">جاري تحميل صفحة التتبع...</p>
          <p className="mt-2 text-muted-foreground">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* الشعار والعنوان */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-foreground">
            تتبع شحناتك بسهولة
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            أدخل رقم بوليصة الشحنة أو رقم هاتفك لعرض حالة طلبك الحالي
          </p>
        </div>

        {/* نموذج البحث */}
        <Card className="shadow-xl border-border">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">ابحث عن شحنتك</CardTitle>
            <CardDescription className="mt-2 max-w-md mx-auto">
              اختر طريقة البحث المناسبة لك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* مفاتيح التبديل بين طرق البحث */}
              <div className="flex justify-center gap-4">
                <Button
                  variant={searchMode === 'tracking' ? 'default' : 'outline'}
                  onClick={() => {
                    setSearchMode('tracking');
                    setPhone('');
                  }}
                  className={searchMode === 'tracking' ? 'bg-primary hover:bg-primary/90' : ''}
                >
                  <Package className="h-4 w-4 ml-2" />
                  بالبوليصة
                </Button>
                <Button
                  variant={searchMode === 'phone' ? 'default' : 'outline'}
                  onClick={() => {
                    setSearchMode('phone');
                    setTrackingNumber('');
                  }}
                  className={searchMode === 'phone' ? 'bg-primary hover:bg-primary/90' : ''}
                >
                  <Phone className="h-4 w-4 ml-2" />
                  برقم الهاتف
                </Button>
              </div>

              {/* حقول الإدخال */}
              <div className="space-y-4">
                {searchMode === 'tracking' ? (
                  <div className="space-y-2">
                    <Label htmlFor="tracking-number" className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      رقم البوليصة
                    </Label>
                    <div className="relative">
                      <Input
                        id="tracking-number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value.trim().toUpperCase())}
                        onKeyPress={handleKeyPress}
                        placeholder="أدخل رقم البوليصة (مثال: ABC123456)"
                        className="pr-12 text-lg font-mono"
                        dir="ltr"
                      />
                      <Search 
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-pointer"
                        onClick={searchShipment}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ تأكد من إدخال الرقم بشكل صحيح. مثال: ABC123456 أو TEST123456
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      رقم الهاتف
                    </Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="أدخل رقم الهاتف (مثال: 01012345678)"
                        className="pr-12 text-lg"
                        dir="ltr"
                      />
                      <Search 
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-pointer"
                        onClick={searchShipment}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ أدخل الرقم كاملاً مع كود الدولة (مثال: 966501234567 أو 01012345678)
                    </p>
                  </div>
                )}
              </div>

              {/* زر البحث */}
              <Button 
                onClick={searchShipment} 
                disabled={loading}
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 ml-2" />
                    ابحث عن الشحنة
                  </>
                )}
              </Button>

              {/* رسالة الخطأ */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* رسالة النجاح */}
              {shipment && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-2 text-success">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="font-medium">تم العثور على الشحنة بنجاح!</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* عرض تفاصيل الشحنة */}
        {shipment && renderShipmentDetails()}

        {/* قسم التعليمات */}
        <Card className="mt-8 bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="h-5 w-5 text-primary" />
              كيفية تتبع شحنتك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">1</div>
              <p>ستجد رقم البوليصة على إيصال الاستلام الذي أعطاك إياه التاجر أو مندوب الاستلام.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">2</div>
              <p>أدخل الرقم في الحقل أعلاه واضغط على "ابحث عن الشحنة".</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">3</div>
              <p>ستظهر لك حالة الشحنة الحالية ومعلومات التوصيل التفصيلية.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">4</div>
              <p>إذا واجهتك أي مشكلة، تواصل مع خدمة العملاء عبر الواتساب أو الاتصال الهاتفي.</p>
            </div>
          </CardContent>
        </Card>

        {/* تذييل الصفحة */}
        <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
          <p>© {new Date().getFullYear()} WayFlow Assist. جميع الحقوق محفوظة.</p>
          <p className="mt-2 flex items-center justify-center gap-2">
            <HelpCircle className="h-4 w-4" />
            للاستفسارات: <a href="tel:+201097950437" className="text-primary hover:underline">01097950437</a>
            أو عبر <a href="https://wa.me/01097950437" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> الواتساب
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestOrders;