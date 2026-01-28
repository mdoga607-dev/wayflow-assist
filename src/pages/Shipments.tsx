// pages/Shipments.tsx
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Printer,
  MessageSquare,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useShipments, useUpdateShipmentStatus, useDeleteShipment, Shipment } from "@/hooks/useShipments";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
  returned: "مرتجع",
};

const Shipments = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [cityFilter, setCityFilter] = useState<"all" | string>("all");
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<string>("pending");
  const [sendSMS, setSendSMS] = useState(true);

  const { data: shipments = [], isLoading } = useShipments();
  const updateStatus = useUpdateShipmentStatus();
  const deleteShipment = useDeleteShipment();

  // استخراج المدن بشكل آمن (string فقط)
  const cities = useMemo<string[]>(() => {
    const citySet = new Set<string>();

    shipments.forEach((shipment) => {
      const city = shipment.recipient_city;
      if (city && typeof city === "string" && city.trim().length > 0) {
        citySet.add(city.trim());
      }
    });

    return Array.from(citySet).sort();
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        shipment.tracking_number?.toLowerCase().includes(q) ||
        shipment.recipient_name?.toLowerCase().includes(q) ||
        shipment.recipient_phone?.includes(q);

      const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
      const matchesCity = cityFilter === "all" || shipment.recipient_city === cityFilter;

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [shipments, searchQuery, statusFilter, cityFilter]);

  const handleSelectShipment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments((prev) => [...prev, id]);
    } else {
      setSelectedShipments((prev) => prev.filter((s) => s !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(filteredShipments.map((s) => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const handleBulkPrint = () => {
    if (selectedShipments.length === 0) {
      toast({
        title: "يرجى اختيار شحنة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    // حفظ IDs في localStorage ثم التوجيه
    localStorage.setItem("selectedShipmentIds", JSON.stringify(selectedShipments));
    navigate("/print-labels");
  };

  const openEditDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setNewStatus(shipment.status || "pending");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setDeleteDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedShipment || !newStatus) return;

    try {
      await updateStatus.mutateAsync({
        shipmentId: selectedShipment.id,
        newStatus,
        sendSMS,
      });
      setEditDialogOpen(false);
      setSelectedShipment(null);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleDelete = async () => {
    if (!selectedShipment) return;

    try {
      await deleteShipment.mutateAsync(selectedShipment.id);
      setDeleteDialogOpen(false);
      setSelectedShipment(null);
    } catch (err) {
      console.error("Error deleting shipment:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">قائمة الشحنات</h1>
          <p className="text-muted-foreground">إدارة وتتبع جميع الشحنات</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleBulkPrint}
            disabled={selectedShipments.length === 0}
          >
            <Printer className="h-4 w-4" />
            طباعة ({selectedShipments.length})
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Link to="/add-shipment">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة شحنة
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[260px]">
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
              <SelectItem value="returned">مرتجع</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="المدينة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المدن</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 p-4 text-center">
                  <Checkbox
                    checked={
                      selectedShipments.length === filteredShipments.length &&
                      filteredShipments.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-right">رقم الشحنة</th>
                <th className="p-4 text-right">العميل</th>
                <th className="p-4 text-right">الهاتف</th>
                <th className="p-4 text-right">المدينة</th>
                <th className="p-4 text-right">التاجر</th>
                <th className="p-4 text-right">المندوب</th>
                <th className="p-4 text-right">الحالة</th>
                <th className="p-4 text-right">المبلغ</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment, index) => (
                <tr
                  key={shipment.id}
                  className="border-b hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="p-4 text-center">
                    <Checkbox
                      checked={selectedShipments.includes(shipment.id)}
                      onCheckedChange={(checked) =>
                        handleSelectShipment(shipment.id, !!checked)
                      }
                    />
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/track/${shipment.tracking_number}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {shipment.tracking_number}
                    </Link>
                  </td>
                  <td className="p-4 font-medium">{shipment.recipient_name}</td>
                  <td className="p-4 font-mono text-right dir-ltr">
                    {shipment.recipient_phone}
                  </td>
                  <td className="p-4">{shipment.recipient_city || "—"}</td>
                  <td className="p-4">{shipment.shippers?.name || "—"}</td>
                  <td className="p-4">{shipment.delegates?.name || "—"}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "inline-block px-2.5 py-1 text-xs font-medium rounded-full",
                        shipment.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : shipment.status === "transit"
                          ? "bg-blue-100 text-blue-800"
                          : shipment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : shipment.status === "delayed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {statusLabels[shipment.status || "pending"]}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">
                    {shipment.cod_amount ? `${shipment.cod_amount} ر.س` : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-center">
                      <Link to={`/track/${shipment.tracking_number}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(shipment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                        onClick={() => openDeleteDialog(shipment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t text-sm text-muted-foreground text-center sm:text-right">
          عرض {filteredShipments.length} من أصل {shipments.length} شحنة
        </div>
      </div>

      {/* تعديل الحالة */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل حالة الشحنة</DialogTitle>
            <DialogDescription>
              رقم التتبع: {selectedShipment?.tracking_number || "—"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">الحالة الجديدة</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="transit">قيد التوصيل</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="delayed">متأخر</SelectItem>
                  <SelectItem value="returned">مرتجع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="send-sms"
                checked={sendSMS}
                onCheckedChange={(checked) => setSendSMS(!!checked)}
              />
              <label
                htmlFor="send-sms"
                className="text-sm font-medium leading-none flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                إرسال إشعار SMS للعميل
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatus.isPending || !newStatus}
            >
              {updateStatus.isPending ? "جاري التحديث..." : "تحديث الحالة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الشحنة رقم {selectedShipment?.tracking_number || "—"} نهائيًا.
              <br />
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteShipment.isPending}
            >
              {deleteShipment.isPending ? "جاري الحذف..." : "حذف الشحنة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Shipments;