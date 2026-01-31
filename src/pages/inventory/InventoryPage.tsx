/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Plus, Search, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const InventoryPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInventory([
        { 
          id: '1', 
          date: '2026-01-29', 
          branch: 'فرع الرياض', 
          itemsCount: 1250, 
          discrepancy: 3, 
          status: 'مكتمل', 
          performedBy: 'أحمد محمد' 
        },
        { 
          id: '2', 
          date: '2026-01-28', 
          branch: 'فرع جدة', 
          itemsCount: 980, 
          discrepancy: 12, 
          status: 'مكتمل', 
          performedBy: 'خالد عبدالله' 
        },
        { 
          id: '3', 
          date: '2026-01-27', 
          branch: 'فرع الدمام', 
          itemsCount: 750, 
          discrepancy: 0, 
          status: 'مكتمل', 
          performedBy: 'محمد سعيد' 
        },
        { 
          id: '4', 
          date: '2026-01-30', 
          branch: 'فرع الرياض', 
          itemsCount: 0, 
          discrepancy: 0, 
          status: 'مجدول', 
          performedBy: 'أحمد محمد' 
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
            <Database className="h-7 w-7 text-primary" />
            عمليات جرد الشحنات
          </h1>
          <p className="text-muted-foreground mt-1">إدارة وتسجيل عمليات الجرد الدورية للشحنات في الفروع</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          بدء جرد جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>سجل عمليات الجرد</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بتاريخ أو الفرع..."
                  className="pl-4 pr-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاريخ الجرد</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>عدد الشحنات</TableHead>
                  <TableHead>الاختلاف</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>أجرى العملية</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono">{item.date}</TableCell>
                    <TableCell className="font-medium">{item.branch}</TableCell>
                    <TableCell className="font-medium">{item.itemsCount.toLocaleString()}</TableCell>
                    <TableCell className={item.discrepancy > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'مكتمل' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.performedBy}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">عرض التفاصيل</Button>
                        {item.status === 'مجدول' && (
                          <Button variant="outline" size="sm">بدء الجرد</Button>
                        )}
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

export default InventoryPage;