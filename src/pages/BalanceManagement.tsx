import { useState } from "react";
import { Plus, Download, Upload, Wallet, ArrowUpCircle, ArrowDownCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "credit" | "debit";
  method: string;
  notes: string;
  user: string;
  status: "completed" | "pending";
}

const transactions: Transaction[] = [
  { id: "TRX-001", date: "2024-01-15", amount: 5000, type: "credit", method: "تحويل بنكي", notes: "إيداع شهري", user: "أحمد محمد", status: "completed" },
  { id: "TRX-002", date: "2024-01-14", amount: 1200, type: "debit", method: "نقدي", notes: "دفعة للمندوب خالد", user: "خالد سعيد", status: "completed" },
  { id: "TRX-003", date: "2024-01-14", amount: 3500, type: "credit", method: "شيك", notes: "تحصيل شحنات", user: "فاطمة علي", status: "completed" },
  { id: "TRX-004", date: "2024-01-13", amount: 800, type: "debit", method: "نقدي", notes: "مصاريف تشغيلية", user: "محمد أحمد", status: "pending" },
  { id: "TRX-005", date: "2024-01-12", amount: 2500, type: "credit", method: "تحويل بنكي", notes: "تحصيل من عميل", user: "سارة محمد", status: "completed" },
  { id: "TRX-006", date: "2024-01-12", amount: 1800, type: "debit", method: "تحويل بنكي", notes: "رواتب", user: "إدارة", status: "completed" },
];

const BalanceManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const totalCredits = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalCredits - totalDebits;

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const handleAddBalance = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم إضافة الرصيد بنجاح",
      description: "تم تسجيل المعاملة الجديدة",
    });
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الرصيد</h1>
          <p className="text-muted-foreground">تتبع المعاملات المالية والرصيد</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4" />
                إضافة رصيد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة رصيد جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBalance} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>نوع المعاملة</Label>
                  <Select defaultValue="credit">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">إيداع (دائن)</SelectItem>
                      <SelectItem value="debit">سحب (مدين)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المبلغ (ر.س)</Label>
                  <Input type="number" min="1" placeholder="0" required />
                </div>
                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <Select defaultValue="cash">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="bank">تحويل بنكي</SelectItem>
                      <SelectItem value="check">شيك</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المستخدم</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستخدم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ahmed">أحمد محمد</SelectItem>
                      <SelectItem value="khalid">خالد سعيد</SelectItem>
                      <SelectItem value="fatima">فاطمة علي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>رفع صورة الإيصال</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">اسحب الصورة أو تصفح</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea placeholder="أي ملاحظات إضافية..." />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90">
                    إضافة
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
              <p className="text-2xl font-bold">{currentBalance.toLocaleString()} ر.س</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <ArrowDownCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الإيداعات</p>
              <p className="text-2xl font-bold text-accent">{totalCredits.toLocaleString()} ر.س</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <ArrowUpCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي السحوبات</p>
              <p className="text-2xl font-bold text-destructive">{totalDebits.toLocaleString()} ر.س</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-wrap gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="credit">إيداع</SelectItem>
            <SelectItem value="debit">سحب</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="pending">معلق</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-[180px]" />
        <Input type="date" className="w-[180px]" />
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم المعاملة</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>النوع</th>
                <th>طريقة الدفع</th>
                <th>المستخدم</th>
                <th>ملاحظات</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction, index) => (
                <tr key={transaction.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="font-medium text-primary">{transaction.id}</td>
                  <td>{transaction.date}</td>
                  <td className={cn("font-semibold", transaction.type === "credit" ? "text-accent" : "text-destructive")}>
                    {transaction.type === "credit" ? "+" : "-"}{transaction.amount.toLocaleString()} ر.س
                  </td>
                  <td>
                    <span className={cn(
                      "status-badge",
                      transaction.type === "credit" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                    )}>
                      {transaction.type === "credit" ? "إيداع" : "سحب"}
                    </span>
                  </td>
                  <td>{transaction.method}</td>
                  <td>{transaction.user}</td>
                  <td className="text-muted-foreground max-w-[200px] truncate">{transaction.notes}</td>
                  <td>
                    <span className={cn(
                      "status-badge",
                      transaction.status === "completed" ? "status-delivered" : "status-pending"
                    )}>
                      {transaction.status === "completed" ? "مكتمل" : "معلق"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            عرض {filteredTransactions.length} من {transactions.length} معاملة
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceManagement;
