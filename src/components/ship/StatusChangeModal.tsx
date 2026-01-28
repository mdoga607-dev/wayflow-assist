/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (statusId: string, options: any) => void;
  delegateId?: string;
  sheets?: any[];
  returnedSheets?: any[];
}

export default function StatusChangeModal({
  open,
  onOpenChange,
  onConfirm,
  delegateId,
  sheets,
  returnedSheets
}: StatusChangeModalProps) {
  const statusOptions = [
    { id: 'delivered', label: 'تم التسليم' },
    { id: 'delayed', label: 'متأخر' },
    { id: 'returned', label: 'مرتجع' },
    { id: 'transit', label: 'قيد التوصيل' }
  ];

  const handleSubmit = () => {
    onConfirm('delivered', {});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>تغيير حالة الشحنات</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">الحالة الجديدة</label>
            <Select defaultValue="delivered">
              {statusOptions.map(status => (
                <SelectItem key={status.id} value={status.id}>
                  {status.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            تأكيد التغيير
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full"
          >
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}