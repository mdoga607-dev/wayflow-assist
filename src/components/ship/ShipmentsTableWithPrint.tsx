// components/ship/ShipmentsTableWithPrint.tsx
import { useState, useRef, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { useShipments, Shipment } from "@/hooks/useShipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Printer, Truck, Package, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ShipmentLabel from "./ShipmentLabel"; // ✅ الاستيراد الصحيح

const ShipmentsTableWithPrint = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const { data: shipments = [], isLoading, isError, error } = useShipments();

  const filteredShipments = useMemo(() => {
    if (!searchQuery.trim()) return shipments;

    const q = searchQuery.toLowerCase().trim();
    return shipments.filter((s) =>
      s.tracking_number?.toLowerCase().includes(q) ||
      s.recipient_name?.toLowerCase().includes(q)
    );
  }, [shipments, searchQuery]);

  // ref للطباعة
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ الحل الصحيح: استخدام contentRef بدلاً من content
  const handlePrint = useReactToPrint({
    contentRef: printRef, // ⚠️ التصحيح هنا
    documentTitle: `بوليصة_${selectedShipment?.tracking_number || "شحن"}`,
    pageStyle: `
      @page {
        size: 105mm 148mm portrait;
        margin: 3mm;
      }
      @media print {
        body { 
          margin: 0; 
          direction: rtl; 
          font-family: 'Tajawal', Arial, sans-serif; 
        }
        .label { 
          width: 105mm; 
          height: 148mm; 
          page-break-after: always; 
        }
      }
    `,
    onAfterPrint: () => {
      toast({ title: "تم إرسال الطباعة" });
    },
  });

  // تحديد الشحنة للطباعة
  const handlePrintSingle = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    // استخدام setTimeout لضمان تحديث الـ DOM قبل الطباعة
    setTimeout(() => {
      handlePrint();
    }, 0);
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>حدث خطأ أثناء جلب الشحنات</p>
        <p className="text-sm mt-2">{(error as Error)?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          قائمة الشحنات
        </h1>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث برقم التتبع أو اسم المستلم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>جاري تحميل الشحنات...</p>
          </div>
        ) : (
          <>
            {/* الجدول الرئيسي */}
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">رقم التتبع</TableHead>
                  <TableHead className="text-right">المستلم</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.length > 0 ? (
                  filteredShipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-bold">
                        {s.tracking_number}
                      </TableCell>
                      <TableCell>{s.recipient_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {s.status || "غير محدد"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintSingle(s)}
                        >
                          <Printer className="h-4 w-4 ml-1" />
                          طباعة
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Truck className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      لا توجد شحنات مطابقة
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* منطقة الطباعة المخفية - تظهر فقط عند تحديد شحنة */}
            <div className="hidden print:block">
              {selectedShipment && (
                <div ref={printRef} className="label">
                  <ShipmentLabel shipment={selectedShipment} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShipmentsTableWithPrint;