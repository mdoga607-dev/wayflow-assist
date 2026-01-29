// pages/DelegatesManagement.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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

// نوع المندوب (محدث)
interface Delegate {
  id: string;
  name: string;
  phone: string | null;
  branch: string | null;
  city: string | null;
  avatar_url: string | null;
  total_delivered: number;
  total_delayed: number;
  total_returned: number;
  balance: number | null;
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

  // جلب المناديب
  const { data: delegates = [], isLoading } = useQuery<Delegate[]>({
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

  // إضافة مندوب
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
      toast({ title: "خطأ في الإضافة", description: error.message, variant: "destructive" });
    },
  });

  // تعديل مندوب
  const updateDelegateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase.from("delegates").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegates"] });
      toast({ title: "تم التحديث بنجاح" });
      setEditingDelegate(null);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "خطأ في التحديث", description: error.message, variant: "destructive" });
    },
  });

  // حذف مندوب
  const deleteDelegateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delegates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegates"] });
      toast({ title: "تم الحذف بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في الحذف", description: error.message, variant: "destructive" });
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

  // استخراج الفروع بشكل آمن
  const branches = useMemo(() => {
    const branchSet = new Set<string>();
    delegates.forEach((d) => {
      if (d.branch && typeof d.branch === "string" && d.branch.trim()) {
        branchSet.add(d.branch.trim());
      }
    });
    return Array.from(branchSet).sort();
  }, [delegates]);

  // فلترة المناديب
  const filteredDelegates = delegates.filter((delegate) => {
    const matchesSearch =
      delegate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (delegate.phone && delegate.phone.includes(searchQuery));

    const matchesBranch = branchFilter === "all" || delegate.branch === branchFilter;
    const matchesStatus = statusFilter === "all" || delegate.status === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  // إحصائيات
  const stats = {
    total: delegates.length,
    active: delegates.filter((d) => d.status === "active").length,
    totalDelivered: delegates.reduce((sum, d) => sum + (d.total_delivered || 0), 0),
    totalBalance: delegates.reduce((sum, d) => sum + (Number(d.balance) || 0), 0),
  };

  return (
    <div className="space-y-6 container py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              <DialogTitle>
                {editingDelegate ? "تعديل بيانات المندوب" : "إضافة مندوب جديد"}
              </DialogTitle>
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
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="on_leave">في إجازة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  addDelegateMutation.isPending ||
                  updateDelegateMutation.isPending ||
                  !formData.name.trim()
                }
              >
                {addDelegateMutation.isPending || updateDelegateMutation.isPending
                  ? "جاري الحفظ..."
                  : editingDelegate
                  ? "حفظ التعديلات"
                  : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
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
              <div className="p-3 bg-green-500/10 rounded-lg">
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
              <div className="p-3 bg-blue-500/10 rounded-lg">
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
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأرصدة</p>
                <p className="text-2xl font-bold">
                  {stats.totalBalance.toLocaleString()} ج.م
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[260px] relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="الفرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفروع</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المناديب ({filteredDelegates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : filteredDelegates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا يوجد مناديب مطابقين لعملية البحث أو الفلترة
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                    const totalAttempts =
                      delegate.total_delivered +
                      delegate.total_delayed +
                      delegate.total_returned;
                    const successRate =
                      totalAttempts > 0
                        ? Math.round((delegate.total_delivered / totalAttempts) * 100)
                        : 0;

                    return (
                      <TableRow key={delegate.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={delegate.avatar_url ?? undefined} />
                              <AvatarFallback>
                                {delegate.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
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
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {delegate.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {delegate.branch && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {delegate.branch}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p className="text-green-600">تسليم: {delegate.total_delivered}</p>
                            <p className="text-red-600">متأخر: {delegate.total_delayed}</p>
                            <p className="text-amber-600">مرتجع: {delegate.total_returned}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={successRate} className="h-2 w-20" />
                            <span className="text-sm font-medium">{successRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {delegate.balance != null
                              ? `${Number(delegate.balance).toLocaleString()} ج.م`
                              : "—"}
                          </p>
                          {delegate.commission_due > 0 && (
                            <p className="text-xs text-muted-foreground">
                              عمولة مستحقة: {Number(delegate.commission_due).toLocaleString()}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusLabels[delegate.status]?.variant || "secondary"
                            }
                          >
                            {statusLabels[delegate.status]?.label || delegate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link to={`/delegate/${delegate.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(delegate)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              {/* Dialog content same as before */}
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حذف المندوب "{delegate.name}"؟ هذا الإجراء لا
                                    يمكن التراجع عنه.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteDelegateMutation.mutate(delegate.id)}
                                    className="bg-destructive hover:bg-destructive/90"
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DelegatesManagement;