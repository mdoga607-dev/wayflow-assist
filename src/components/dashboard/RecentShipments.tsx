import { Eye, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const shipments = [
  {
    id: "SHP-001",
    customer: "محمد أحمد",
    phone: "0512345678",
    city: "الرياض",
    status: "delivered",
    date: "2024-01-15",
    amount: 250,
  },
  {
    id: "SHP-002",
    customer: "فاطمة علي",
    phone: "0523456789",
    city: "جدة",
    status: "transit",
    date: "2024-01-15",
    amount: 180,
  },
  {
    id: "SHP-003",
    customer: "عبدالله سعيد",
    phone: "0534567890",
    city: "الدمام",
    status: "pending",
    date: "2024-01-14",
    amount: 320,
  },
  {
    id: "SHP-004",
    customer: "نورة خالد",
    phone: "0545678901",
    city: "مكة",
    status: "delayed",
    date: "2024-01-14",
    amount: 150,
  },
  {
    id: "SHP-005",
    customer: "سارة محمد",
    phone: "0556789012",
    city: "المدينة",
    status: "delivered",
    date: "2024-01-13",
    amount: 420,
  },
];

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
};

const RecentShipments = () => {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">آخر الشحنات</h3>
        <Button variant="outline" size="sm">
          عرض الكل
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الشحنة</th>
              <th>العميل</th>
              <th>الهاتف</th>
              <th>المدينة</th>
              <th>الحالة</th>
              <th>التاريخ</th>
              <th>المبلغ</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => (
              <tr key={shipment.id} className="animate-fade-in">
                <td className="font-medium">{shipment.id}</td>
                <td>{shipment.customer}</td>
                <td dir="ltr" className="text-right">{shipment.phone}</td>
                <td>{shipment.city}</td>
                <td>
                  <span
                    className={cn(
                      "status-badge",
                      `status-${shipment.status}`
                    )}
                  >
                    {statusLabels[shipment.status]}
                  </span>
                </td>
                <td>{shipment.date}</td>
                <td className="font-semibold">{shipment.amount} ر.س</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
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
    </div>
  );
};

export default RecentShipments;
