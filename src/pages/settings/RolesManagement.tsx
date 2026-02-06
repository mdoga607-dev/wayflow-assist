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
import { 
  Shield, 
  Search, 
  Edit, 
  Loader2, 
  AlertCircle,
  Users,
  Lock,
  UserCog,
  Crown,
  User,
  UserX
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserWithRole {
  id: string;
  user_id: string;
  role: 'head_manager' | 'user' | 'guest';
  created_at: string;
  profile?: {
    full_name: string;
    phone: string | null;
    city: string | null;
  };
}

const roleLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  head_manager: { 
    label: 'مدير عام', 
    icon: <Crown className="h-4 w-4" />, 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' 
  },
  user: { 
    label: 'مستخدم', 
    icon: <User className="h-4 w-4" />, 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' 
  },
  guest: { 
    label: 'زائر', 
    icon: <UserX className="h-4 w-4" />, 
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' 
  },
};

const RolesManagementPage = () => {
  const navigate = useNavigate();
  const { role: userRole, loading: authLoading, user } = useAuth();
  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    if (!authLoading && userRole !== 'head_manager') {
      toast({
        title: "غير مصرح",
        description: "فقط المدير العام يمكنه إدارة الصلاحيات",
        variant: "destructive"
      });
      navigate('/app/dashboard');
    }
  }, [authLoading, userRole, navigate]);

  useEffect(() => {
    if (!authLoading && userRole === 'head_manager') {
      fetchUsersWithRoles();
    }
  }, [authLoading, userRole]);

  const fetchUsersWithRoles = async () => {
    try {
      setLoading(true);
      
      // Fetch user_roles with profiles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, city');

      if (profilesError) throw profilesError;

      // Map profiles to user_roles
      const usersWithProfiles = (rolesData || []).map((roleEntry: UserWithRole) => {
        const profile = profilesData?.find(p => p.user_id === roleEntry.user_id);
        return {
          ...roleEntry,
          profile: profile ? {
            full_name: profile.full_name,
            phone: profile.phone,
            city: profile.city
          } : undefined
        };
      });
      
      setUsersWithRoles(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل المستخدمين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (userWithRole: UserWithRole) => {
    setSelectedUser(userWithRole);
    setNewRole(userWithRole.role);
    setIsDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !newRole) return;

    // Prevent changing own role
    if (selectedUser.user_id === user?.id) {
      toast({
        title: "خطأ",
        description: "لا يمكنك تغيير صلاحياتك الخاصة",
        variant: "destructive"
      });
      return;
    }

    setDialogLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث صلاحيات المستخدم بنجاح"
      });
      
      await fetchUsersWithRoles();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الصلاحيات",
        variant: "destructive"
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const filteredUsers = usersWithRoles.filter(u => 
    u.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.profile?.phone?.includes(searchQuery) ||
    u.role.includes(searchQuery.toLowerCase())
  );

  const roleStats = {
    head_manager: usersWithRoles.filter(u => u.role === 'head_manager').length,
    user: usersWithRoles.filter(u => u.role === 'user').length,
    guest: usersWithRoles.filter(u => u.role === 'guest').length,
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">جاري تحميل الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-primary" />
            </div>
            <span>إدارة الصلاحيات</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 flex items-center gap-2">
            <Lock className="h-4 w-4 hidden sm:inline" />
            التحكم في صلاحيات المستخدمين
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Crown className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold">{roleStats.head_manager}</p>
              <p className="text-xs md:text-sm text-muted-foreground">مدير عام</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold">{roleStats.user}</p>
              <p className="text-xs md:text-sm text-muted-foreground">مستخدم</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-gray-500/10 rounded-lg">
              <UserX className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold">{roleStats.guest}</p>
              <p className="text-xs md:text-sm text-muted-foreground">زائر</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-600 dark:text-blue-400">ملاحظات</AlertTitle>
        <AlertDescription className="text-blue-600/80 dark:text-blue-400/80 text-sm">
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>المدير العام لديه صلاحيات كاملة على النظام</li>
            <li>لا يمكنك تغيير صلاحياتك الخاصة</li>
            <li>التغييرات تُطبق فوراً</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                المستخدمون ({filteredUsers.length})
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                قائمة المستخدمين وصلاحياتهم
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا يوجد مستخدمون
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((userWithRole) => {
                    const roleInfo = roleLabels[userWithRole.role] || roleLabels.user;
                    const isCurrentUser = userWithRole.user_id === user?.id;
                    
                    return (
                      <TableRow key={userWithRole.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserCog className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">
                              {userWithRole.profile?.full_name || 'بدون اسم'}
                              {isCurrentUser && (
                                <Badge variant="outline" className="mr-2 text-xs">أنت</Badge>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell dir="ltr" className="text-right font-mono text-sm">
                          {userWithRole.profile?.phone || '-'}
                        </TableCell>
                        <TableCell>{userWithRole.profile?.city || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${roleInfo.color}`}>
                            {roleInfo.icon}
                            {roleInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(userWithRole.created_at).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(userWithRole)}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? "لا يمكنك تعديل صلاحياتك" : "تعديل الصلاحيات"}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-3 p-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا يوجد مستخدمون
                  </div>
                ) : (
                  filteredUsers.map((userWithRole) => {
                    const roleInfo = roleLabels[userWithRole.role] || roleLabels.user;
                    const isCurrentUser = userWithRole.user_id === user?.id;
                    
                    return (
                      <Card key={userWithRole.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserCog className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {userWithRole.profile?.full_name || 'بدون اسم'}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="text-xs">أنت</Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground" dir="ltr">
                                {userWithRole.profile?.phone || '-'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRole(userWithRole)}
                            disabled={isCurrentUser}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <Badge variant="outline" className={`gap-1 ${roleInfo.color}`}>
                            {roleInfo.icon}
                            {roleInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(userWithRole.created_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              تعديل صلاحيات المستخدم
            </DialogTitle>
            <DialogDescription>
              تغيير صلاحيات: {selectedUser?.profile?.full_name || 'المستخدم'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الصلاحية الجديدة</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصلاحية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head_manager">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-600" />
                      مدير عام
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      مستخدم
                    </div>
                  </SelectItem>
                  <SelectItem value="guest">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-gray-600" />
                      زائر
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newRole === 'head_manager' && (
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-600 text-sm">
                  تحذير: المدير العام لديه صلاحيات كاملة على النظام
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={dialogLoading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={dialogLoading || newRole === selectedUser?.role}
            >
              {dialogLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesManagementPage;
