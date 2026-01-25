import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Store,
  Phone,
  Mail,
  MapPin,
  Package,
  Wallet,
  Building,
  User,
} from "lucide-react";

interface Shipper {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  branch: string | null;
  logo_url: string | null;
  total_shipments: number;
  active_shipments: number;
  balance: number;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "نشط", variant: "default" },
  inactive: { label: "غير نشط", variant: "secondary" },
  suspended: { label: "موقوف", variant: "destructive" },
};

const ShippersManagement = () => {
  const { isHeadManager } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingShipper, setEditingShipper] = useState<Shipper | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    branch: "",
    status: "active",
  });

  // Fetch shippers
  const { data: shippers = [], isLoading } = useQuery({
    queryKey: ["shippers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shippers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Shipper[];
    },
  });

  // Add shipper mutation
  const addShipperMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("shippers").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippers"] });
      toast({ title: "تم إضافة التاجر بنجاح" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "خطأ في إضافة التاجر", description: error.message, variant: "destructive" });
    },
  });

  // Update shipper mutation
  const updateShipperMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Shipper> }) => {
      const { error } = await supabase.from("shippers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippers"] });
      toast({ title: "تم تحديث بيانات التاجر بنجاح" });
      setEditingShipper(null);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "خطأ في تحديث البيانات", description: error.message, variant: "destructive" });
    },
  });

  // Delete shipper mutation
  const deleteShipperMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shippers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippers"] });
      toast({ title: "تم حذف التاجر بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في حذف التاجر", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      branch: "",
      status: "active",
    });
  };

  const openEditDialog = (shipper: Shipper) => {
    setEditingShipper(shipper);
    setFormData({
      name: shipper.name,
      phone: shipper.phone || "",
      email: shipper.email || "",
      address: shipper.address || "",
      city: shipper.city || "",
      branch: shipper.branch || "",
      status: shipper.status,
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "يرجى إدخال اسم التاجر", variant: "destructive" });
      return;
    }

    if (editingShipper) {
      updateShipperMutation.mutate({ id: editingShipper.id, data: formData });
    } else {
      addShipperMutation.mutate(formData);
    }
  };

  // Get unique cities for filter
  const cities = [...new Set(shippers.map((s) => s.city).filter(Boolean))];

  // Filter shippers
  const filteredShippers = shippers.filter((shipper) => {
    const matchesSearch =
      shipper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipper.phone?.includes(searchQuery) ||
      shipper.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === "all" || shipper.city === cityFilter;
    const matchesStatus = statusFilter === "all" || shipper.status === statusFilter;
    return matchesSearch && matchesCity && matchesStatus;
  });

  // Statistics
  const stats = {
    total: shippers.length,
    active: shippers.filter((s) => s.status === "active").length,
    totalShipments: shippers.reduce((sum, s) => sum + s.total_shipments, 0),
    totalBalance: shippers.reduce((sum, s) => sum + Number(s.balance), 0),
  };

  if (!isHeadManager) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">غير مصرح لك بالوصول لهذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الشيبرز (التجار)</h1>
          <p className="text-muted-foreground">إدارة بيانات التجار والراسلين</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة تاجر جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة تاجر جديد</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم التاجر *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم التاجر"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="البريد الإلكتروني"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="العنوان التفصيلي"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="المدينة"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">الفرع</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="الفرع"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="suspended">موقوف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={addShipperMutation.isPending}>
                {addShipperMutation.isPending ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التجار</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تجار نشطين</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                <p className="text-2xl font-bold">{stats.totalShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأرصدة</p>
                <p className="text-2xl font-bold">{stats.totalBalance.toLocaleString()} ج.م</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو الهاتف أو البريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المدن</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city!}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shippers Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة التجار ({filteredShippers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredShippers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد تجار مطابقين للبحث
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاجر</TableHead>
                  <TableHead>التواصل</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>الشحنات</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShippers.map((shipper) => (
                  <TableRow key={shipper.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{shipper.name}</p>
                          {shipper.branch && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {shipper.branch}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {shipper.phone && (
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {shipper.phone}
                          </p>
                        )}
                        {shipper.email && (
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {shipper.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {shipper.city && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {shipper.city}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shipper.total_shipments}</p>
                        <p className="text-xs text-muted-foreground">
                          {shipper.active_shipments} نشطة
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{Number(shipper.balance).toLocaleString()} ج.م</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[shipper.status]?.variant || "secondary"}>
                        {statusLabels[shipper.status]?.label || shipper.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog
                          open={editingShipper?.id === shipper.id}
                          onOpenChange={(open) => !open && setEditingShipper(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(shipper)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md" dir="rtl">
                            <DialogHeader>
                              <DialogTitle>تعديل بيانات التاجر</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">اسم التاجر *</Label>
                                <Input
                                  id="edit-name"
                                  value={formData.name}
                                  onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-phone">رقم الهاتف</Label>
                                  <Input
                                    id="edit-phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                      setFormData({ ...formData, phone: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                      setFormData({ ...formData, email: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-address">العنوان</Label>
                                <Input
                                  id="edit-address"
                                  value={formData.address}
                                  onChange={(e) =>
                                    setFormData({ ...formData, address: e.target.value })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-city">المدينة</Label>
                                  <Input
                                    id="edit-city"
                                    value={formData.city}
                                    onChange={(e) =>
                                      setFormData({ ...formData, city: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-branch">الفرع</Label>
                                  <Input
                                    id="edit-branch"
                                    value={formData.branch}
                                    onChange={(e) =>
                                      setFormData({ ...formData, branch: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-status">الحالة</Label>
                                <Select
                                  value={formData.status}
                                  onValueChange={(value) =>
                                    setFormData({ ...formData, status: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">نشط</SelectItem>
                                    <SelectItem value="inactive">غير نشط</SelectItem>
                                    <SelectItem value="suspended">موقوف</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter className="gap-2">
                              <Button variant="outline" onClick={() => setEditingShipper(null)}>
                                إلغاء
                              </Button>
                              <Button
                                onClick={handleSubmit}
                                disabled={updateShipperMutation.isPending}
                              >
                                {updateShipperMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف التاجر "{shipper.name}"؟ لا يمكن التراجع عن هذا
                                الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteShipperMutation.mutate(shipper.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippersManagement;
