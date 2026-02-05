/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/tasks/TasksPage.tsx
import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ListChecks,
  Plus,
  Search,
  Loader2,
  RefreshCcw,
  Eye,
  Edit,
  Trash2,
  User,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  delegate_name?: string;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

const TasksPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لعرض المهام",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب المهام من قاعدة البيانات
  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // جلب المهام مع اسم المندوب المُسنَد إليه
      const {  data:tasksData, error } = await supabase
        .from('tasks')
        .select(`
          *,
          delegate:delegate_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // معالجة البيانات
      const processedTasks = (tasksData || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        assigned_to: task.assigned_to,
        delegate_name: task.delegate?.name || 'غير مُسنَد',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        completed_at: task.completed_at,
        created_at: task.created_at
      }));
      
      setTasks(processedTasks);
      setFilteredTasks(processedTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "فشل التحميل",
        description: error.message || "حدث خطأ أثناء تحميل المهام. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // الجلب الأولي للبيانات
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchTasks();
    }
  }, [authLoading, role]);

  // تطبيق البحث
  useEffect(() => {
    if (!tasks.length) return;
    
    const filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.delegate_name && task.delegate_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredTasks(filtered);
  }, [searchTerm, tasks]);

  // دالة لتحويل الأولوية للعربية
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'منخفضة';
      case 'medium': return 'متوسطة';
      case 'high': return 'عالية';
      case 'urgent': return 'عاجلة';
      default: return priority;
    }
  };

  // دالة لتحديد لون الأولوية
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // دالة لتحويل الحالة للعربية
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'معلقة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  // دالة لتحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // دالة لتحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-600" />;
      case 'in_progress': return <ListChecks className="h-4 w-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // حذف مهمة
  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف المهمة "${taskTitle}"؟`)) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المهمة بنجاح"
      });
      
      // تحديث القائمة
      fetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "فشل الحذف",
        description: error.message || "حدث خطأ أثناء حذف المهمة",
        variant: "destructive"
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المهام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-blue-600" />
            إدارة المهام
          </h1>
          <p className="text-gray-600 mt-1">
            عرض وتتبع المهام الموكلة للموظفين ({tasks.length} مهمة)
          </p>
        </div>
        <Button 
          onClick={() => navigate('/app/tasks/add')}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة مهمة جديدة
        </Button>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>يمكنك تصفية المهام بالبحث في العنوان أو الوصف أو اسم المُسنَد إليه</li>
                <li>المهام العاجلة تظهر باللون الأحمر، والمكتملة باللون الأخضر</li>
                <li>يمكنك تعديل أو حذف أي مهمة بالنقر على الأزرار المخصصة</li>
                <li>التاريخ الموضح هو تاريخ الاستحقاق للمهمة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* البحث والتحديث */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg text-gray-800">قائمة المهام</CardTitle>
            <div className="flex flex-wrap gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث باسم المهمة أو الوصف أو المُسنَد إليه..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={fetchTasks}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                تحديث القائمة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ListChecks className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">لا توجد مهام</p>
              <p className="max-w-md mx-auto">
                {searchTerm 
                  ? "لم يتم العثور على مهام مطابقة لمعايير البحث" 
                  : "لا توجد مهام حالياً. يمكنك إضافة مهمة جديدة بالنقر على الزر أعلاه"}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => navigate('/app/tasks/add')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مهمة جديدة
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-right font-medium text-gray-700 w-48">عنوان المهمة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700">الوصف</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">المُسنَد إليه</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الأولوية</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-28">الحالة</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">تاريخ الاستحقاق</TableHead>
                    <TableHead className="text-right font-medium text-gray-700 w-32">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow 
                      key={task.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {task.title}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600">
                        {task.description || '-'}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800 flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span>{task.delegate_name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {getStatusLabel(task.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-gray-700">
                        {task.due_date 
                          ? format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ar })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/tasks/${task.id}`)}
                            className="h-8 hover:bg-blue-50 text-blue-700"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/app/tasks/edit/${task.id}`)}
                            className="h-8 hover:bg-yellow-50 text-yellow-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id, task.title)}
                            className="h-8 hover:bg-red-50 text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t mt-4 gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">إجمالي المهام:</span> {filteredTasks.length} مهمة
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                معلقة: {filteredTasks.filter(t => t.status === 'pending').length}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800">
                قيد التنفيذ: {filteredTasks.filter(t => t.status === 'in_progress').length}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                مكتملة: {filteredTasks.filter(t => t.status === 'completed').length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المهام المعلقة</p>
                <p className="text-2xl font-bold mt-1 text-gray-800">
                  {tasks.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">قيد التنفيذ</p>
                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <ListChecks className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المكتملة</p>
                <p className="text-2xl font-bold mt-1 text-green-700">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">العاجلة</p>
                <p className="text-2xl font-bold mt-1 text-red-700">
                  {tasks.filter(t => t.priority === 'urgent').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TasksPage;