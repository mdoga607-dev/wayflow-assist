import { useState } from 'react';
import { 
  ChevronDown, ChevronUp, Printer, ScanLine, FileSpreadsheet,
  Copy, ImageIcon, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Shipment } from '@/hooks/useCouriersShipments';

const statusConfig: Record<string, { label: string; color: string; icon: typeof ScanLine | typeof Printer; }> = {
  'transit': { label: 'قيد التوصيل', color: 'bg-blue-100 text-blue-800', icon: ScanLine },
  'warehouse': { label: 'في المخزن', color: 'bg-gray-100 text-gray-800', icon: Printer },
  'pending': { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: ScanLine },
  'delivered': { label: 'تم التسليم', color: 'bg-green-100 text-green-800', icon: Printer },
  'delayed': { label: 'متأخر', color: 'bg-red-100 text-red-800', icon: ScanLine },
  'returned': { label: 'مرتجع', color: 'bg-purple-100 text-purple-800', icon: Printer }
};

interface ShipmentsAccordionProps {
  shipments: Record<string, Shipment[]>;
  loading: boolean;
  onShipmentSelect: (shipmentIds: string[]) => void;
  onPrint: () => void;
  onScan: (type: 'delivery' | 'dispatch' | 'status') => void;
  onCopyShipments: (waybills: string[]) => void;
  onExportExcel: (statusName: string, shipments: Shipment[]) => void;
}

const ShipmentsAccordion = ({
  shipments,
  loading,
  onShipmentSelect,
  onPrint,
  onScan,
  onCopyShipments,
  onExportExcel
}: ShipmentsAccordionProps) => {
  const [openStatuses, setOpenStatuses] = useState<Record<string, boolean>>({});
  const [selectedPerStatus, setSelectedPerStatus] = useState<Record<string, string[]>>({});

  const handleSelectAll = (statusId: string, checked: boolean) => {
    setSelectedPerStatus(prev => {
      const newSelection = { ...prev };
      if (checked) {
        newSelection[statusId] = shipments[statusId].map(s => s.id);
      } else {
        delete newSelection[statusId];
      }
      const allSelected = Object.values(newSelection).flat();
      onShipmentSelect(allSelected);
      return newSelection;
    });
  };

  const handleCheckboxChange = (statusId: string, shipmentId: string, checked: boolean) => {
    setSelectedPerStatus(prev => {
      const newSelection = { ...prev };
      if (!newSelection[statusId]) newSelection[statusId] = [];
      
      if (checked) {
        newSelection[statusId] = [...newSelection[statusId], shipmentId];
      } else {
        newSelection[statusId] = newSelection[statusId].filter(id => id !== shipmentId);
      }
      
      const allSelected = Object.values(newSelection).flat();
      onShipmentSelect(allSelected);
      return newSelection;
    });
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">جاري تحميل الشحنات...</p>
      </Card>
    );
  }

  if (Object.keys(shipments).length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">لا توجد شحنات لعرضها</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(shipments).map(([statusId, statusShipments]) => {
        const config = statusConfig[statusId] || { label: statusId, color: 'bg-gray-100 text-gray-800', icon: Printer };
        const Icon = config.icon;
        const isOpen = openStatuses[statusId] ?? false;
        
        const allSelected = statusShipments.length > 0 && selectedPerStatus[statusId]?.length === statusShipments.length;
        const someSelected = selectedPerStatus[statusId]?.length > 0 && selectedPerStatus[statusId].length < statusShipments.length;

        return (
          <Card key={statusId} className="overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => setOpenStatuses(prev => ({ ...prev, [statusId]: !prev[statusId] }))}
            >
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center cursor-pointer",
                    someSelected ? "bg-primary border-primary" : "",
                    allSelected ? "bg-primary border-primary" : "border-gray-300"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAll(statusId, !allSelected);
                  }}
                >
                  {someSelected && <div className="w-3 h-0.5 bg-white rounded-full"></div>}
                  {allSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                
                <Icon className="h-5 w-5 text-primary" />
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-sm text-muted-foreground">({statusShipments.length})</span>
                  </div>
                  {['transit', 'pending'].includes(statusId) && (
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onScan(statusId === 'transit' ? 'delivery' : 'dispatch');
                        }}
                      >
                        <ScanLine className="h-3 w-3" /> مسح ضوئي
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrint();
                        }}
                      >
                        <Printer className="h-3 w-3" /> طباعة
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); onCopyShipments(statusShipments.map(s => s.tracking_number)); }}>
                  <Copy className="h-3 w-3" /> نسخ الأرقام
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); onExportExcel(config.label, statusShipments); }}>
                  <FileSpreadsheet className="h-3 w-3" /> تصدير
                </Button>
                {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </div>
            </div>

            {isOpen && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead>رقم البوليصة</TableHead>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>المرسل</TableHead>
                      <TableHead>المستلم</TableHead>
                      <TableHead>المنطقة</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>سبب الحالة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusShipments.map((shipment) => (
                      <TableRow key={shipment.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedPerStatus[statusId]?.includes(shipment.id) || false}
                            onCheckedChange={(checked) => handleCheckboxChange(statusId, shipment.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="text-xs">{new Date(shipment.created_at).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="font-mono font-medium">{shipment.tracking_number}</TableCell>
                        <TableCell>{shipment.order_id || '-'}</TableCell>
                        <TableCell>{shipment.shipper_name}</TableCell>
                        <TableCell>{shipment.recipient_name}</TableCell>
                        <TableCell>{shipment.recipient_area}</TableCell>
                        <TableCell dir="ltr" className="font-mono">{shipment.recipient_phone}</TableCell>
                        <TableCell>{shipment.status_reason || '-'}</TableCell>
                        <TableCell className="font-semibold">{shipment.cod_amount ? `${shipment.cod_amount} ر.س` : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`/track/${shipment.tracking_number}`, '_blank')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Printer className="h-4 w-4 ml-2" /> طباعة بوليصة
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ImageIcon className="h-4 w-4 ml-2" /> عرض الصور
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive font-medium">
                                  <FileSpreadsheet className="h-4 w-4 ml-2" /> حذف الشحنة
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default ShipmentsAccordion;