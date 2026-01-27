import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Wallet,
  Building,
  User,
  TrendingUp,
  Package,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";

interface Delegate {
  id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  branch: string | null;
  city: string | null;
  avatar_url: string | null;
  total_delivered: number;
  total_delayed: number;
  total_returned: number;
  balance: number;
  commission_due: number;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "نشط", variant: "default" },
  inactive: { label: "غير نشط", variant: "secondary" },
  on_leave: { label: "في إجازة", variant: "outline" },
};

const DelegatesManagement = () => {
  const { isHeadManager } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDelegate, setEditingDelegate] = useState<Delegate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    branch: "",
    city: "",
    status: "active",
  });

  // Fetch delegates
  const { data: delegates = [], isLoading } = useQuery({
    queryKey: ["delegates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delegates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Delegate[];
    },
  });

  // Add delegate mutation
  const addDelegateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("delegates").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegates"] });
      toast({ title: "تم إضافة المندوب بنجاح" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "خطأ في إضافة المندوب", description: error.message, variant: "destructive" });
    },
  });

  // Update delegate mutation
  const updateDelegateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Delegate> }) => {
      const { error } = await supabase.from("delegates").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegates"] });
      toast({ title: "تم تحديث بيانات المندوب بنجاح" });
      setEditingDelegate(null);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "خطأ في تحديث البيانات", description: error.message, variant: "destructive" });
    },
  });

  // Delete delegate mutation
  const deleteDelegateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delegates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegates"] });
      toast({ title: "تم حذف المندوب بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في حذف المندوب", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      branch: "",
      city: "",
      status: "active",
    });
  };

  const openEditDialog = (delegate: Delegate) => {
    setEditingDelegate(delegate);
    setFormData({
      name: delegate.name,
      phone: delegate.phone || "",
      branch: delegate.branch || "",
      city: delegate.city || "",
      status: delegate.status,
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "يرجى إدخال اسم المندوب", variant: "destructive" });
      return;
    }

    if (editingDelegate) {
      updateDelegateMutation.mutate({ id: editingDelegate.id, data: formData });
    } else {
      addDelegateMutation.mutate(formData);
    }
  };

  // Get unique branches for filter
  const branches = [...new Set(delegates.map((d) => d.branch).filter(Boolean))];

  // Filter delegates
  const filteredDelegates = delegates.filter((delegate) => {
    const matchesSearch =
      delegate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delegate.phone?.includes(searchQuery);
    const matchesBranch = branchFilter === "all" || delegate.branch === branchFilter;
    const matchesStatus = statusFilter === "all" || delegate.status === statusFilter;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: delegates.length,
    active: delegates.filter((d) => d.status === "active").length,
    totalDelivered: delegates.reduce((sum, d) => sum + d.total_delivered, 0),
    totalBalance: delegates.reduce((sum, d) => sum + Number(d.balance), 0),
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
          <h1 className="text-2xl font-bold">إدارة المناديب</h1>
          <p className="text-muted-foreground">إدارة بيانات المناديب والتسليمات</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة مندوب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مندوب جديد</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المندوب *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم المندوب"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف"
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
                    <SelectItem value="on_leave">في إجازة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={addDelegateMutation.isPending}>
                {addDelegateMutation.isPending ? "جاري الإضافة..." : "إضافة"}
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
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المناديب</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مناديب نشطين</p>
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
                <p className="text-sm text-muted-foreground">إجمالي التسليمات</p>
                <p className="text-2xl font-bold">{stats.totalDelivered}</p>
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
                  placeholder="بحث بالاسم أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الفرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفروع</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch!}>
                    {branch}
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
                <SelectItem value="on_leave">في إجازة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Delegates Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المناديب ({filteredDelegates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredDelegates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد مناديب مطابقين للبحث
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المندوب</TableHead>
                  <TableHead>التواصل</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>التسليمات</TableHead>
                  <TableHead>نسبة النجاح</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDelegates.map((delegate) => {
                  const total =
                    delegate.total_delivered + delegate.total_delayed + delegate.total_returned;
                  const successRate = total > 0 ? (delegate.total_delivered / total) * 100 : 0;

                  return (
                    <TableRow key={delegate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={delegate.avatar_url || undefined} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{delegate.name}</p>
                            {delegate.city && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {delegate.city}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {delegate.phone && (
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {delegate.phone}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {delegate.branch && (
                          <p className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            {delegate.branch}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p className="text-green-600">
                            تسليم: {delegate.total_delivered}
                          </p>
                          <p className="text-red-600">
                            متأخر: {delegate.total_delayed}
                          </p>
                          <p className="text-amber-600">
                            مرتجع: {delegate.total_returned}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={successRate} className="h-2 w-20" />
                          <span className="text-sm font-medium">{Math.round(successRate)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{Number(delegate.balance).toLocaleString()} ج.م</p>
                        {delegate.commission_due > 0 && (
                          <p className="text-xs text-muted-foreground">
                            عمولة: {Number(delegate.commission_due).toLocaleString()}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[delegate.status]?.variant || "secondary"}>
                          {statusLabels[delegate.status]?.label || delegate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link to={`/delegate/${delegate.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Dialog
                            open={editingDelegate?.id === delegate.id}
                            onOpenChange={(open) => !open && setEditingDelegate(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(delegate)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md" dir="rtl">
                              <DialogHeader>
                                <DialogTitle>تعديل بيانات المندوب</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">اسم المندوب *</Label>
                                  <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) =>
                                      setFormData({ ...formData, name: e.target.value })
                                    }
                                  />
                                </div>
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
                                      <SelectItem value="on_leave">في إجازة</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setEditingDelegate(null)}>
                                  إلغاء
                                </Button>
                                <Button
                                  onClick={handleSubmit}
                                  disabled={updateDelegateMutation.isPending}
                                >
                                  {updateDelegateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
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
                                  هل أنت متأكد من حذف المندوب "{delegate.name}"؟ لا يمكن التراجع عن
                                  هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteDelegateMutation.mutate(delegate.id)}
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DelegatesManagement;
