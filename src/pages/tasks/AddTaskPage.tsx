import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const AddTaskPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      toast({ title: "تم إنشاء المهمة بنجاح", description: "تم تعيين المهمة للموظف المحدد" });
      navigate('/app/tasks');
      setLoading(false);
    }, 1500);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListChecks className="h-7 w-7 text-primary" />
            إضافة مهمة جديدة
          </h1>
          <p className="text-muted-foreground mt-1">أنشئ مهمة جديدة وعيّنها لموظف</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>بيانات المهمة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان المهمة *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: مراجعة الشحنات المتأخرة"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف المهمة</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="اكتب وصفاً تفصيلياً للمهمة..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">تعيين المهمة لـ *</Label>
              <Select 
                value={formData.assignee} 
                onValueChange={(value) => setFormData({ ...formData, assignee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ahmed">أحمد محمد</SelectItem>
                  <SelectItem value="khalid">خالد عبدالله</SelectItem>
                  <SelectItem value="mohammed">محمد سعيد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">تاريخ الاستحقاق *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">الأولوية *</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                إلغاء
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  "إنشاء المهمة"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTaskPage;