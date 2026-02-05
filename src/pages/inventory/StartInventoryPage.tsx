/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/inventory/StartInventoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Package,
  ArrowLeft,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Loader2,
  AlertCircle,
  Database,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Inventory {
  id: string;
  name: string;
  branch_name: string;
  total_items: number;
  counted_items: number;
  status: string;
}

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  status: string;
  created_at: string;
}

const StartInventoryPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { role, loading: authLoading } = useAuth();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [counting, setCounting] = useState(false);
  const [countedShipments, setCountedShipments] = useState<Set<string>>(new Set());

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لبدء عمليات الجرد",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات الجرد والشحنات
  const fetchInventoryData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // جلب بيانات الجرد
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          *,
          branch:branch_id (name)
        `)
        .eq('id', id)
        .single();

      if (inventoryError) throw inventoryError;
      
      // التحقق من حالة الجرد
      if (inventoryData.status !== 'in_progress') {
        toast({
          title: "خطأ في الحالة",
          description: "هذه العملية ليست قيد التنفيذ. يرجى بدء الجرد أولاً.",
          variant: "destructive"
        });
        navigate(`/app/inventory/${id}`);
        return;
      }
      
      setInventory({
        id: inventoryData.id,
        name: inventoryData.name,
        branch_name: inventoryData.branch?.name || 'غير محدد',
        total_items: inventoryData.total_items || 0,
        counted_items: inventoryData.counted_items || 0,
        status: inventoryData.status
      });
      
      // جلب الشحنات في الفرع
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select('id, tracking_number, recipient_name, status, created_at')
        .eq('branch_id', inventoryData.branch_id)
        .in('status', ['pending', 'transit', 'out_for_delivery'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (shipmentsError) throw shipmentsError;
      
      setShipments(shipmentsData || []);
    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل بيانات الجرد. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      navigate('/app/inventory');
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '') && id) {
      fetchInventoryData();
    }
  }, [authLoading, role, id]);

  // تطبيق البحث
  const filteredShipments = shipments.filter(shipment => 
    shipment.tracking_number.includes(searchTerm) ||
    shipment.recipient_name.includes(searchTerm)
  );

  // عد شحنة
  const handleCountShipment = async (shipmentId: string, trackingNumber: string) => {
    if (!id || !inventory) return;
    
    if (countedShipments.has(shipmentId)) {
      toast({
        title: "ملاحظة",
        description: "هذه الشحنة تم عدها مسبقاً",
        variant: "default"
      });
      return;
    }
    
    setCounting(true);
    try {
      // تسجيل الحركة في السجل
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert([{
          inventory_id: id,
          shipment_id: shipmentId,
          expected_quantity: 1,
          counted_quantity: 1,
          discrepancy: 0,
          status: 'matched',
          notes: 'تم العد يدوياً'
        }]);

      if (logError) throw logError;
      
      // تحديث عملية الجرد
        const { error: updateError } = await supabase
        .from('inventory')
        .update({
          counted_items: inventory.counted_items + 1
        })
        
        .eq('id', id);

      if (updateError) throw updateError;
      
      // تحديث الحالة المحلية
      setCountedShipments(prev => new Set(prev).add(shipmentId));
      setInventory(prev => prev ? ({
        ...prev,
        counted_items: prev.counted_items + 1
      }) : null);
      
      toast({
        title: "تم العد بنجاح",
        description: `تم عد الشحنة ${trackingNumber} بنجاح`
      });
    } catch (error: any) {
      console.error('Error counting shipment:', error);
      toast({
        title: "فشل العد",
        description: error.message || "حدث خطأ أثناء عد الشحنة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setCounting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات الجرد...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">لم يتم العثور على عملية الجرد</h2>
          <p className="text-gray-600 mb-6">
            يرجى التحقق من الرابط أو العودة إلى صفحة عمليات الجرد.
          </p>
          <Button onClick={() => navigate('/app/inventory')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            العودة إلى عمليات الجرد
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
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/app/inventory/${id}`)}
            className="mb-2 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة إلى التفاصيل
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-purple-600" />
            {inventory.name}
          </h1>
          <p className="text-gray-600 mt-1">
            عد الشحنات في فرع {inventory.branch_name} - {inventory.counted_items}/{inventory.total_items} شحنة
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={fetchInventoryData}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            تحديث القائمة
          </Button>
          <Badge className="px-3 py-1 bg-purple-100 text-purple-800">
            <TrendingUp className="h-3 w-3 inline-block ml-1" />
            {inventory.total_items > 0 
              ? `${Math.round((inventory.counted_items / inventory.total_items) * 100)}%` 
              : '0%'} 
            مكتمل
          </Badge>
        </div>
      </div>

      {/* معلومات الحالة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الشحنات</p>
                <p className="text-2xl font-bold text-gray-900">{inventory.total_items}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">تم العد</p>
                <p className="text-2xl font-bold text-blue-700">{inventory.counted_items}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المتبقي</p>
                <p className="text-2xl font-bold text-purple-700">
                  {Math.max(0, inventory.total_items - inventory.counted_items)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* البحث والعد */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">قائمة الشحنات</CardTitle>
          <CardDescription>
            ابحث عن الشحنة وعدّها بالنقر على زر "عد الشحنة"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث برقم التتبع أو اسم المستلم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد شحنات</p>
              <p className="max-w-md mx-auto">
                {searchTerm 
                  ? "لم يتم العثور على شحنات مطابقة لمعايير البحث" 
                  : "لم يتم العثور على شحنات في هذا الفرع أو تم عد جميع الشحنات"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {filteredShipments.map((shipment) => (
                <Card 
                  key={shipment.id} 
                  className={`hover:shadow-md transition-shadow ${
                    countedShipments.has(shipment.id) ? 'border-green-500 bg-green-50' : ''
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <span className="font-mono font-medium text-blue-700">{shipment.tracking_number}</span>
                          {countedShipments.has(shipment.id) && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 inline-block ml-1" />
                              تم العد
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-700">{shipment.recipient_name}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar })}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {shipment.status === 'pending' ? 'قيد الانتظار' : 
                             shipment.status === 'transit' ? 'في الطريق' : 'خارج للتوصيل'}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleCountShipment(shipment.id, shipment.tracking_number)}
                        disabled={counting || countedShipments.has(shipment.id)}
                        className={`min-w-[120px] ${
                          countedShipments.has(shipment.id) 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-purple-600 hover:bg-purple-700'
                        } text-white gap-2`}
                      >
                        {counting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : countedShipments.has(shipment.id) ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            تم العد
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            عد الشحنة
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-800">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>تأكد من وجود الشحنة فعلياً قبل عدها</li>
                <li>الشحنات التي تم عدها ستظهر باللون الأخضر مع علامة صح</li>
                <li>يمكنك البحث عن الشحنة برقم التتبع أو اسم المستلم</li>
                <li>بعد الانتهاء من عد جميع الشحنات، ارجع إلى صفحة التفاصيل وأنهِ عملية الجرد</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StartInventoryPage;