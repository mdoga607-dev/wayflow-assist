/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Search, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const RolesManagementPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role !== 'head_manager') {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRoles([
        { 
          id: '1', 
          name: 'مدير عام', 
          code: 'head_manager', 
          permissions: ['all'], 
          usersCount: 2,
          status: 'نشط'
        },
        { 
          id: '2', 
          name: 'مدير', 
          code: 'manager', 
          permissions: ['view_all', 'edit_shipments', 'manage_users'], 
          usersCount: 8,
          status: 'نشط'
        },
        { 
          id: '3', 
          name: 'مندوب', 
          code: 'courier', 
          permissions: ['view_own', 'update_status'], 
          usersCount: 45,
          status: 'نشط'
        },
        { 
          id: '4', 
          name: 'تاجر', 
          code: 'shipper', 
          permissions: ['view_own_shipments', 'create_shipments'], 
          usersCount: 120,
          status: 'نشط'
        },
        { 
          id: '5', 
          name: 'ضيف', 
          code: 'guest', 
          permissions: ['view_tracking'], 
          usersCount: 500,
          status: 'نشط'
        },
      ]);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            صلاحيات المستخدمين
          </h1>
          <p className="text-muted-foreground mt-1">إدارة أدوار وصلاحيات المستخدمين في النظام</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء دور جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة الأدوار</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم الدور أو الكود..."
                className="pl-4 pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الدور</TableHead>
                  <TableHead>الكود</TableHead>
                  <TableHead>الصلاحيات</TableHead>
                  <TableHead>عدد المستخدمين</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((roleItem) => (
                  <TableRow key={roleItem.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{roleItem.name}</TableCell>
                    <TableCell className="font-mono font-medium text-primary">{roleItem.code}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roleItem.permissions.map((perm: string, index: number) => (
                          <Badge 
                            key={index} 
                            variant={perm === 'all' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {perm === 'all' ? 'جميع الصلاحيات' : perm.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{roleItem.usersCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={roleItem.status === 'نشط'} 
                        onCheckedChange={() => {}}
                        disabled={roleItem.code === 'head_manager'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">تعديل</Button>
                        <Button variant="outline" size="sm" disabled={roleItem.code === 'head_manager'}>
                          {roleItem.status === 'نشط' ? (
                            <X className="h-3 w-3 mr-1" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {roleItem.status === 'نشط' ? 'تعطيل' : 'تفعيل'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesManagementPage;