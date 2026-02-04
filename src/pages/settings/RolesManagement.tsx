/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/settings/RolesManagementPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Plus, 
  Search, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Eye,
  Key,
  Users,
  Database,
  Lock,
  Unlock,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Role {
  id: string;
  name: string;
  code: string;
  permissions: string[];
  description?: string;
  users_count: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

const RolesManagementPage = () => {
  const navigate = useNavigate();
  const { role: userRole, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [] as string[],
  });
  const [availablePermissions, setAvailablePermissions] = useState([
    { value: 'view_dashboard', label: 'عرض لوحة التحكم', category: 'general' },
    { value: 'view_all_shipments', label: 'عرض جميع الشحنات', category: 'shipments' },
    { value: 'create_shipment', label: 'إنشاء شحنة جديدة', category: 'shipments' },
    { value: 'edit_shipment', label: 'تعديل الشحنات', category: 'shipments' },
    { value: 'delete_shipment', label: 'حذف الشحنات', category: 'shipments' },
    { value: 'view_courier_shipments', label: 'عرض شحنات المناديب', category: 'shipments' },
    { value: 'manage_pickup_requests', label: 'إدارة طلبات البيك أب', category: 'shipments' },
    { value: 'view_all_delegates', label: 'عرض جميع المناديب', category: 'delegates' },
    { value: 'create_delegate', label: 'إضافة مندوب جديد', category: 'delegates' },
    { value: 'edit_delegate', label: 'تعديل بيانات المناديب', category: 'delegates' },
    { value: 'delete_delegate', label: 'حذف المناديب', category: 'delegates' },
    { value: 'view_all_shippers', label: 'عرض جميع التجار', category: 'shippers' },
    { value: 'create_shipper', label: 'إضافة تاجر جديد', category: 'shippers' },
    { value: 'edit_shipper', label: 'تعديل بيانات التجار', category: 'shippers' },
    { value: 'delete_shipper', label: 'حذف التجار', category: 'shippers' },
    { value: 'view_all_stores', label: 'عرض جميع المتاجر', category: 'stores' },
    { value: 'create_store', label: 'إضافة متجر جديد', category: 'stores' },
    { value: 'manage_sheets', label: 'إدارة الشيتات', category: 'sheets' },
    { value: 'create_sheet', label: 'إنشاء شيت جديد', category: 'sheets' },
    { value: 'view_financial_reports', label: 'عرض التقارير المالية', category: 'finance' },
    { value: 'manage_balance', label: 'إدارة الحسابات', category: 'finance' },
    { value: 'view_complaints', label: 'عرض الشكاوى', category: 'complaints' },
    { value: 'manage_complaints', label: 'إدارة الشكاوى', category: 'complaints' },
    { value: 'manage_areas', label: 'إدارة المناطق', category: 'areas' },
    { value: 'manage_users', label: 'إدارة المستخدمين', category: 'users' },
    { value: 'manage_roles', label: 'إدارة الصلاحيات', category: 'system' },
    { value: 'view_system_settings', label: 'عرض إعدادات النظام', category: 'system' },
    { value: 'manage_system_settings', label: 'تعديل إعدادات النظام', category: 'system' },
    { value: 'access_admin_panel', label: 'الوصول للوحة التحكم', category: 'system' },
  ]);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && userRole !== 'head_manager') {
      toast({
        title: "غير مصرح",
        description: "فقط المدير العام يمكنه إدارة الصلاحيات",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, userRole, navigate]);

  // جلب الأدوار من قاعدة البيانات
  useEffect(() => {
    if (!authLoading && userRole === 'head_manager') {
      fetchRoles();
    }
  }, [authLoading, userRole]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // جلب الأدوار مع عدد المستخدمين لكل دور
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select(`
          *,
          users_count:users!inner(count)
        `)
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      
      // تحويل البيانات إلى الشكل المطلوب
      const formattedRoles = (rolesData || []).map((role: any) => ({
        id: role.id,
        name: role.name,
        code: role.code,
        permissions: role.permissions || [],
        description: role.description || '',
        users_count: role.users_count?.count || 0,
        status: role.status,
        created_at: role.created_at,
        updated_at: role.updated_at
      }));
      
      setRoles(formattedRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "فشل التحميل",
        description: "حدث خطأ أثناء تحميل الأدوار. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // فتح نافذة إنشاء دور جديد
  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      permissions: []
    });
    setIsDialogOpen(true);
  };

  // فتح نافذة تعديل دور
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
      permissions: [...role.permissions]
    });
    setIsDialogOpen(true);
  };

  // حذف دور
  const handleDeleteRole = async () => {
    if (!deletingRoleId) return;
    
    setDialogLoading(true);
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', deletingRoleId);

      if (error) throw error;

      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الدور بنجاح"
      });
      
      // تحديث القائمة
      await fetchRoles();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "فشل الحذف",
        description: "لا يمكن حذف هذا الدور لأنه مرتبط بمستخدمين",
        variant: "destructive"
      });
    } finally {
      setDialogLoading(false);
      setDeletingRoleId(null);
    }
  };

  // تبديل حالة الدور (نشط/غير نشط)
  const handleToggleStatus = async (roleId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('roles')
        .update({ status: newStatus })
        .eq('id', roleId);

      if (error) throw error;

      // تحديث القائمة
      setRoles(prev => prev.map(role => 
        role.id === roleId ? { ...role, status: newStatus } : role
      ));
      
      toast({
        title: "تم التحديث",
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} الدور بنجاح`
      });
    } catch (error) {
      console.error('Error toggling role status:', error);
      toast({
        title: "فشل التحديث",
        description: "حدث خطأ أثناء تحديث حالة الدور",
        variant: "destructive"
      });
    }
  };

  // حفظ الدور (إنشاء أو تعديل)
  const handleSaveRole = async () => {
    // التحقق من البيانات
    if (!formData.name.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم الدور", variant: "destructive" });
      return;
    }
    
    if (!formData.code.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال كود الدور", variant: "destructive" });
      return;
    }
    
    if (formData.permissions.length === 0) {
      toast({ title: "خطأ", description: "يرجى اختيار صلاحيات للدور", variant: "destructive" });
      return;
    }

    setDialogLoading(true);
    try {
      if (selectedRole) {
        // تعديل دور موجود
        const { error } = await supabase
          .from('roles')
          .update({
            name: formData.name.trim(),
            code: formData.code.trim().toLowerCase(),
            description: formData.description.trim(),
            permissions: formData.permissions
          })
          .eq('id', selectedRole.id);

        if (error) throw error;
        
        toast({ title: "تم التعديل بنجاح", description: "تم تحديث الدور بنجاح" });
      } else {
        // إنشاء دور جديد
        const { error } = await supabase
          .from('roles')
          .insert([{
            name: formData.name.trim(),
            code: formData.code.trim().toLowerCase(),
            description: formData.description.trim(),
            permissions: formData.permissions,
            status: 'active'
          }]);

        if (error) throw error;
        
        toast({ title: "تم الإنشاء بنجاح", description: "تم إنشاء الدور الجديد بنجاح" });
      }
      
      // تحديث القائمة وإغلاق النافذة
      await fetchRoles();
      setIsDialogOpen(false);
      setFormData({ name: '', code: '', description: '', permissions: [] });
    } catch (error: any) {
      console.error('Error saving role:', error);
      
      if (error.code === '23505') {
        toast({
          title: "خطأ",
          description: "كود الدور موجود مسبقاً. يرجى اختيار كود فريد.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل الحفظ",
          description: error.message || "حدث خطأ أثناء حفظ الدور",
          variant: "destructive"
        });
      }
    } finally {
      setDialogLoading(false);
    }
  };

  // تصفية الأدوار حسب البحث
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // تبديل اختيار صلاحية
  const togglePermission = (permission: string) => {
    setFormData(prev => {
      if (prev.permissions.includes(permission)) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permission) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permission] };
      }
    });
  };

  // تحديد جميع الصلاحيات
  const toggleAllPermissions = () => {
    if (formData.permissions.length === availablePermissions.length) {
      setFormData(prev => ({ ...prev, permissions: [] }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        permissions: availablePermissions.map(p => p.value) 
      }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-foreground">جاري تحميل الأدوار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6 bg-background text-foreground min-h-screen" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <span>إدارة صلاحيات المستخدمين</span>
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            التحكم الكامل في أدوار وصلاحيات المستخدمين في النظام
          </p>
        </div>
        <Button 
          onClick={handleCreateRole}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          إنشاء دور جديد
        </Button>
      </div>

      {/* ملاحظات هامة */}
      <Alert className="bg-blue-900/30 border-blue-500/30">
        <AlertCircle className="h-5 w-5 text-blue" />
        <AlertTitle className="text-blue">ملاحظات هامة:</AlertTitle>
        <AlertDescription className="text-blue space-y-1 mt-2">
          <p>• المدير العام (head_manager) لديه صلاحيات كاملة ولا يمكن تعديله أو حذفه</p>
          <p>• تعطيل دور سيمنع جميع المستخدمين المرتبطين به من تسجيل الدخول</p>
          <p>• لا يمكن حذف الأدوار المرتبطة بمستخدمين نشطين</p>
          <p>• الصلاحيات تُطبق فوراً بعد الحفظ دون الحاجة لإعادة تسجيل الدخول</p>
        </AlertDescription>
      </Alert>

      {/* بطاقة البحث والجدول */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                قائمة الأدوار ({filteredRoles.length})
              </CardTitle>
              <CardDescription className="mt-1">
                إدارة الأدوار وتعيين الصلاحيات للمستخدمين
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم الدور أو الكود أو الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 bg-background border-border"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-16">الكود</TableHead>
                  <TableHead>اسم الدور</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الصلاحيات</TableHead>
                  <TableHead className="text-center">
                    <Users className="h-4 w-4 inline-block mr-1" />
                    المستخدمون
                  </TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Shield className="h-12 w-12 opacity-50" />
                        <p className="text-lg font-medium">لا توجد أدوار مطابقة</p>
                        <p>جرب تعديل معايير البحث أو إنشاء دور جديد</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow 
                      key={role.id} 
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <Badge variant="outline" className="font-mono bg-primary/10 text-primary">
                          {role.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((perm, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs bg-muted text-foreground hover:bg-muted"
                            >
                              {perm.replace('_', ' ')}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{role.users_count.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Switch 
                            checked={role.status === 'active'} 
                            onCheckedChange={() => handleToggleStatus(role.id, role.status)}
                            disabled={role.code === 'head_manager'}
                            className={role.status === 'active' ? 'data-[state=checked]:bg-green-500' : 'data-[state=unchecked]:bg-red-500'}
                          />
                          <Badge 
                            variant="outline" 
                            className={`mr-2 px-2 py-0.5 text-xs ${
                              role.status === 'active' 
                                ? 'bg-green-900 text-green-300 border-green-500/30' 
                                : 'bg-red-900 text-red-300 border-red-500/30'
                            }`}
                          >
                            {role.status === 'active' ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                            className="h-8 hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingRoleId(role.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={role.code === 'head_manager' || role.users_count > 0}
                            className="h-8 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // يمكن إضافة وظيفة لعرض تفاصيل أكثر عن الدور
                              toast({ title: "سيتم إضافة عرض التفاصيل لاحقاً" });
                            }}
                            className="h-8 hover:bg-muted"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* ملخص الأدوار */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-muted/30 border-border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الأدوار</p>
                    <p className="text-2xl font-bold mt-1">{roles.length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الأدوار النشطة</p>
                    <p className="text-2xl font-bold mt-1 text-green-400">
                      {roles.filter(r => r.status === 'active').length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الأدوار المعطلة</p>
                    <p className="text-2xl font-bold mt-1 text-red-400">
                      {roles.filter(r => r.status === 'inactive').length}
                    </p>
                  </div>
                  <X className="h-8 w-8 text-red-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold mt-1 text-blue-400">
                      {roles.reduce((sum, r) => sum + r.users_count, 0).toLocaleString()}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* نافذة إنشاء/تعديل الدور */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Key className="h-6 w-6 text-primary" />
              {selectedRole ? 'تعديل الدور' : 'إنشاء دور جديد'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedRole 
                ? 'قم بتعديل تفاصيل الدور وصلاحياته' 
                : 'أدخل تفاصيل الدور الجديد وحدد الصلاحيات المطلوبة'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* اسم الدور */}
            <div className="space-y-2">
              <Label htmlFor="name">اسم الدور <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: مدير فرع، مندوب مبيعات"
                className="bg-background border-border"
                required
              />
            </div>
            
            {/* كود الدور */}
            <div className="space-y-2">
              <Label htmlFor="code">كود الدور <span className="text-destructive">*</span></Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="مثال: branch_manager, sales_agent"
                className="bg-background border-border font-mono"
                required
                disabled={!!selectedRole}
              />
              {selectedRole && (
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ لا يمكن تغيير كود الدور بعد الإنشاء
                </p>
              )}
            </div>
            
            {/* الوصف */}
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مفصل للدور ومسؤولياته"
                className="bg-background border-border min-h-[80px] resize-none"
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length}/255
              </p>
            </div>
            
            <Separator className="my-2 bg-border" />
            
            {/* الصلاحيات */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  الصلاحيات <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllPermissions}
                  className="h-7 text-xs"
                >
                  {formData.permissions.length === availablePermissions.length 
                    ? 'إلغاء الكل' 
                    : 'تحديد الكل'}
                </Button>
              </div>
              
              {/* تصنيف الصلاحيات */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 border border-border rounded-lg p-3 bg-background/50">
                {['general', 'shipments', 'delegates', 'shippers', 'stores', 'sheets', 'finance', 'complaints', 'areas', 'users', 'system'].map((category) => {
                  const categoryPermissions = availablePermissions.filter(p => p.category === category);
                  if (categoryPermissions.length === 0) return null;
                  
                  const categoryLabels: Record<string, string> = {
                    general: 'عامة',
                    shipments: 'الشحنات',
                    delegates: 'المناديب',
                    shippers: 'التجار',
                    stores: 'المتاجر',
                    sheets: 'الشيتات',
                    finance: 'المالية',
                    complaints: 'الشكاوى',
                    areas: 'المناطق',
                    users: 'المستخدمين',
                    system: 'النظام'
                  };
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded">
                        <span className="font-medium text-sm">{categoryLabels[category]}</span>
                        <span className="text-xs text-muted-foreground">
                          ({categoryPermissions.filter(p => formData.permissions.includes(p.value)).length}/{categoryPermissions.length})
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-3">
                        {categoryPermissions.map((perm) => (
                          <div 
                            key={perm.value} 
                            className="flex items-start gap-2 p-2 hover:bg-muted/30 rounded transition-colors cursor-pointer"
                            onClick={() => togglePermission(perm.value)}
                          >
                            <div className={`mt-1 rounded-full w-4 h-4 border-2 flex items-center justify-center ${
                              formData.permissions.includes(perm.value)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/50'
                            }`}>
                              {formData.permissions.includes(perm.value) && (
                                <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
                              )}
                            </div>
                            <label className="text-sm cursor-pointer flex-1">
                              {perm.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                <AlertCircle className="h-3 w-3 inline-block mr-1" />
                ملاحظة: تحديد صلاحية "الوصول للوحة التحكم" ضروري لتمكين المستخدم من تسجيل الدخول
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={dialogLoading}
              className="border-border hover:bg-muted"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={dialogLoading || formData.permissions.length === 0}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {dialogLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {selectedRole ? 'حفظ التغييرات' : 'إنشاء الدور'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* نافذة تأكيد الحذف */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-card border-destructive/30 text-foreground">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-destructive">
              تأكيد حذف الدور
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              هل أنت متأكد من حذف هذا الدور؟ هذه العملية لا يمكن التراجع عنها.
            </DialogDescription>
          </DialogHeader>
          
          {deletingRoleId && (
            <div className="py-4">
              <Alert variant="destructive" className="border-destructive/30">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-destructive">تحذير هام:</AlertTitle>
                <AlertDescription>
                  <ul className="space-y-1 mt-2 pr-4 list-disc">
                    <li>سيتم حذف الدور نهائياً من النظام</li>
                    <li>المستخدمون المرتبطون بهذا الدور سيصبحون غير نشطين</li>
                    <li>لا يمكن استعادة الدور بعد الحذف</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={dialogLoading}
              className="border-border hover:bg-muted"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={dialogLoading}
              className="gap-2 bg-destructive hover:bg-destructive/90"
            >
              {dialogLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  حذف نهائي
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesManagementPage;