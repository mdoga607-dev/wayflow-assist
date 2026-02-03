/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/AddPickupRequestPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Truck, MapPin, Clock, Calendar as CalendarIcon,
  Plus, X, Loader2, AlertCircle, User, Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const AddPickupRequestPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  
  const [shippers, setShippers] = useState<any[]>([]);
  const [delegates, setDelegates] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('10:00');
  
  const [formData, setFormData] = useState({
    shipper_id: '',
    delegate_id: '',
    store_id: '',
    pickup_address: '',
    notes: '',
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإنشاء طلبات البيك أب",
        variant: "destructive"
      });
      navigate('/unauthorized', { replace: true });
    }
  }, [authLoading, role, navigate]);

  // جلب البيانات
  useEffect(() => {
    if (authLoading || !role) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // جلب التجار النشطين
        const { data: shippersData, error: shippersError } = await supabase
          .from('shippers')
          .select('id, name, phone, city')
          .eq('status', 'active')
          .order('name');

        // جلب المناديب النشطين
        const { data: delegatesData, error: delegatesError } = await supabase
          .from('delegates')
          .select('id, name, phone, city')
          .eq('status', 'active')
          .order('name');

        // جلب المتاجر النشطة
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, name, address, city')
          .eq('status', 'active')
          .order('name');

        if (shippersError || delegatesError || storesError) {
          throw new Error('فشل تحميل البيانات الأساسية');
        }

        setShippers(shippersData || []);
        setDelegates(delegatesData || []);
        setStores(storesData || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: "فشل التحميل",
          description: error.message || "حدث خطأ أثناء تحميل البيانات الأساسية. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, role]);

  // معالجة الإرسال
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.shipper_id) {
      toast({ title: "خطأ", description: "يرجى اختيار التاجر", variant: "destructive" });
      return;
    }

    if (!formData.pickup_address.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال عنوان الاستلام", variant: "destructive" });
      return;
    }

    if (!date) {
      toast({ title: "خطأ", description: "يرجى اختيار تاريخ الاستلام", variant: "destructive" });
      return;
    }

    const [hours, minutes] = time.split(':');
    const pickupDateTime = new Date(date);
    pickupDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (pickupDateTime < new Date()) {
      toast({
        title: "خطأ",
        description: "وقت الاستلام يجب أن يكون في المستقبل",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('pickup_requests')
        .insert([{
          shipper_id: formData.shipper_id,
          delegate_id: formData.delegate_id || null,
          store_id: formData.store_id || null,
          pickup_address: formData.pickup_address.trim(),
          pickup_time: pickupDateTime.toISOString(),
          notes: formData.notes.trim() || null,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إنشاء طلب بيك أب جديد بنجاح"
      });

      setFormData({
        shipper_id: '',
        delegate_id: '',
        store_id: '',
        pickup_address: '',
        notes: '',
      });

      setDate(new Date());
      setTime('10:00');

      setTimeout(() => {
        navigate('/app/pickup-requests');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating pickup request:', err);
      toast({
        title: "فشل الإضافة",
        description: err.message || "حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // شاشة التحميل
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="inline-block animate-spin h-12 w-12 text-primary" />
          <p className="mt-4 text-lg font-medium">
            {authLoading ? 'جاري التحقق من الصلاحيات...' : 'جاري تحميل البيانات...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto" dir="rtl">
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader className="bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Truck className="text-primary" />
                إضافة طلب بيك أب جديد
              </CardTitle>
              <CardDescription className="mt-1">
                أدخل تفاصيل طلب استلام الشحنات من التاجر
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/app/pickup-requests')}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* اختيار التاجر والمندوب */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="shipper" className="flex items-center gap-1">
                  <User className="w-4 h-4 text-primary" />
                  التاجر <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.shipper_id} 
                  onValueChange={(v) => setFormData({...formData, shipper_id: v})}
                  required
                >
                  <SelectTrigger id="shipper">
                    <SelectValue placeholder="اختر التاجر" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippers.length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        لا يوجد تجار متاحين
                      </SelectItem>
                    ) : (
                      shippers.map((shipper) => (
                        <SelectItem key={shipper.id} value={shipper.id}>
                          <div className="flex justify-between w-full">
                            <span>{shipper.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {shipper.city} - {shipper.phone}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delegate">المندوب (اختياري)</Label>
                <Select 
                  value={formData.delegate_id} 
                  onValueChange={(v) => setFormData({...formData, delegate_id: v})}
                >
                  <SelectTrigger id="delegate">
                    <SelectValue placeholder="تعيين مندوب محدد (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تعيين</SelectItem>
                    {delegates.length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        لا يوجد مندوبين متاحين
                      </SelectItem>
                    ) : (
                      delegates.map((delegate) => (
                        <SelectItem key={delegate.id} value={delegate.id}>
                          {delegate.name} ({delegate.city})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* اختيار الفرع */}
            <div className="space-y-2">
              <Label htmlFor="store" className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-primary" />
                الفرع (اختياري)
              </Label>
              <Select 
                value={formData.store_id} 
                onValueChange={(v) => setFormData({...formData, store_id: v})}
              >
                <SelectTrigger id="store">
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون اختيار فرع</SelectItem>
                  {stores.length === 0 ? (
                    <SelectItem value="no-data" disabled>
                      لا يوجد فروع متاحة
                    </SelectItem>
                  ) : (
                    stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} ({store.city})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* عنوان الاستلام */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" />
                عنوان الاستلام بالتفصيل <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.pickup_address}
                onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                placeholder="مثال: القاهرة، مدينة نصر، شارع عباس العقاد، عمارة 5، الدور الثالث"
                rows={4}
                required
                className="resize-none"
              />
            </div>

            {/* التاريخ والوقت */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  تاريخ الاستلام <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ar }) : <span>اختر التاريخ</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary" />
                  وقت الاستلام <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  min="08:00"
                  max="20:00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  أوقات العمل: من 8 صباحاً حتى 8 مساءً
                </p>
              </div>
            </div>

            {/* الملاحظات */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="أي تعليمات خاصة للمندوب (مثل: الاتصال قبل الوصول، المبنى خلف البنك)"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* ملاحظات هامة */}
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h3 className="font-medium text-blue-800 text-sm">ملاحظات هامة:</h3>
                    <ul className="text-xs text-blue-700 space-y-0.5 pr-2">
                      <li>• سيتم إرسال إشعار فوري للتاجر والمندوب عند إنشاء الطلب</li>
                      <li>• يمكن تعديل أو إلغاء الطلب قبل تعيين مندوب للاستلام</li>
                      <li>• التأكيد على وجود الشحنات جاهزة للاستلام في الوقت المحدد</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* أزرار الإرسال */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/app/pickup-requests')}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.shipper_id || !formData.pickup_address.trim()}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    إنشاء طلب البيك أب
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddPickupRequestPage;