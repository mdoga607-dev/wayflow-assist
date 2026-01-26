import { Eye, MoreVertical, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRecentShipments } from "@/hooks/useRecentShipments";
import { Link } from "react-router-dom";

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
  returned: "مرتجع",
};

const RecentShipments = () => {
  const { data: shipments, isLoading, error } = useRecentShipments(5);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">آخر الشحنات</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">آخر الشحنات</h3>
        </div>
        <p className="text-destructive text-center py-8">خطأ في تحميل البيانات</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">آخر الشحنات</h3>
        <Link to="/shipments">
          <Button variant="outline" size="sm">
            عرض الكل
          </Button>
        </Link>
      </div>
      
      {shipments && shipments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم التتبع</th>
                <th>المستلم</th>
                <th>الهاتف</th>
                <th>المدينة</th>
                <th>الحالة</th>
                <th>المبلغ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment, index) => (
                <tr 
                  key={shipment.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="font-medium text-primary">{shipment.tracking_number}</td>
                  <td>{shipment.recipient_name}</td>
                  <td dir="ltr" className="text-right">{shipment.recipient_phone}</td>
                  <td>{shipment.recipient_city || "-"}</td>
                  <td>
                    <span
                      className={cn(
                        "status-badge",
                        `status-${shipment.status || 'pending'}`
                      )}
                    >
                      {statusLabels[shipment.status || 'pending'] || shipment.status}
                    </span>
                  </td>
                  <td className="font-semibold">{shipment.cod_amount || 0} ر.س</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link to={`/track/${shipment.tracking_number}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem>تعديل</DropdownMenuItem>
                          <DropdownMenuItem>طباعة</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد شحنات حتى الآن</p>
          <Link to="/add-shipment">
            <Button className="mt-4" variant="outline">
              إضافة أول شحنة
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentShipments;
