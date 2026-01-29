import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Loader2, Printer, Package, Download } from "lucide-react";
import { useSheets } from "@/hooks/useSheets";
import { toast } from "@/hooks/use-toast";

// تعريف أنواع النتائج بشكل صحيح
interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  status: string;
  cod_amount?: number;
  shipper_name: string;
}

interface SheetDetailsSuccess {
  success: true;
  shipments: Shipment[];
}

interface SheetDetailsError {
  success: false;
  error: string;
}

type SheetDetailsResult = SheetDetailsSuccess | SheetDetailsError;

interface SheetDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: string;
}

const SheetDetailsModal = ({ open, onOpenChange, sheetId }: SheetDetailsModalProps) => {
  const { getSheetDetails, loading } = useSheets();
  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    if (open && sheetId) {
      loadSheetDetails();
    }
  }, [open, sheetId]);

  const loadSheetDetails = async () => {
    const result = (await getSheetDetails(sheetId)) as SheetDetailsResult;
    
    if (result.success) {
      setShipments(result.shipments);
    } else {
      toast({ 
        title: "خطأ", 
        description: result.error || "فشل تحميل تفاصيل الشيت",
        variant: "destructive"
      });
      onOpenChange(false);
    }
  };

  const handlePrint = () => {
    window.print();
    toast({ title: "تمت الطباعة", description: "يمكنك طباعة هذه الصفحة من متصفحك" });
  };

  const handleExport = () => {
    // تصدير إلى Excel
    const csvContent = "data:text/csv;charset=utf-8," + 
      "رقم البوليصة,المستلم,الهاتف,الحالة,المبلغ,المرسل\n" +
      shipments.map(s => 
        `${s.tracking_number},${s.recipient_name},${s.recipient_phone},${s.status},${s.cod_amount || 0},${s.shipper_name}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sheet-${sheetId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "تم التصدير", description: "تم تنزيل الملف كـ CSV" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            تفاصيل الشيت
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">جاري تحميل تفاصيل الشيت...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">إجمالي الشحنات: {shipments.length}</p>
              <p className="font-medium">
                مبلغ التحصيل الكلي: {shipments.reduce((sum, s) => sum + (s.cod_amount || 0), 0).toLocaleString()} ر.س
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم البوليصة</TableHead>
                    <TableHead>المستلم</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>المرسل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id} className="border-b">
                      <TableCell className="font-mono font-medium">{shipment.tracking_number}</TableCell>
                      <TableCell>{shipment.recipient_name}</TableCell>
                      <TableCell dir="ltr" className="font-mono">{shipment.recipient_phone}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'transit' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === 'returned' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {shipment.status === 'delivered' ? 'تم التسليم' :
                           shipment.status === 'transit' ? 'قيد التوصيل' :
                           shipment.status === 'returned' ? 'مرتجع' : 'أخرى'}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {shipment.cod_amount ? `${shipment.cod_amount.toLocaleString()} ر.س` : '-'}
                      </TableCell>
                      <TableCell>{shipment.shipper_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4 ml-2" />
            تصدير CSV
          </Button>
          <Button onClick={handlePrint} disabled={loading}>
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SheetDetailsModal;