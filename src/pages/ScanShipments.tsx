import { useState, useRef, useEffect } from "react";
import { ScanLine, Trash2, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ScannedShipment {
  id: string;
  barcode: string;
  customer: string;
  phone: string;
  city: string;
  notes: string;
  scannedAt: Date;
  isDuplicate: boolean;
}

const mockShipmentData: Record<string, Omit<ScannedShipment, "id" | "scannedAt" | "isDuplicate">> = {
  "SHP001234": { barcode: "SHP001234", customer: "محمد أحمد", phone: "0512345678", city: "الرياض", notes: "توصيل صباحي" },
  "SHP001235": { barcode: "SHP001235", customer: "فاطمة علي", phone: "0523456789", city: "جدة", notes: "" },
  "SHP001236": { barcode: "SHP001236", customer: "عبدالله سعيد", phone: "0534567890", city: "الدمام", notes: "هش - حذر" },
  "SHP001237": { barcode: "SHP001237", customer: "نورة خالد", phone: "0545678901", city: "مكة", notes: "" },
  "SHP001238": { barcode: "SHP001238", customer: "سارة محمد", phone: "0556789012", city: "المدينة", notes: "اتصال قبل التوصيل" },
};

const ScanShipments = () => {
  const [barcode, setBarcode] = useState("");
  const [scannedShipments, setScannedShipments] = useState<ScannedShipment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcode.trim()) return;

    setIsProcessing(true);

    // Simulate API lookup
    await new Promise((resolve) => setTimeout(resolve, 300));

    const existingIndex = scannedShipments.findIndex((s) => s.barcode === barcode.trim());
    const isDuplicate = existingIndex !== -1;

    if (isDuplicate) {
      // Mark the existing one as duplicate too
      setScannedShipments((prev) =>
        prev.map((s, i) =>
          i === existingIndex ? { ...s, isDuplicate: true } : s
        )
      );

      toast({
        title: "تحذير: شحنة مكررة!",
        description: `الباركود ${barcode} تم مسحه مسبقاً`,
        variant: "destructive",
      });
    }

    const shipmentData = mockShipmentData[barcode.trim()];

    const newShipment: ScannedShipment = {
      id: `scan-${Date.now()}`,
      barcode: barcode.trim(),
      customer: shipmentData?.customer || "غير معروف",
      phone: shipmentData?.phone || "-",
      city: shipmentData?.city || "-",
      notes: shipmentData?.notes || "",
      scannedAt: new Date(),
      isDuplicate,
    };

    setScannedShipments((prev) => [newShipment, ...prev]);
    setBarcode("");
    setIsProcessing(false);
    inputRef.current?.focus();

    if (!isDuplicate && shipmentData) {
      toast({
        title: "تم مسح الشحنة بنجاح",
        description: `${shipmentData.customer} - ${shipmentData.city}`,
      });
    } else if (!shipmentData) {
      toast({
        title: "تنبيه",
        description: "لم يتم العثور على بيانات هذه الشحنة",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    setScannedShipments((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAll = () => {
    setScannedShipments([]);
    toast({
      title: "تم مسح القائمة",
      description: "تم حذف جميع الشحنات الممسوحة",
    });
  };

  const totalShipments = scannedShipments.length;
  const duplicateCount = scannedShipments.filter((s) => s.isDuplicate).length;
  const uniqueCount = totalShipments - duplicateCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مسح الشحنات</h1>
          <p className="text-muted-foreground">امسح باركود الشحنات للإضافة السريعة</p>
        </div>
      </div>

      {/* Scanner Input */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <form onSubmit={handleScan} className="flex gap-4">
          <div className="relative flex-1">
            <ScanLine className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
            <Input
              ref={inputRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="امسح أو أدخل رقم الباركود..."
              className="pr-14 h-14 text-lg font-medium"
              autoFocus
              disabled={isProcessing}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-14 px-8 bg-accent hover:bg-accent/90"
            disabled={!barcode.trim() || isProcessing}
          >
            {isProcessing ? "جاري المعالجة..." : "إضافة"}
          </Button>
        </form>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">إجمالي الممسوح</p>
            <p className="text-2xl font-bold">{totalShipments}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent/10">
            <CheckCircle className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">شحنات فريدة</p>
            <p className="text-2xl font-bold text-accent">{uniqueCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/10">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">مكررة</p>
            <p className="text-2xl font-bold text-yellow-500">{duplicateCount}</p>
          </div>
        </div>
      </div>

      {/* Scanned Shipments Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">الشحنات الممسوحة</h3>
          {scannedShipments.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 ml-2" />
              مسح الكل
            </Button>
          )}
        </div>

        {scannedShipments.length === 0 ? (
          <div className="p-12 text-center">
            <ScanLine className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">لم يتم مسح أي شحنات بعد</p>
            <p className="text-sm text-muted-foreground/70">ابدأ بمسح باركود الشحنات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">حذف</th>
                  <th>الباركود</th>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>المدينة</th>
                  <th>ملاحظات</th>
                  <th>وقت المسح</th>
                </tr>
              </thead>
              <tbody>
                {scannedShipments.map((shipment, index) => (
                  <tr
                    key={shipment.id}
                    className={cn(
                      "animate-fade-in transition-colors",
                      shipment.isDuplicate && "bg-yellow-50 hover:bg-yellow-100"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(shipment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {shipment.isDuplicate && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className={cn(
                          "font-mono font-medium",
                          shipment.isDuplicate ? "text-yellow-700" : "text-primary"
                        )}>
                          {shipment.barcode}
                        </span>
                      </div>
                    </td>
                    <td className="font-medium">{shipment.customer}</td>
                    <td dir="ltr" className="text-right">{shipment.phone}</td>
                    <td>{shipment.city}</td>
                    <td className="text-muted-foreground max-w-[200px] truncate">
                      {shipment.notes || "-"}
                    </td>
                    <td className="text-muted-foreground text-sm">
                      {shipment.scannedAt.toLocaleTimeString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {scannedShipments.length > 0 && (
        <div className="flex gap-4 justify-end">
          <Button variant="outline" size="lg">
            طباعة القائمة
          </Button>
          <Button size="lg" className="bg-accent hover:bg-accent/90">
            حفظ وتأكيد ({uniqueCount} شحنة)
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScanShipments;
