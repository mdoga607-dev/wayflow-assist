// components/ship/CourierInfoCard.tsx
import { useState } from 'react';
import { 
  Wallet, 
  RefreshCcw, 
  Printer, 
  ScanLine,
  Truck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { CourierInfo } from '@/hooks/useCouriersShipments';

interface CourierInfoCardProps {
  courierInfo: CourierInfo;
  onAction: (action: string) => void;
}

const CourierInfoCard = ({ courierInfo, onAction }: CourierInfoCardProps) => {
  const [showFullInfo, setShowFullInfo] = useState(false);

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {courierInfo.name.charAt(0)}
            </span>
          </div>
          
          <div>
            <h3 className="font-bold text-lg">{courierInfo.name}</h3>
            <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                <span>عدد الشحنات: {courierInfo.shipments_count}</span>
              </div>
              {courierInfo.courier_limit && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>الحد الأقصى: {courierInfo.courier_limit}</span>
                </div>
              )}
              {courierInfo.store_name && (
                <div className="flex items-center gap-1">
                  <span>الفرع: {courierInfo.store_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onAction('warehouse_receive')}
            className="gap-1"
          >
            <RefreshCcw className="h-3 w-3" />
            استلام في المخزن
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onAction('warehouse_returned')}
            className="gap-1"
          >
            <RefreshCcw className="h-3 w-3" />
            ارتجاع للمخزن
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onAction('receive_same_status')}
            className="gap-1"
          >
            <RefreshCcw className="h-3 w-3" />
            استلام بنفس الحالات
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onAction('change_status_courier')}
            className="gap-1"
          >
            <ScanLine className="h-3 w-3" />
            تغيير الحالة
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFullInfo(!showFullInfo)}
            className="gap-1"
          >
            <Wallet className="h-3 w-3" />
            تفاصيل الرصيد
          </Button>
        </div>
      </div>

      {showFullInfo && (
        <div className="mt-4 pt-4 border-t border-primary/20 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">الرصيد</p>
            <p className="font-bold text-lg">{courierInfo.balance.toLocaleString()} ر.س</p>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm text-muted-foreground">المديونية</p>
            <p className="font-bold text-lg text-destructive">{courierInfo.debt_balance.toLocaleString()} ر.س</p>
          </div>
          <div className="text-center p-3 bg-accent/10 rounded-lg">
            <p className="text-sm text-muted-foreground">العمولة المستحقة</p>
            <p className="font-bold text-lg">{courierInfo.commission.toLocaleString()} ر.س</p>
          </div>
          <div className="text-center p-3 bg-secondary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">قيمة التسليم اليوم</p>
            <p className="font-bold text-lg">{(courierInfo.shipmentsDeliveredValue || 0).toLocaleString()} ر.س</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CourierInfoCard;