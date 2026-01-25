import { useState, useRef } from "react";
import { Printer, Search, Filter, FileText, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const mockPayments = [
  { 
    id: "PAY-001", 
    delegate: "أحمد محمد", 
    type: "collection",
    amount: 5200,
    shipmentsCount: 15,
    date: "2024-01-20",
    status: "completed"
  },
  { 
    id: "PAY-002", 
    delegate: "علي سعيد", 
    type: "payment",
    amount: 3800,
    shipmentsCount: 12,
    date: "2024-01-19",
    status: "pending"
  },
  { 
    id: "PAY-003", 
    delegate: "محمد خالد", 
    type: "collection",
    amount: 7500,
    shipmentsCount: 22,
    date: "2024-01-18",
    status: "completed"
  },
  { 
    id: "PAY-004", 
    delegate: "خالد علي", 
    type: "payment",
    amount: 4200,
    shipmentsCount: 14,
    date: "2024-01-17",
    status: "completed"
  },
  { 
    id: "PAY-005", 
    delegate: "سعيد أحمد", 
    type: "collection",
    amount: 6100,
    shipmentsCount: 18,
    date: "2024-01-16",
    status: "pending"
  },
];

const typeLabels: Record<string, string> = {
  collection: "جمع",
  payment: "دفع",
};

const statusLabels: Record<string, string> = {
  completed: "مكتمل",
  pending: "قيد الانتظار",
};

const delegates = ["أحمد محمد", "علي سعيد", "محمد خالد", "خالد علي", "سعيد أحمد"];

const PaymentDocuments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [delegateFilter, setDelegateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedPayment, setSelectedPayment] = useState<typeof mockPayments[0] | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch = payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.delegate.includes(searchQuery);
    const matchesType = typeFilter === "all" || payment.type === typeFilter;
    const matchesDelegate = delegateFilter === "all" || payment.delegate === delegateFilter;
    
    const paymentDate = new Date(payment.date);
    const matchesDateFrom = !dateFrom || paymentDate >= dateFrom;
    const matchesDateTo = !dateTo || paymentDate <= dateTo;

    return matchesSearch && matchesType && matchesDelegate && matchesDateFrom && matchesDateTo;
  });

  const handlePrint = () => {
    if (!selectedPayment) return;
    
    const printContent = document.getElementById("print-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>ورقة دفعة ${selectedPayment.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 40px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-item { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
          .info-item label { color: #666; font-size: 12px; display: block; margin-bottom: 5px; }
          .info-item span { font-weight: 600; font-size: 16px; }
          .total { text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin-top: 20px; }
          .total label { color: #666; display: block; margin-bottom: 5px; }
          .total span { font-size: 28px; font-weight: 700; color: #16a34a; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .signature { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; }
          .signature-line { width: 200px; border-bottom: 1px solid #000; margin-bottom: 10px; height: 60px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">أوراق الدفعات</h1>
        <p className="text-muted-foreground">عرض وطباعة أوراق الجمع والدفع</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الورقة أو اسم المندوب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="collection">جمع</SelectItem>
                <SelectItem value="payment">دفع</SelectItem>
              </SelectContent>
            </Select>

            <Select value={delegateFilter} onValueChange={setDelegateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="المندوب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المناديب</SelectItem>
                {delegates.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM", { locale: ar }) : "من"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM", { locale: ar }) : "إلى"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قائمة الدفعات ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الورقة</th>
                  <th>المندوب</th>
                  <th>النوع</th>
                  <th>عدد الشحنات</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr 
                    key={payment.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="font-medium text-primary">{payment.id}</td>
                    <td className="font-medium">{payment.delegate}</td>
                    <td>
                      <Badge variant={payment.type === "collection" ? "default" : "secondary"}>
                        {typeLabels[payment.type]}
                      </Badge>
                    </td>
                    <td>{payment.shipmentsCount}</td>
                    <td className="font-semibold">{payment.amount.toLocaleString()} ر.س</td>
                    <td>{payment.date}</td>
                    <td>
                      <span className={cn(
                        "status-badge",
                        payment.status === "completed" ? "status-delivered" : "status-pending"
                      )}>
                        {statusLabels[payment.status]}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>تفاصيل الورقة {selectedPayment?.id}</span>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div id="print-content" ref={printRef}>
              <div className="header">
                <h1>ورقة {typeLabels[selectedPayment.type]}</h1>
                <p>رقم الورقة: {selectedPayment.id}</p>
              </div>

              <Separator className="my-6" />

              <div className="info-grid grid grid-cols-2 gap-4">
                <div className="info-item bg-muted/50 p-4 rounded-lg">
                  <label className="text-sm text-muted-foreground">اسم المندوب</label>
                  <span className="font-semibold block mt-1">{selectedPayment.delegate}</span>
                </div>
                <div className="info-item bg-muted/50 p-4 rounded-lg">
                  <label className="text-sm text-muted-foreground">نوع العملية</label>
                  <span className="font-semibold block mt-1">
                    {typeLabels[selectedPayment.type]}
                  </span>
                </div>
                <div className="info-item bg-muted/50 p-4 rounded-lg">
                  <label className="text-sm text-muted-foreground">عدد الشحنات</label>
                  <span className="font-semibold block mt-1">{selectedPayment.shipmentsCount}</span>
                </div>
                <div className="info-item bg-muted/50 p-4 rounded-lg">
                  <label className="text-sm text-muted-foreground">التاريخ</label>
                  <span className="font-semibold block mt-1">{selectedPayment.date}</span>
                </div>
              </div>

              <div className="total bg-accent/10 p-6 rounded-lg text-center mt-6">
                <label className="text-muted-foreground">المبلغ الإجمالي</label>
                <span className="text-3xl font-bold text-accent block mt-2">
                  {selectedPayment.amount.toLocaleString()} ر.س
                </span>
              </div>

              <div className="signature grid grid-cols-2 gap-8 mt-12">
                <div className="signature-box text-center">
                  <div className="signature-line h-16 border-b border-foreground/30 mb-2"></div>
                  <span className="text-sm text-muted-foreground">توقيع المندوب</span>
                </div>
                <div className="signature-box text-center">
                  <div className="signature-line h-16 border-b border-foreground/30 mb-2"></div>
                  <span className="text-sm text-muted-foreground">توقيع المدير</span>
                </div>
              </div>

              <div className="footer text-center mt-8 pt-4 border-t text-sm text-muted-foreground">
                <p>تم إنشاء هذه الورقة بواسطة نظام إدارة الشحنات</p>
                <p>{format(new Date(), "PPP", { locale: ar })}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentDocuments;
