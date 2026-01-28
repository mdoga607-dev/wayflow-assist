// components/ship/PrintLabel.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { useShipments } from "@/hooks/useShipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Printer, Package, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import ShipmentLabel from "./ShipmentLabel"; // تأكد من وجود هذا الملف

const PrintLabel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: shipments = [], isLoading, isError, error } = useShipments();

  useEffect(() => {
    const savedIds = localStorage.getItem("selectedShipmentIds");
    if (savedIds) {
      setSelectedIds(JSON.parse(savedIds));
      localStorage.removeItem("selectedShipmentIds");
    }
  }, []);

  const filteredShipments = useMemo(() => {
    if (!searchQuery.trim()) return shipments;
    const q = searchQuery.toLowerCase().trim();
    return shipments.filter((s) =>
      s.tracking_number?.toLowerCase().includes(q) ||
      s.recipient_name?.toLowerCase().includes(q) ||
      s.recipient_phone?.toLowerCase().includes(q) ||
      s.recipient_city?.toLowerCase().includes(q)
    );
  }, [shipments, searchQuery]);

  const selectedShipments = useMemo(
    () => shipments.filter((s) => selectedIds.includes(s.id)),
    [shipments, selectedIds]
  );

  const printRef = useRef<HTMLDivElement>(null);

  // ✅ الحل الصحيح: استخدام contentRef بدلاً من content
  const handlePrint = useReactToPrint({
    contentRef: printRef, // ⚠️ هذا هو التصحيح المطلوب
    documentTitle: `بوليصات_شحن_${new Date().toLocaleDateString("ar-EG")}`,
    pageStyle: `
      @page {
        size: 105mm 148mm;
        margin: 4mm;
      }
      @media print {
        body {
          margin: 0;
          direction: rtl;
          font-family: 'Tajawal', Arial, sans-serif;
        }
        .label-container {
          page-break-after: always;
          break-inside: avoid;
          width: 105mm;
          min-height: 148mm;
        }
        .label-container:last-child {
          page-break-after: avoid;
        }
      }
    `,
    onAfterPrint: () => {
      toast({
        title: "تم إرسال مهمة الطباعة",
        description: "تحقق من الطابعة أو اختر حفظ كـ PDF",
      });
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredShipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredShipments.map((s) => s.id));
    }
  };

  const handlePrintClick = () => {
    if (selectedIds.length === 0) {
      toast({ 
        title: "حدد شحنة واحدة على الأقل", 
        variant: "destructive" 
      });
      return;
    }
    handlePrint();
  };

  if (isError) {
    return (
      <div className="p-10 text-center text-destructive">
        <p className="text-lg font-medium">حدث خطأ أثناء جلب الشحنات</p>
        <p className="mt-2 text-sm">{(error as Error)?.message}</p>
        <Button 
          variant="outline" 
          className="mt-6" 
          onClick={() => window.location.reload()}
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-2xl py-8 space-y-6" dir="rtl">
      {/* Header + Print button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Printer className="h-7 w-7 text-primary" />
          طباعة بوليصات الشحن
        </h1>

        <Button
          onClick={handlePrintClick}
          disabled={isLoading || selectedIds.length === 0}
          className="min-w-[160px] gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          طباعة {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
        </Button>
      </div>

      {/* Search + Select All */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث برقم التتبع – الاسم – الجوال – المدينة"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={handleSelectAll}
          disabled={filteredShipments.length === 0}
          className="whitespace-nowrap"
        >
          {selectedIds.length === filteredShipments.length && filteredShipments.length > 0
            ? "إلغاء تحديد الكل"
            : "تحديد الكل"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p>جاري تحميل الشحنات...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Package className="mx-auto h-16 w-16 opacity-40 mb-4" />
            <p className="text-lg">لا توجد شحنات مطابقة للبحث</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="w-14 text-center"></TableHead>
                <TableHead>رقم التتبع</TableHead>
                <TableHead>اسم المستلم</TableHead>
                <TableHead>الجوال</TableHead>
                <TableHead>المدينة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => (
                <TableRow
                  key={shipment.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSelect(shipment.id)}
                >
                  <TableCell 
                    onClick={(e) => e.stopPropagation()} 
                    className="text-center"
                  >
                    <Checkbox checked={selectedIds.includes(shipment.id)} />
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {shipment.tracking_number}
                  </TableCell>
                  <TableCell>{shipment.recipient_name}</TableCell>
                  <TableCell dir="ltr" className="font-mono">
                    {shipment.recipient_phone}
                  </TableCell>
                  <TableCell>{shipment.recipient_city || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* منطقة الطباعة المخفية - بدون print:block */}
      <div ref={printRef} className="hidden">
        {selectedShipments.map((shipment) => (
          <div
            key={shipment.id}
            className="label-container"
            style={{ 
              width: "105mm", 
              minHeight: "148mm",
              pageBreakAfter: "always"
            }}
          >
            <ShipmentLabel shipment={shipment} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintLabel;