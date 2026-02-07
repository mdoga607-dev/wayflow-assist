/* eslint-disable @typescript-eslint/no-explicit-any */
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
  CardDescription,
  CardFooter  
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Checkbox 
} from '@/components/ui/checkbox';
import { 
  Truck, 
  Package, 
  Plus, 
  X, 
  Loader2, 
  AlertCircle,
  MapPin,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_address: string;
  recipient_city: string;
  recipient_area?: string;
  cod_amount: number;
  status: string;
  created_at: string;
}

interface Delegate {
  id: string;
  name: string;
  phone: string;
  city: string;
}

interface Store {
  id: string;
  name: string;
  city: string;
}

const CreatePickupSheetPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [selectedDelegate, setSelectedDelegate] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const shipmentIdsParam = searchParams.get('shipment_ids');
  const shipmentIds = shipmentIdsParam ? shipmentIdsParam.split(',') : [];

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager', 'admin'].includes(role)) {
      toast({ 
        title: "غير مصرح", 
        description: "ليس لديك الصلاحية لإنشاء شيتات البيك أب", 
        variant: "destructive" 
      });
      navigate('/app');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        
        // تصحيح: إضافة data: قبل اسم المتغير
        const { data: shipmentsData, error: shipmentsError } = await supabase
          .from('shipments')
          .select(`
            id,
            tracking_number,
            recipient_name,
            recipient_address,
            recipient_city,
            recipient_area,
            cod_amount,
            status,
            created_at
          `)
          .is('sheet_id', null)
          .in('status', ['pending', 'pickup_requested'])
          .order('created_at', { ascending: false });

        if (shipmentsError) throw shipmentsError;
        setShipments(shipmentsData || []);
        
        if (shipmentIds.length > 0) {
          const validIds = shipmentsData
            ?.filter(s => shipmentIds.includes(s.id))
            .map(s => s.id) || [];
          setSelectedShipments(validIds);
        }

        // جلب المناديب من جدول delegates
        const { data: delegatesData, error: delegatesError } = await supabase
          .from('delegates')
          .select('id, name, phone, city')
          .eq('status', 'active')
          .order('name');

        if (delegatesError) throw delegatesError;
        setDelegates(delegatesData?.map((d: any) => ({
            id: d.id,
            name: d.name,
            phone: d.phone || '',
            city: d.city || ''
        })) || []);

        const { data: storesData, error: storesError } = await supabase
          .from('branches') // تأكد من اسم الجدول (branches أو stores)
          .select('id, name, city')
          .order('name');

        if (storesError) throw storesError;
        setStores(storesData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "فشل التحميل",
          description: "حدث خطأ أثناء تحميل البيانات.",
          variant: "destructive",
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [shipmentIdsParam]);

  const handleCreateSheet = async () => {
    if (selectedShipments.length === 0) {
      toast({ title: "خطأ", description: "يرجى اختيار شحنات للشيت", variant: "destructive" });
      return;
    }
    if (!selectedDelegate) {
      toast({ title: "خطأ", description: "يرجى اختيار مندوب", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // تصحيح: rpc تعيد data دائماً
      const { data: result, error }: any = await supabase.rpc('create_pickup_sheet', {
        p_delegate_id: selectedDelegate,
        p_store_id: selectedStore || null,
        p_shipment_ids: selectedShipments
      });

      if (error) throw error;

      // التعامل مع النتيجة (تعتمد على ما تعيده الدالة في قاعدة البيانات)
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إنشاء شيت بيك أب جديد بنجاح",
      });

      setTimeout(() => {
        navigate('/app/sheets?sheet_type=pickup');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating pickup sheet:', error);
      toast({
        title: "فشل الإنشاء",
        description: error.message || "حدث خطأ أثناء إنشاء الشيت",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedShipments.length === shipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(shipments.map(s => s.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      'pending': { label: 'قيد الانتظار', color: 'bg-gray-100 text-gray-800' },
      'pickup_requested': { label: 'طلب بيك أب', color: 'bg-blue-100 text-blue-800' },
      'transit': { label: 'في الطريق', color: 'bg-purple-100 text-purple-800' },
      'delivered': { label: 'تم التسليم', color: 'bg-green-100 text-green-800' },
    };
    return badges[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-6xl" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Truck className="h-7 w-7 text-primary" />
            إنشاء شيت بيك أب جديد
          </h1>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <X className="h-4 w-4" /> إلغاء
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  اختيار الشحنات ({selectedShipments.length}/{shipments.length})
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectedShipments.length > 0 && selectedShipments.length === shipments.length}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="select-all">تحديد الكل</Label>
              </div>
            </CardHeader>
            <CardContent>
              {shipments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">لا توجد شحنات متاحة</div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {shipments.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Checkbox 
                        checked={selectedShipments.includes(s.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedShipments([...selectedShipments, s.id]);
                          else setSelectedShipments(selectedShipments.filter(id => id !== s.id));
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-bold">{s.tracking_number}</p>
                        <p className="text-sm text-muted-foreground">{s.recipient_name} - {s.recipient_city}</p>
                      </div>
                      <Badge className={getStatusBadge(s.status).color}>{getStatusBadge(s.status).label}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">تفاصيل الاستلام</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>المندوب</Label>
                <Select value={selectedDelegate} onValueChange={setSelectedDelegate}>
                  <SelectTrigger><SelectValue placeholder="اختر مندوب" /></SelectTrigger>
                  <SelectContent>
                    {delegates.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name} ({d.city})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الفرع (اختياري)</Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger><SelectValue placeholder="اختر فرع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون فرع</SelectItem>
                    {stores.map(st => (
                      <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full py-6 text-lg" 
                disabled={loading || selectedShipments.length === 0 || !selectedDelegate}
                onClick={handleCreateSheet}
              >
                {loading ? <Loader2 className="animate-spin" /> : "إنشاء الشيت الآن"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatePickupSheetPage;