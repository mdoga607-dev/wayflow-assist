import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ShipmentLabel from "@/components/shipments/ShipmentLabel";
import { Printer, Search, Package, CheckSquare, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PrintLabel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["shipments-for-print"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredShipments = shipments.filter(
    (s) =>
      s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient_phone.includes(searchQuery)
  );

  const selectedShipments = shipments.filter((s) => selectedIds.includes(s.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredShipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredShipments.map((s) => s.id));
    }
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) {
      toast({ title: "اختر شحنة واحدة على الأقل للطباعة", variant: "destructive" });
      return;
    }

    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "يرجى السماح بالنوافذ المنبثقة للطباعة", variant: "destructive" });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>طباعة بوليصات الشحن</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            .label-container { 
              page-break-after: always; 
              padding: 20px;
            }
            .label-container:last-child { page-break-after: avoid; }
            @media print {
              .label-container { padding: 10px; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    transit: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    delayed: "bg-red-100 text-red-800",
    returned: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Printer className="h-6 w-6" />
            طباعة بوليصات الشحن
          </h1>
          <p className="text-muted-foreground">اختر الشحنات لطباعة بوليصاتها مع QR Code</p>
        </div>
        <Button onClick={handlePrint} disabled={selectedIds.length === 0} className="gap-2">
          <Printer className="h-4 w-4" />
          طباعة ({selectedIds.length})
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم التتبع أو اسم المستلم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline" onClick={selectAll}>
              {selectedIds.length === filteredShipments.length ? (
                <>
                  <Square className="h-4 w-4 ml-2" />
                  إلغاء الكل
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 ml-2" />
                  تحديد الكل
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            الشحنات ({filteredShipments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent" />
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد شحنات
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>رقم التتبع</TableHead>
                  <TableHead>المستلم</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow
                    key={shipment.id}
                    className={selectedIds.includes(shipment.id) ? "bg-primary/5" : ""}
                    onClick={() => toggleSelect(shipment.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(shipment.id)}
                        onCheckedChange={() => toggleSelect(shipment.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {shipment.tracking_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shipment.recipient_name}</p>
                        <p className="text-sm text-muted-foreground">{shipment.recipient_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{shipment.recipient_city || "-"}</TableCell>
                    <TableCell className="font-medium">
                      {shipment.cod_amount ? `${shipment.cod_amount} ج.م` : "مدفوع"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[shipment.status || "pending"]}>
                        {shipment.status === "pending" && "قيد الانتظار"}
                        {shipment.status === "transit" && "في الطريق"}
                        {shipment.status === "delivered" && "تم التسليم"}
                        {shipment.status === "delayed" && "متأخر"}
                        {shipment.status === "returned" && "مرتجع"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Selected Labels */}
      {selectedShipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>معاينة البوليصات المحددة ({selectedShipments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {selectedShipments.slice(0, 6).map((shipment) => (
                <div key={shipment.id} className="transform scale-75 origin-top-right">
                  <ShipmentLabel shipment={shipment} />
                </div>
              ))}
            </div>
            {selectedShipments.length > 6 && (
              <p className="text-center text-muted-foreground mt-4">
                و {selectedShipments.length - 6} بوليصات أخرى...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden Print Content */}
      <div className="hidden">
        <div ref={printRef}>
          {selectedShipments.map((shipment) => (
            <div key={shipment.id} className="label-container">
              <ShipmentLabel shipment={shipment} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintLabel;
