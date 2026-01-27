import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, Printer, MessageSquare } from "lucide-react";
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
import { useShipments, useUpdateShipmentStatus, useDeleteShipment } from "@/hooks/useShipments";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
  returned: "مرتجع",
};

const Shipments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [sendSMS, setSendSMS] = useState(true);

  const { data: shipments = [], isLoading, refetch } = useShipments();
  const updateStatus = useUpdateShipmentStatus();
  const deleteShipment = useDeleteShipment();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("shipments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shipments" },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

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
  };

  const openEditDialog = (shipment: any) => {
    setSelectedShipment(shipment);
    setNewStatus(shipment.status || "pending");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (shipment: any) => {
    setSelectedShipment(shipment);
    setDeleteDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (selectedShipment && newStatus) {
      await updateStatus.mutateAsync({
        shipmentId: selectedShipment.id,
        newStatus,
        sendSMS,
      });
      setEditDialogOpen(false);
      setSelectedShipment(null);
    }
  };

  const handleDelete = async () => {
    if (selectedShipment) {
      await deleteShipment.mutateAsync(selectedShipment.id);
      setDeleteDialogOpen(false);
      setSelectedShipment(null);
    }
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.recipient_name.includes(searchQuery) ||
      shipment.recipient_phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
    const matchesCity = cityFilter === "all" || shipment.recipient_city === cityFilter;
    return matchesSearch && matchesStatus && matchesCity;
  });

  const cities = [...new Set(shipments.map(s => s.recipient_city).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="space-y-6">
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
              <SelectItem value="returned">مرتجع</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="المدينة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المدن</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city!}>{city}</SelectItem>
              ))}
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
                <th>التاجر</th>
                <th>المندوب</th>
                <th>الحالة</th>
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
                  <td>
                    <Link to={`/track/${shipment.tracking_number}`} className="font-medium text-primary hover:underline">
                      {shipment.tracking_number}
                    </Link>
                  </td>
                  <td className="font-medium">{shipment.recipient_name}</td>
                  <td dir="ltr" className="text-right">{shipment.recipient_phone}</td>
                  <td>{shipment.recipient_city || "-"}</td>
                  <td>{shipment.shippers?.name || "-"}</td>
                  <td>{shipment.delegates?.name || "-"}</td>
                  <td>
                    <span className={cn("status-badge", `status-${shipment.status}`)}>
                      {statusLabels[shipment.status || "pending"]}
                    </span>
                  </td>
                  <td className="font-semibold">{shipment.cod_amount || 0} ر.س</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link to={`/track/${shipment.tracking_number}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-accent hover:text-accent"
                        onClick={() => openEditDialog(shipment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
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
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            عرض {filteredShipments.length} من {shipments.length} شحنة
          </p>
        </div>
      </div>

      {/* Edit Status Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تعديل حالة الشحنة</DialogTitle>
            <DialogDescription>
              تحديث حالة الشحنة {selectedShipment?.tracking_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">الحالة الجديدة</label>
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
            <div className="flex items-center gap-2">
              <Checkbox 
                id="sendSMS" 
                checked={sendSMS} 
                onCheckedChange={(checked) => setSendSMS(checked as boolean)} 
              />
              <label htmlFor="sendSMS" className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                إرسال إشعار SMS للعميل
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleStatusUpdate} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? "جاري التحديث..." : "تحديث الحالة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الشحنة {selectedShipment?.tracking_number} نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteShipment.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Shipments;
