import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Printer, Package, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SheetDetailsModal = ({ open, onOpenChange, sheetId }: { open: boolean, onOpenChange: (o: boolean) => void, sheetId: string }) => {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);

  useEffect(() => {
    if (open && sheetId) {
      const load = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("shipments")
          .select(`
            id, tracking_number, recipient_name, recipient_phone, status, cod_amount,
            shipper:shipper_id(name)
          `)
          .eq("sheet_id", sheetId);

        if (error) {
          toast({ title: "خطأ", description: "فشل جلب الشحنات", variant: "destructive" });
        } else {
          setShipments(data || []);
        }
        setLoading(false);
      };
      load();
    }
  }, [open, sheetId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold">
            <Package className="text-primary" /> تفاصيل الشحنات داخل الشيت
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">التتبع</TableHead>
                  <TableHead className="text-right">المستلم</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">التاجر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">لا توجد شحنات</TableCell></TableRow>
                ) : (
                  shipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-bold">{s.tracking_number}</TableCell>
                      <TableCell>{s.recipient_name}</TableCell>
                      <TableCell className="text-emerald-600 font-bold">{s.cod_amount} ر.س</TableCell>
                      <TableCell>{s.shipper?.name || "---"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          <Button onClick={() => window.print()}><Printer className="ml-2 h-4 w-4" /> طباعة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SheetDetailsModal;