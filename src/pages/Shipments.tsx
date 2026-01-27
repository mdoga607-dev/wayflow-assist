import { useState } from "react";
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, Printer, CheckSquare, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const shipments = [
  { id: "SHP-001", customer: "محمد أحمد", phone: "0512345678", city: "الرياض", address: "حي النخيل، شارع العليا", status: "delivered", date: "2024-01-15", amount: 250 },
  { id: "SHP-002", customer: "فاطمة علي", phone: "0523456789", city: "جدة", address: "حي الروضة، شارع الملك فهد", status: "transit", date: "2024-01-15", amount: 180 },
  { id: "SHP-003", customer: "عبدالله سعيد", phone: "0534567890", city: "الدمام", address: "حي الفيصلية، شارع الأمير محمد", status: "pending", date: "2024-01-14", amount: 320 },
  { id: "SHP-004", customer: "نورة خالد", phone: "0545678901", city: "مكة", address: "حي العزيزية، شارع إبراهيم الخليل", status: "delayed", date: "2024-01-14", amount: 150 },
  { id: "SHP-005", customer: "سارة محمد", phone: "0556789012", city: "المدينة", address: "حي السلام، شارع السلام", status: "delivered", date: "2024-01-13", amount: 420 },
  { id: "SHP-006", customer: "أحمد خالد", phone: "0567890123", city: "الرياض", address: "حي الملز، شارع الستين", status: "transit", date: "2024-01-13", amount: 280 },
  { id: "SHP-007", customer: "مريم سعد", phone: "0578901234", city: "جدة", address: "حي الحمراء، شارع التحلية", status: "pending", date: "2024-01-12", amount: 195 },
  { id: "SHP-008", customer: "يوسف علي", phone: "0589012345", city: "الدمام", address: "حي الشاطئ، الكورنيش", status: "delivered", date: "2024-01-12", amount: 510 },
];

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
};

const Shipments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);

  const handleSelectShipment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments(prev => [...prev, id]);
    } else {
      setSelectedShipments(prev => prev.filter(s => s !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(filteredShipments.map(s => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const handleBulkPrint = () => {
    if (selectedShipments.length === 0) {
      alert("برجاء اختيار شحنات للطباعة");
      return;
    }
    console.log("طباعة الشحنات:", selectedShipments);
    // Implement print logic
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.customer.includes(searchQuery) ||
      shipment.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
    const matchesCity = cityFilter === "all" || shipment.city === cityFilter;
    return matchesSearch && matchesStatus && matchesCity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">قائمة الشحنات</h1>
          <p className="text-muted-foreground">إدارة وتتبع جميع الشحنات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleBulkPrint} disabled={selectedShipments.length === 0}>
            <Printer className="h-4 w-4" />
            طباعة ({selectedShipments.length})
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Link to="/add-shipment">
            <Button className="gap-2 bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4" />
              إضافة شحنة
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الشحنة، اسم العميل، أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="delivered">تم التسليم</SelectItem>
              <SelectItem value="transit">قيد التوصيل</SelectItem>
              <SelectItem value="pending">في الانتظار</SelectItem>
              <SelectItem value="delayed">متأخر</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="المدينة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المدن</SelectItem>
              <SelectItem value="الرياض">الرياض</SelectItem>
              <SelectItem value="جدة">جدة</SelectItem>
              <SelectItem value="الدمام">الدمام</SelectItem>
              <SelectItem value="مكة">مكة</SelectItem>
              <SelectItem value="المدينة">المدينة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <Checkbox
                    checked={selectedShipments.length === filteredShipments.length && filteredShipments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th>رقم الشحنة</th>
                <th>العميل</th>
                <th>الهاتف</th>
                <th>المدينة</th>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment, index) => (
                <tr 
                  key={shipment.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td>
                    <Checkbox
                      checked={selectedShipments.includes(shipment.id)}
                      onCheckedChange={(checked) => handleSelectShipment(shipment.id, checked as boolean)}
                    />
                  </td>
                  <td className="font-medium text-primary">{shipment.id}</td>
                  <td className="font-medium">{shipment.customer}</td>
                  <td dir="ltr" className="text-right">{shipment.phone}</td>
                  <td>{shipment.city}</td>
                  <td className="max-w-[200px] truncate">{shipment.address}</td>
                  <td>
                    <span className={cn("status-badge", `status-${shipment.status}`)}>
                      {statusLabels[shipment.status]}
                    </span>
                  </td>
                  <td>{shipment.date}</td>
                  <td className="font-semibold">{shipment.amount} ر.س</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-accent hover:text-accent">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            عرض {filteredShipments.length} من {shipments.length} شحنة
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              السابق
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              التالي
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shipments;
