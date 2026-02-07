/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/tasks/AddTaskPage.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ListChecks, 
  X, 
  Loader2, 
  AlertCircle,
  User,
  Calendar,
  Flag,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface Delegate {
  id: string;
  name: string;
}

const AddTaskPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    delegate_id: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  // 1. التحقق من الصلاحيات فور تحميل الصفحة
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager', 'admin'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإضافة مهام",
        variant: "destructive"
      });
      navigate('/app');
    }
  }, [authLoading, role, navigate]);

  // 2. جلب المناديب (تعديل: الجلب من جدول profiles لضمان الدقة)
  useEffect(() => {
    const fetchDelegates = async () => {
      if (authLoading || !role) return;
      
      try {
        setDataLoading(true);
        // جلب المناديب من جدول delegates
        const { data, error } = await supabase
          .from('delegates')
          .select('id, name')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        
        setDelegates(data?.map(d => ({ 
          id: d.id, 
          name: d.name || 'بدون اسم' 
        })) || []);
      } catch (error: any) {
        console.error('Error fetching delegates:', error);
        toast({
          title: "فشل التحميل",
          description: "تعذر جلب قائمة المناديب",
          variant: "destructive"
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchDelegates();
  }, [authLoading, role]);

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({ title: "خطأ", description: "عنوان المهمة مطلوب", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          delegate_id: formData.delegate_id || null,
          due_date: formData.dueDate || null,
          priority: formData.priority,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({ title: "تم بنجاح", description: "تم إنشاء المهمة وتعيينها" });
      navigate('/app/tasks');
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "فشل الإنشاء",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.title.trim() && !confirm('هل تريد إلغاء التغييرات؟')) return;
    navigate('/app/tasks');
  };

  // الحالة الوحيدة للتحميل
  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-blue-600" />
            إضافة مهمة جديدة
          </h1>
          <p className="text-gray-600 mt-1">أنشئ مهمة جديدة وعيّنها لمندوب لتنظيم العمل</p>
        </div>
        <Button variant="outline" onClick={handleCancel} className="gap-2 border-gray-300">
          <X className="h-4 w-4" /> إلغاء
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">بيانات المهمة</CardTitle>
          <CardDescription>يرجى تعبئة الحقول المطلوبة لإنشاء المهمة</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* العنوان */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-1">
                <Flag className="h-4 w-4 text-gray-600" /> عنوان المهمة *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: مراجعة المرتجعات"
                required
              />
            </div>

            {/* الوصف */}
            <div className="space-y-2">
              <Label htmlFor="description">وصف المهمة</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="اكتب تفاصيل المهمة هنا..."
                rows={4}
              />
            </div>

            {/* المندوب */}
            <div className="space-y-2">
              <Label>تعيين لمندوب</Label>
              <Select 
                value={formData.delegate_id} 
                onValueChange={(val) => setFormData({ ...formData, delegate_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المندوب (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تعيين حالياً</SelectItem>
                  {delegates.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* التاريخ والأولوية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v: any) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">عاجل جداً</SelectItem>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>إلغاء</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء المهمة"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTaskPage;