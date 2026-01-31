/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TasksPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTasks([
        { id: '1', title: 'مراجعة الشحنات المتأخرة', assignee: 'أحمد محمد', dueDate: '2026-01-30', priority: 'عالي', status: 'قيد التنفيذ' },
        { id: '2', title: 'الرد على شكاوى العملاء', assignee: 'خالد عبدالله', dueDate: '2026-01-29', priority: 'متوسط', status: 'مكتملة' },
        { id: '3', title: 'تحديث بيانات التجار', assignee: 'محمد سعيد', dueDate: '2026-02-01', priority: 'منخفض', status: 'معلقة' },
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
            <ListChecks className="h-7 w-7 text-primary" />
            إدارة المهام
          </h1>
          <p className="text-muted-foreground mt-1">عرض وتتبع المهام الموكلة للموظفين</p>
        </div>
        <Button onClick={() => navigate('/app/tasks/add')}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مهمة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة المهام</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم المهمة أو الموكل..."
                className="pl-4 pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عنوان المهمة</TableHead>
                <TableHead>الموكل</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>{task.dueDate}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'عالي' 
                        ? 'bg-red-100 text-red-800' 
                        : task.priority === 'متوسط'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'مكتملة' 
                        ? 'bg-green-100 text-green-800' 
                        : task.status === 'قيد التنفيذ'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">تعديل</Button>
                      <Button variant="outline" size="sm">تفاصيل</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksPage;