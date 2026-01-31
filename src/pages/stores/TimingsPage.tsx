/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const BranchTimingsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [timings, setTimings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimings([
        { 
          id: '1', 
          branch: 'فرع الرياض', 
          openTime: '08:00', 
          closeTime: '20:00', 
          days: 'من الأحد إلى الخميس', 
          status: 'نشط' 
        },
        { 
          id: '2', 
          branch: 'فرع جدة', 
          openTime: '09:00', 
          closeTime: '21:00', 
          days: 'من الأحد إلى الخميس', 
          status: 'نشط' 
        },
        { 
          id: '3', 
          branch: 'فرع الدمام', 
          openTime: '08:30', 
          closeTime: '19:30', 
          days: 'من الأحد إلى الخميس', 
          status: 'معطل' 
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
            <Clock className="h-7 w-7 text-primary" />
            تحديد الوقت للفروع
          </h1>
          <p className="text-muted-foreground mt-1">إدارة أوقات العمل لكل فرع في النظام</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة جدول زمني جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>جداول أوقات الفروع</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم الفرع..."
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
                  <TableHead>اسم الفرع</TableHead>
                  <TableHead>وقت الافتتاح</TableHead>
                  <TableHead>وقت الإغلاق</TableHead>
                  <TableHead>أيام العمل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timings.map((timing) => (
                  <TableRow key={timing.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{timing.branch}</TableCell>
                    <TableCell className="font-mono font-medium">{timing.openTime}</TableCell>
                    <TableCell className="font-mono font-medium">{timing.closeTime}</TableCell>
                    <TableCell>{timing.days}</TableCell>
                    <TableCell>
                      <Badge variant={timing.status === 'نشط' ? 'default' : 'secondary'}>
                        {timing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">تعديل</Button>
                        <Button variant="outline" size="sm">
                          {timing.status === 'نشط' ? 'تعطيل' : 'تفعيل'}
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

export default BranchTimingsPage;