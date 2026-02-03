/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/AdminUsersPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, AlertCircle, RefreshCcw } from 'lucide-react';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق من الصلاحيات (يظهر فقط لـ head_manager)
    if (!authLoading && role !== 'head_manager') {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // جلب المستخدمين مع رتبهم
        const { data: usersData, error } = await supabase
          .from('user_roles')
          .select(`
            *,
            user:user_id (
              email,
              created_at
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // تنظيم البيانات
        const organizedUsers = usersData?.map(ur => ({
          id: ur.user_id,
          email: ur.user?.email || 'غير معروف',
          role: ur.role,
          created_at: ur.user?.created_at || ur.created_at
        })) || [];
        
        setUsers(organizedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        alert('فشل تحميل قائمة المستخدمين. تأكد من وجود جدول user_roles في قاعدة البيانات.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري تحميل قائمة المستخدمين...</p>
        </div>
      </div>
    );
  }

  // ترجمة الرتب
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'head_manager': 'مدير عام',
      'manager': 'مدير فرع',
      'courier': 'مندوب',
      'shipper': 'تاجر',
      'user': 'مستخدم',
      'guest': 'ضيف'
    };
    return roles[role] || role;
  };

  // ألوان الرتب
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'head_manager': 'bg-[#1a7061] text-white',
      'manager': 'bg-[#317896] text-white',
      'courier': 'bg-[#d24b60] text-white',
      'shipper': 'bg-[#6a5acd] text-white',
      'user': 'bg-gray-500 text-white',
      'guest': 'bg-gray-400 text-white'
    };
    return colors[role] || 'bg-gray-500 text-white';
  };

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وتعديل صلاحيات جميع المستخدمين في النظام
          </p>
        </div>
        <Badge className="bg-[#1a7061] text-white text-lg px-4 py-2 shadow-lg">
          <Shield className="h-4 w-4 inline-block ml-1" />
          مدير عام فقط
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            قائمة المستخدمين ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-xl font-medium text-muted-foreground mb-2">
                لا توجد مستخدمين في النظام
              </p>
              <p className="text-muted-foreground max-w-md mx-auto">
                سيتم عرض جميع المستخدمين المسجلين في النظام هنا مع رتبهم وصلاحياتهم
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الرتبة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" disabled>
                          تعديل الصلاحيات
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">صلاحيات الصفحة</p>
              <p className="text-sm text-muted-foreground mt-1">
                هذه الصفحة تظهر فقط للمدير العام (head_manager) لضمان أمان النظام
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">تعديل الصلاحيات</p>
              <p className="text-sm text-muted-foreground mt-1">
                ميزة تعديل صلاحيات المستخدمين قيد التطوير وستكون متاحة قريباً
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">إضافة مستخدمين جدد</p>
              <p className="text-sm text-muted-foreground mt-1">
                يمكن إضافة مستخدمين جدد عبر صفحة التسجيل أو عبر لوحة تحكم Supabase مباشرة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPage;