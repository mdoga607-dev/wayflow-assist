import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DialogDescription,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MoreVertical,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

type AppRole = 'head_manager' | 'user' | 'guest';

interface UserData {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole;
  email?: string;
}

// Demo data for display when no real data exists
const demoUsers: UserData[] = [
  {
    id: "1",
    user_id: "demo-1",
    full_name: "أحمد محمد",
    phone: "01012345678",
    city: "القاهرة",
    avatar_url: null,
    created_at: "2024-01-15",
    role: "head_manager",
    email: "ahmed@example.com",
  },
  {
    id: "2",
    user_id: "demo-2",
    full_name: "محمد علي",
    phone: "01098765432",
    city: "الإسكندرية",
    avatar_url: null,
    created_at: "2024-01-10",
    role: "user",
    email: "mohamed@example.com",
  },
  {
    id: "3",
    user_id: "demo-3",
    full_name: "سارة أحمد",
    phone: "01123456789",
    city: "الجيزة",
    avatar_url: null,
    created_at: "2024-01-08",
    role: "user",
    email: "sara@example.com",
  },
  {
    id: "4",
    user_id: "demo-4",
    full_name: "زائر عام",
    phone: "01234567890",
    city: "المنصورة",
    avatar_url: null,
    created_at: "2024-01-05",
    role: "guest",
    email: "guest@example.com",
  },
];

const getRoleBadge = (role: AppRole) => {
  switch (role) {
    case "head_manager":
      return (
        <Badge className="bg-primary text-primary-foreground">
          <ShieldCheck className="w-3 h-3 ml-1" />
          مدير عام
        </Badge>
      );
    case "user":
      return (
        <Badge variant="secondary">
          <User className="w-3 h-3 ml-1" />
          مستخدم
        </Badge>
      );
    case "guest":
      return (
        <Badge variant="outline">
          <User className="w-3 h-3 ml-1" />
          زائر
        </Badge>
      );
  }
};

const UserManagement = () => {
  const { toast } = useToast();
  const { isHeadManager } = useAuth();
  const [users, setUsers] = useState<UserData[]>(demoUsers);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    role: "user" as AppRole,
  });

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.includes(searchQuery) ||
      (user.phone && user.phone.includes(searchQuery)) ||
      (user.email && user.email.includes(searchQuery));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesCity = cityFilter === "all" || user.city === cityFilter;
    return matchesSearch && matchesRole && matchesCity;
  });

  const cities = [...new Set(users.map((u) => u.city).filter(Boolean))];

  const stats = {
    total: users.length,
    headManagers: users.filter((u) => u.role === "head_manager").length,
    regularUsers: users.filter((u) => u.role === "user").length,
    guests: users.filter((u) => u.role === "guest").length,
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email || "",
      phone: user.phone || "",
      city: user.city || "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // Demo update - in real app, this would update the database
    setUsers(users.map((u) =>
      u.id === selectedUser.id
        ? { ...u, ...formData }
        : u
    ));

    toast({
      title: "تم التحديث",
      description: "تم تحديث بيانات المستخدم بنجاح",
    });
    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId: string) => {
    // Demo delete
    setUsers(users.filter((u) => u.id !== userId));
    toast({
      title: "تم الحذف",
      description: "تم حذف المستخدم بنجاح",
    });
  };

  const handleAddUser = async () => {
    // Demo add - in real app, this would create the user in the database
    const newUser: UserData = {
      id: Date.now().toString(),
      user_id: `demo-${Date.now()}`,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      avatar_url: null,
      created_at: new Date().toISOString(),
      role: formData.role,
    };

    setUsers([...users, newUser]);

    toast({
      title: "تم الإضافة",
      description: "تم إضافة المستخدم بنجاح",
    });
    setIsAddDialogOpen(false);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      city: "",
      role: "user",
    });
  };

  if (!isHeadManager) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground">
              هذه الصفحة متاحة فقط للمدير العام
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground">إضافة وتعديل وحذف المستخدمين وإدارة صلاحياتهم</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 ml-2" />
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات المستخدم الجديد
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="أدخل الاسم"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="المدينة"
                />
              </div>
              <div className="space-y-2">
                <Label>الصلاحية</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head_manager">مدير عام</SelectItem>
                    <SelectItem value="user">مستخدم</SelectItem>
                    <SelectItem value="guest">زائر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddUser}>إضافة</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{stats.headManagers}</p>
            <p className="text-sm text-muted-foreground">مدراء</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.regularUsers}</p>
            <p className="text-sm text-muted-foreground">مستخدمين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-500">{stats.guests}</p>
            <p className="text-sm text-muted-foreground">زوار</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>قائمة المستخدمين</CardTitle>
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 w-48"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الصلاحية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="head_manager">مدير عام</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="guest">زائر</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المدن</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city!}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">الصلاحية</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا يوجد مستخدمين مطابقين للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {user.phone || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {user.city || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(user.created_at), "yyyy/MM/dd")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف المستخدم "{user.full_name}"؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              عرض {filteredUsers.length} من {users.length} مستخدم
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>
              تعديل بيانات وصلاحيات المستخدم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الصلاحية</Label>
              <Select
                value={formData.role}
                onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head_manager">مدير عام</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="guest">زائر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateUser}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
