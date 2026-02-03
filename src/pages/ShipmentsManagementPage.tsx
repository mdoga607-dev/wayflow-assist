/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ShipmentsManagementPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Printer, FileSpreadsheet, RefreshCcw, 
  Loader2, Copy, Plus 
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_area: string;
  cod_amount: number;
  status: string;
  created_at: string;
  product_name?: string;
  areas?: { name: string }; // إضافة هذا للـ relation
}

// ترجمة حالات الشحنات
const statusLabels: Record<string, string> = {
  'pending': 'قيد الانتظار',
  'transit': 'في الطريق',
  'out_for_delivery': 'خارج للتوصيل',
  'delivered': 'تم التسليم',
  'delayed': 'متأخرة',
  'returned': 'مرتجعة',
  'cancelled': 'ملغاة',
  'to_warehouse': 'في الطريق للمخزن',
  'to_branch': 'في الطريق للفـرع',
  'returned_to_warehouse': 'في الطريق لمخزن المرتجعات'
};

// ألوان الحالات
const statusColors: Record<string, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'transit': 'bg-blue-100 text-blue-800',
  'out_for_delivery': 'bg-purple-100 text-purple-800',
  'delivered': 'bg-green-100 text-green-800',
  'delayed': 'bg-yellow-100 text-yellow-800',
  'returned': 'bg-red-100 text-red-800',
  'cancelled': 'bg-gray-100 text-gray-800',
  'to_warehouse': 'bg-orange-100 text-orange-800',
  'to_branch': 'bg-indigo-100 text-indigo-800',
  'returned_to_warehouse': 'bg-pink-100 text-pink-800'
};

const ShipmentsManagementPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [groupedShipments, setGroupedShipments] = useState<Record<string, Shipment[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedShipments, setSelectedShipments] = useState<Record<string, string[]>>({});
  const [changingStatus, setChangingStatus] = useState(false);

  // ✅ التحقق من الصلاحيات
  useEffect(() => {
    if (authLoading) return;
    if (!role || !['head_manager', 'manager', 'courier'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية للوصول إلى هذه الصفحة",
        variant: "destructive"
      });
      navigate('/unauthorized', { replace: true });
    }
  }, [authLoading, role, navigate]);

  // ✅ جلب الشحنات بعد التحقق من الصلاحيات
  useEffect(() => {
    if (authLoading || !role) return;
    
    fetchShipments();
  }, [authLoading, role]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id, tracking_number, recipient_name, recipient_phone, recipient_address, 
          recipient_area, cod_amount, status, created_at, product_name,
          areas:area_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // ✅ تجميع الشحنات حسب الحالة
      const grouped: Record<string, Shipment[]> = {};
      const normalizedData: Shipment[] = (data || []).map((shipment: any) => ({
        ...shipment,
        recipient_area: shipment.areas?.name || shipment.recipient_area || 'غير معروف',
        areas: undefined // إزالة الـ areas object لتجنب خطأ TypeScript
      }));
      
      normalizedData.forEach((shipment: Shipment) => {
        const status = shipment.status || 'pending';
        if (!grouped[status]) grouped[status] = [];
        grouped[status].push(shipment);
      });

      setShipments(normalizedData);
      setGroupedShipments(grouped);
      setSelectedShipments(Object.keys(grouped).reduce((acc, key) => {
        acc[key] = [];
        return acc;
      }, {} as Record<string, string[]>));
    } catch (error: any) {
      console.error('Error fetching shipments:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل الشحنات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectShipment = (status: string, shipmentId: string, checked: boolean) => {
    setSelectedShipments(prev => {
      const current = [...(prev[status] || [])];
      if (checked) {
        current.push(shipmentId);
      } else {
        const index = current.indexOf(shipmentId);
        if (index > -1) current.splice(index, 1);
      }
      return { ...prev, [status]: current };
    });
  };

  const handleSelectAll = (status: string, checked: boolean) => {
    setSelectedShipments(prev => {
      const allIds = groupedShipments[status]?.map(s => s.id) || [];
      return { ...prev, [status]: checked ? allIds : [] };
    });
  };

  const handleExportExcel = (status: string) => {
    const selected = selectedShipments[status] || [];
    const shipmentsToExport = groupedShipments[status]?.filter(s => selected.includes(s.id)) || [];
    
    if (shipmentsToExport.length === 0) {
      toast({ title: "تنبيه", description: "لم يتم اختيار أي شحنات للتصدير", variant: "destructive" });
      return;
    }

    // ✅ تصدير إلى CSV (يمكن تحويله إلى Excel)
    const csvContent = [
      ['رقم التتبع', 'اسم المستلم', 'الهاتف', 'العنوان', 'المنطقة', 'المبلغ', 'الحالة', 'المنتج'],
      ...shipmentsToExport.map(s => [
        s.tracking_number,
        s.recipient_name,
        s.recipient_phone,
        s.recipient_address,
        s.recipient_area,
        s.cod_amount.toString(),
        statusLabels[s.status] || s.status,
        s.product_name || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `شحنات_${statusLabels[status]}_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "تم التصدير", description: `تم تصدير ${shipmentsToExport.length} شحنة بنجاح` });
  };

  const handlePrint = (status: string) => {
    const selected = selectedShipments[status] || [];
    if (selected.length === 0) {
      toast({ title: "تنبيه", description: "لم يتم اختيار أي شحنات للطباعة", variant: "destructive" });
      return;
    }
    
    // ✅ التوجيه إلى صفحة الطباعة مع الـ IDs المختارة
    navigate(`/app/print-shipments?ids=${selected.join(',')}`);
  };

  const handleCopyShipments = (status: string) => {
    const selected = selectedShipments[status] || [];
    if (selected.length === 0) {
      toast({ title: "تنبيه", description: "لم يتم اختيار أي شحنات للنسخ", variant: "destructive" });
      return;
    }
    
    const textToCopy = selected.map(id => {
      const shipment = groupedShipments[status]?.find(s => s.id === id);
      return shipment?.tracking_number || id;
    }).join('\n');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({ title: "تم النسخ", description: `تم نسخ ${selected.length} رقم شحنة إلى الحافظة` });
    }).catch(() => {
      toast({ title: "فشل النسخ", description: "حدث خطأ أثناء النسخ", variant: "destructive" });
    });
  };

  const handleStatusChange = async (status: string, newStatus: string) => {
    const selected = selectedShipments[status] || [];
    if (selected.length === 0) {
      toast({ title: "تنبيه", description: "لم يتم اختيار أي شحنات للتغيير", variant: "destructive" });
      return;
    }

    if (!newStatus) return;

    setChangingStatus(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ status: newStatus })
        .in('id', selected);

      if (error) throw error;

      toast({ 
        title: "تم التحديث", 
        description: `تم تغيير حالة ${selected.length} شحنة إلى "${statusLabels[newStatus] || newStatus}" بنجاح` 
      });
      
      // إعادة تحميل البيانات بعد التغيير
      fetchShipments();
      // إلغاء التحديد
      setSelectedShipments(prev => ({ ...prev, [status]: [] }));
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "فشل التحديث",
        description: error.message || "حدث خطأ أثناء تغيير حالة الشحنات",
        variant: "destructive"
      });
    } finally {
      setChangingStatus(false);
    }
  };

  // شاشة التحميل
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="inline-block animate-spin h-12 w-12 text-primary" />
          <p className="mt-4 text-lg font-medium">جاري تحميل الشحنات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-primary" />
            إدارة الشحنات
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة جميع الشحنات حسب حالاتها ({shipments.length} شحنة إجمالي)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={fetchShipments}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button onClick={() => navigate('/app/add-shipment')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة شحنة
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={Object.keys(groupedShipments)} className="w-full divide-y-0">
            {Object.entries(groupedShipments).map(([status, items]) => (
              <AccordionItem value={status} key={status} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/50">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={statusColors[status]}>
                        {statusLabels[status] || status}
                      </Badge>
                      <span>({items.length})</span>
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExportExcel(status)}
                        title="تصدير إكسل"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrint(status)}
                        title="طباعة"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyShipments(status)}
                        title="نسخ أرقام الشحنات"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <input
                            type="checkbox"
                            checked={selectedShipments[status]?.length === items.length && items.length > 0}
                            onChange={(e) => handleSelectAll(status, e.target.checked)}
                          />
                        </TableHead>
                        <TableHead>رقم التتبع</TableHead>
                        <TableHead>المستلم</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>المنطقة</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>المنتج</TableHead>
                        <TableHead className="text-center">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((shipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedShipments[status]?.includes(shipment.id) || false}
                              onChange={(e) => handleSelectShipment(status, shipment.id, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell className="font-mono">{shipment.tracking_number}</TableCell>
                          <TableCell>{shipment.recipient_name}</TableCell>
                          <TableCell className="font-mono">{shipment.recipient_phone}</TableCell>
                          <TableCell className="truncate max-w-md">{shipment.recipient_address}</TableCell>
                          <TableCell>{shipment.recipient_area}</TableCell>
                          <TableCell className="font-bold">{shipment.cod_amount.toLocaleString()} ج.م</TableCell>
                          <TableCell className="truncate max-w-xs">{shipment.product_name || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/app/shipments/${shipment.id}`)}
                            >
                              عرض التفاصيل
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* خيارات التغيير الجماعي */}
                  {selectedShipments[status]?.length > 0 && (
                    <div className="p-3 bg-muted flex flex-wrap items-center gap-3 border-t">
                      <span className="font-medium">
                        {selectedShipments[status].length} شحنة مختارة
                      </span>
                      <Select onValueChange={(value) => handleStatusChange(status, value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="تغيير الحالة..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {changingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {Object.keys(groupedShipments).length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              لا توجد شحنات حالياً
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentsManagementPage;