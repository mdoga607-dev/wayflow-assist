import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const AddCampaignPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'marketing',
    message: '',
    recipients: '',
    scheduleDate: '',
  });

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // محاكاة الإرسال
    setTimeout(() => {
      toast({ title: "تم إنشاء الحملة بنجاح", description: "سيتم إرسال الرسائل وفقاً للجدول المحدد" });
      navigate('/app/whatsapp/campaigns');
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
            <MessageCircle className="h-7 w-7 text-primary" />
            إضافة حملة واتساب جديدة
          </h1>
          <p className="text-muted-foreground mt-1">أنشئ حملة تسويقية أو تذكيرية عبر الواتساب</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>بيانات الحملة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الحملة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: عرض خاص يناير"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">نوع الحملة *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الحملة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">تسويق</SelectItem>
                  <SelectItem value="reminder">تذكير</SelectItem>
                  <SelectItem value="notification">إشعارات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">نص الرسالة *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="اكتب نص الرسالة التي سيتم إرسالها..."
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                💡 يمكنك استخدام المتغيرات: {`{name}`} لاسم العميل، {`{order}`} لرقم الطلب
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">قائمة المستلمين (أرقام مفصولة بفواصل) *</Label>
              <Textarea
                id="recipients"
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                placeholder="966500000000, 966511111111, 966522222222"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleDate">تاريخ الجدولة (اختياري)</Label>
              <Input
                id="scheduleDate"
                type="datetime-local"
                value={formData.scheduleDate}
                onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                ⏰ إذا تركت فارغاً، سيتم الإرسال فوراً
              </p>
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
                  "إنشاء الحملة"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCampaignPage;