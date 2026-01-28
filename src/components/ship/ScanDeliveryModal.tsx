/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ScanDeliveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  scanType: 'delivery' | 'dispatch' | 'status';
  delegateId?: string;
  sheets?: any[];
  returnedSheets?: any[];
}

export default function ScanDeliveryModal({
  open,
  onOpenChange,
  onSubmit,
  scanType,
  delegateId,
  sheets,
  returnedSheets
}: ScanDeliveryModalProps) {
  const handleSubmit = () => {
    onSubmit({ waybills: [] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {scanType === 'delivery' ? 'مسح ضوئي للتسليم' : 
             scanType === 'dispatch' ? 'مسح ضوئي للاستلام' : 
             'مسح ضوئي لتغيير الحالة'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">أدخل أرقام البوليصات (مفصولة بفواصل)</label>
            <Textarea 
              placeholder="12345, 67890, 11223..."
              dir="ltr"
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              تأكيد المسح الضوئي
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}