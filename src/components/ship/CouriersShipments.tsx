/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Printer, ScanLine, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCouriersShipments } from '@/hooks/useCouriersShipments';
import CourierSearchBar from '@/components/ship/CourierSearchBar';
import CourierInfoCard from '@/components/ship/CourierInfoCard';
import ShipmentsAccordion from '@/components/ship/ShipmentsAccordion';
import StatusChangeModal from '@/components/ship/StatusChangeModal';
import ScanDeliveryModal from '@/components/ship/ScanDeliveryModal';
import PrintOptionsModal from '@/components/ship/PrintOptionsModal';
import { toast } from '@/hooks/use-toast';

const CouriersShipments = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, loading: authLoading } = useAuth();
  const {
    delegates,
    sheets,
    returnedSheets,
    shipments,
    courierInfo,
    loading,
    error,
    fetchDelegates,
    fetchSheets,
    fetchReturnedSheets,
    fetchCourierInfo,
    fetchShipments,
    changeShipmentsStatus
  } = useCouriersShipments();

  const [selectedDelegateId, setSelectedDelegateId] = useState<string>('');
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [scanType, setScanType] = useState<'delivery' | 'dispatch' | 'status'>('delivery');

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager', 'courier'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب البيانات الأولية
  useEffect(() => {
    fetchDelegates();
    
    const delegateId = searchParams.get('delegate_id');
    const sheetId = searchParams.get('sheet_id');
    
    if (delegateId) {
      setSelectedDelegateId(delegateId);
      fetchSheets(delegateId);
      fetchReturnedSheets(delegateId);
      fetchCourierInfo(delegateId);
      
      if (sheetId) {
        setSelectedSheetId(sheetId);
        fetchShipments(delegateId, sheetId);
      } else {
        fetchShipments(delegateId);
      }
    }
  }, []);

  // معالجة البحث
  const handleSearch = (delegateId: string, sheetId?: string) => {
    setSelectedDelegateId(delegateId);
    setSelectedSheetId(sheetId || '');
    
    const params = new URLSearchParams();
    params.set('delegate_id', delegateId);
    if (sheetId) params.set('sheet_id', sheetId);
    setSearchParams(params);
    
    fetchSheets(delegateId);
    fetchReturnedSheets(delegateId);
    fetchCourierInfo(delegateId);
    fetchShipments(delegateId, sheetId);
  };

  // معالجة تغيير الحالة
  const handleStatusChange = async (statusId: string, options: any) => {
    if (selectedShipments.length === 0) {
      toast({ 
        title: "خطأ",
        description: "يرجى اختيار شحنات أولاً",
        variant: "destructive" 
      });
      return;
    }

    const result = await changeShipmentsStatus(selectedShipments, statusId, options);
    
    if (result.success) {
      toast({
        title: "تم بنجاح",
        description: "تم تغيير حالة الشحنات بنجاح"
      });
      
      fetchShipments(selectedDelegateId, selectedSheetId);
      setSelectedShipments([]);
      setIsStatusModalOpen(false);
    } else {
      toast({
        title: "فشل العملية",
        description: result.error || "حدث خطأ أثناء تغيير الحالة",
        variant: "destructive"
      });
    }
  };

  // معالجة الطباعة
  const handlePrint = (printType: string) => {
    if (selectedShipments.length === 0) {
      toast({ 
        title: "خطأ",
        description: "يرجى اختيار شحنات أولاً",
        variant: "destructive" 
      });
      return;
    }
    
    toast({
      title: "جاري الطباعة",
      description: "سيتم فتح نافذة الطباعة قريباً"
    });
    setIsPrintModalOpen(false);
  };

  // معالجة المسح الضوئي
  const handleScanSubmit = (data: any) => {
    toast({
      title: "تم المسح بنجاح",
      description: "تم تحديث حالة الشحنات"
    });
    setIsScanModalOpen(false);
    fetchShipments(selectedDelegateId, selectedSheetId);
  };

  if (authLoading || (selectedDelegateId && !courierInfo)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            شحنات المناديب
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة شحنات المناديب وتتبع حالتها
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/add-shipment')}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            إضافة شحنة
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/excel-upload')}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            رفع إكسيل
          </Button>
        </div>
      </div>

      {/* شريط البحث */}
      <CourierSearchBar
        couriers={delegates}
        sheets={sheets}
        onSearch={handleSearch}
        initialCourierId={selectedDelegateId}
        initialSheetId={selectedSheetId}
      />

      {/* معلومات المندوب */}
      {courierInfo && (
        <CourierInfoCard
          courierInfo={courierInfo}
          onAction={(action) => {
            if (action === 'change_status_courier') {
              setIsStatusModalOpen(true);
            }
          }}
        />
      )}

      {/* رسالة خطأ */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {/* جدول الشحنات */}
      {selectedDelegateId && (
        <ShipmentsAccordion
          shipments={shipments}
          loading={loading}
          onShipmentSelect={(shipmentIds) => setSelectedShipments(shipmentIds)}
          onPrint={() => setIsPrintModalOpen(true)}
          onScan={(type) => {
            setScanType(type);
            setIsScanModalOpen(true);
          }}
          onCopyShipments={(waybills) => {
            navigator.clipboard.writeText(waybills.join('\n'));
            toast({ title: "تم النسخ", description: "تم نسخ أرقام البوليصات إلى الحافظة" });
          }}
          onExportExcel={(statusName, shipments) => {
            toast({ title: "جاري التصدير", description: "سيتم تنزيل الملف قريباً" });
          }}
        />
      )}

      {/* مودال تغيير الحالة */}
      <StatusChangeModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        onConfirm={handleStatusChange}
        delegateId={selectedDelegateId}
        sheets={sheets}
        returnedSheets={returnedSheets}
      />

      {/* مودال المسح الضوئي */}
      <ScanDeliveryModal
        open={isScanModalOpen}
        onOpenChange={setIsScanModalOpen}
        onSubmit={handleScanSubmit}
        scanType={scanType}
        delegateId={selectedDelegateId}
        sheets={sheets}
        returnedSheets={returnedSheets}
      />

      {/* مودال الطباعة */}
      <PrintOptionsModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        onConfirm={handlePrint}
      />
    </div>
  );
};

export default CouriersShipments;