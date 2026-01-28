import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PrintOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (printType: string) => void;
}

export default function PrintOptionsModal({
  open,
  onOpenChange,
  onConfirm
}: PrintOptionsModalProps) {
  const handleSubmit = () => {
    onConfirm('standard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>خيارات الطباعة</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Select defaultValue="standard">
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع الطباعة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">ليبل صغير 4*6 سم</SelectItem>
              <SelectItem value="small">ليبل صغير 2*4 سم</SelectItem>
              <SelectItem value="large">ليبل كبير 8*13 سم</SelectItem>
              <SelectItem value="square">ليبل كبير 10*10 سم</SelectItem>
              <SelectItem value="rect">ليبل كبير 10*15 سم</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} className="w-full">
            طباعة
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full"
          >
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}