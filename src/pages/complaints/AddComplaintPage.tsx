/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/complaints/AddComplaintPage.tsx
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
  AlertTriangle, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Users,
  Package,
  Clock,
  TrendingUp
} from 'lucide-react';

// تعريف مكون الشاحنة كدالة إعلان (يتم رفعها تلقائياً)
function Truck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
      />
    </svg>
  );
}

const AddComplaintPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [formData, setFormData] = useState({
    type: 'شكوى عميل' as 'شكوى عميل' | 'شكوى تاجر' | 'شكوى مندوب',
    customer_name: '',
    customer_type: 'عميل' as 'عميل' | 'تاجر' | 'مندوب',
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assigned_to: ''
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك الصلاحية لإضافة شكاوى جديدة",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب المستخدمين للتعيين
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        
        // جلب المستخدمين المديرين والموظفين
        const { data: usersData, error } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            user:user_id (name),
            role
          `)
          .in('role', ['head_manager', 'manager', 'support'])
          .order('role');

        if (error) {
          console.error('Database error:', error);
          throw error;
        }
        
        if (!usersData) {
          setUsers([]);
          return;
        }
        
        // معالجة البيانات
        const processedUsers = usersData
          .filter((u: any) => u.user?.name) // تصفية المستخدمين بدون اسم
          .map((u: any) => ({
            id: u.user_id,
            name: u.user.name,
            role: u.role
          }));
        
        // إزالة التكرارات
        const uniqueUsers = Array.from(
          new Map(processedUsers.map((u: any) => [u.id, u])).values()
        );
        
        setUsers(uniqueUsers);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast({
          title: "تنبيه",
          description: "لم يتم تحميل قائمة الموظفين. سيتم التعيين التلقائي.",
          variant: "default"
        });
        setUsers([]); // تعيين مصفوفة فارغة لتجنب الأخطاء
      } finally {
        setLoadingUsers(false);
      }
    };

    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchUsers();
    }
  }, [authLoading, role]);

  // تحديث نوع العميل تلقائياً عند تغيير نوع الشكوى
  useEffect(() => {
    if (formData.type === 'شكوى عميل') {
      setFormData(prev => ({ ...prev, customer_type: 'عميل' }));
    } else if (formData.type === 'شكوى تاجر') {
      setFormData(prev => ({ ...prev, customer_type: 'تاجر' }));
    } else if (formData.type === 'شكوى مندوب') {
      setFormData(prev => ({ ...prev, customer_type: 'مندوب' }));
    }
  }, [formData.type]);

  // التحقق من صحة النموذج
  const validateForm = () => {
    if (!formData.customer_name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم العميل/التاجر/المندوب",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.customer_name.length < 2) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم العميل يجب أن يكون على الأقل حرفين",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.subject.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال موضوع الشكوى",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.subject.length < 5) {
      toast({
        title: "خطأ في البيانات",
        description: "موضوع الشكوى يجب أن يكون على الأقل 5 أحرف",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال وصف تفصيلي للشكوى",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.description.length < 10) {
      toast({
        title: "خطأ في البيانات",
        description: "وصف الشكوى يجب أن يكون على الأقل 10 أحرف",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // معالجة الإرسال
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('complaints')
        .insert([{
          type: formData.type,
          customer_name: formData.customer_name.trim(),
          customer_type: formData.customer_type,
          subject: formData.subject.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          status: 'جديدة',
          assigned_to: formData.assigned_to || null,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة شكوى جديدة بنجاح. سيتم مراجعتها قريباً."
      });
      
      // الانتقال إلى صفحة الشكاوى بعد ثانيتين
      setTimeout(() => {
        navigate('/app/complaints');
      }, 2000);
    } catch (error: any) {
      console.error('Error adding complaint:', error);
      
      let message = "حدث خطأ أثناء إضافة الشكوى. يرجى المحاولة مرة أخرى.";
      
      if (error.code === '23505') {
        message = "توجد شكوى بنفس الرقم. يرجى المحاولة مرة أخرى.";
      } else if (error.code === '23503') {
        message = "بيانات غير صحيحة. يرجى التحقق من صحة البيانات المدخلة.";
      } else if (error.message) {
        message = error.message;
      }
      
      toast({
        title: "فشل الإضافة",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // معالجة الأخطاء غير المتوقعة
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل قائمة الموظفين...</p>
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
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            إضافة شكوى جديدة
          </h1>
          <p className="text-gray-600 mt-1">
            أدخل تفاصيل الشكوى الجديدة ليتم مراجعتها وحلها من قبل الفريق المختص
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/complaints')}
          className="gap-2 border-gray-300 hover:bg-gray-50"
        >
          <X className="h-4 w-4" />
          إلغاء
        </Button>
      </div>

      {/* ملاحظات هامة */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 bg-orange-50 p-3 rounded-lg">
            <Info className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">ملاحظات هامة قبل الإضافة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>تأكد من إدخال وصف تفصيلي للشكوى لتسهيل عملية الحل</li>
                <li>الشكاوى عالية الأولوية سيتم مراجعتها خلال ساعة واحدة</li>
                <li>يمكنك تعيين الشكوى لموظف محدد أو تركها بدون تعيين لتوزيعها تلقائياً</li>
                <li>بعد الإضافة، ستظهر الشكوى في قائمة الشكاوى النشطة فوراً</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نموذج الإضافة */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-gray-700" />
              تفاصيل الشكوى
            </CardTitle>
            <CardDescription>
              أدخل جميع المعلومات المطلوبة لضمان معالجة الشكوى بشكل صحيح
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* نوع الشكوى واسم العميل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-gray-800 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-gray-600" />
                    نوع الشكوى <span className="text-red-600">*</span>
                  </Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
                      <SelectValue placeholder="اختر نوع الشكوى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="شكوى عميل">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          شكوى عميل
                        </div>
                      </SelectItem>
                      <SelectItem value="شكوى تاجر">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-600" />
                          شكوى تاجر
                        </div>
                      </SelectItem>
                      <SelectItem value="شكوى مندوب">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-green-600" />
                          شكوى مندوب
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    حدد نوع الجهة صاحبة الشكوى
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customer_name" className="text-gray-800 flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-600" />
                    اسم العميل/التاجر/المندوب <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="مثال: أحمد محمد، شركة النور"
                    required
                    className="bg-white border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    الاسم الكامل للشخص أو الشركة صاحبة الشكوى
                  </p>
                </div>
              </div>

              {/* الموضوع والوصف */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-gray-800 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  موضوع الشكوى <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="مثال: تأخر في التوصيل، مشكلة في الدفع، منتج تالف"
                  required
                  className="bg-white border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  maxLength={150}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ملخص مختصر لموضوع الشكوى (150 حرفاً كحد أقصى)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-800 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  وصف تفصيلي للشكوى <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="يرجى وصف المشكلة بشكل مفصل بما في ذلك أي معلومات إضافية قد تساعد في حلها مثل أرقام الطلبات، التواريخ، إلخ..."
                  required
                  className="bg-white border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
                  rows={6}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <span>وصف مفصل يساعد في حل المشكلة быстрее</span>
                  <span className={formData.description.length > 900 ? 'text-red-600 font-medium' : ''}>
                    {formData.description.length}/1000
                  </span>
                </div>
              </div>

              {/* الأولوية والتعيين */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-gray-800">
                    أولوية الشكوى
                  </Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
                      <SelectValue placeholder="اختر الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          عاجل - يتطلب حل فوري
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          متوسط - يجب الحل خلال 24 ساعة
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          منخفض - يمكن الحل خلال 48 ساعة
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    حدد مدى إلحاحية الشكوى
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assigned_to" className="text-gray-800">
                    تعيين إلى (اختياري)
                  </Label>
                  <Select 
                    value={formData.assigned_to} 
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
                      <SelectValue placeholder="تعيين تلقائي (موصى به)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">تعيين تلقائي (موصى به)</SelectItem>
                      {users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3 text-blue-600" />
                              <span>{user.name}</span>
                              <span className="text-xs text-gray-500">
                                ({user.role === 'head_manager' ? 'مدير عام' : 
                                  user.role === 'manager' ? 'مدير' : 'دعم فني'})
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>لا توجد موظفين متاحين</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    يمكنك تركها فارغة للتعيين التلقائي أو اختيار موظف محدد
                  </p>
                </div>
              </div>

              {/* أزرار الإرسال */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/app/complaints')}
                  disabled={loading}
                  className="border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      إضافة الشكوى
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* معلومات إرشادية */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-700" />
              معلومات إرشادية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-start gap-2 text-orange-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">أمثلة على الشكاوى:</p>
                  <ul className="text-xs mt-1 space-y-0.5 pr-4 list-disc">
                    <li><span className="font-medium">شكوى عميل:</span> تأخر التوصيل، منتج تالف، خدمة سيئة</li>
                    <li><span className="font-medium">شكوى تاجر:</span> مشكلة في الدفع، تأخير متكرر، خطأ في الفواتير</li>
                    <li><span className="font-medium">شكوى مندوب:</span> عدم توفر شحنات، مشكلة في التطبيق، تأخير في صرف المستحقات</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">الشكاوى العاجلة</span>
                </div>
                <span className="text-sm font-bold text-red-900">خلال ساعة</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">أولوية متوسطة</span>
                </div>
                <span className="text-sm font-bold text-yellow-900">خلال 24 ساعة</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">معدل الحل الناجح</span>
                </div>
                <span className="text-sm font-bold text-green-900">98%</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-xs text-gray-700 font-medium mb-2">نصائح هامة:</p>
              <ul className="text-xs text-gray-600 space-y-1 pr-3">
                <li>• كن دقيقاً في وصف المشكلة لتسريع الحل</li>
                <li>• أرفق أي معلومات إضافية مثل أرقام الطلبات أو التواريخ</li>
                <li>• حدد الأولوية المناسبة لتجنب إهدار الموارد</li>
                <li>• راقب حالة الشكوى من صفحة "الشكاوى النشطة"</li>
              </ul>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2 text-blue-800">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  <span className="font-medium">ملاحظة:</span> جميع الشكاوى تُراجع من قبل الفريق المختص وتُحل وفقاً لأولويتها. يمكنك متابعة حالة الشكوى من خلال النظام.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* خطوات بعد الإضافة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Info className="h-5 w-5 text-gray-700" />
            ماذا يحدث بعد إضافة الشكوى؟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">مراجعة فورية</p>
              <p className="text-sm text-gray-600 mt-1">
                سيتم مراجعة الشكوى فوراً من قبل الفريق المختص وتصنيفها حسب الأولوية
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">التعيين التلقائي</p>
              <p className="text-sm text-gray-600 mt-1">
                إذا لم تقم بتعيين الشكوى لموظف محدد، سيتم توزيعها تلقائياً على الموظف المناسب
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">المتابعة والحل</p>
              <p className="text-sm text-gray-600 mt-1">
                يمكنك متابعة حالة الشكوى من صفحة "الشكاوى النشطة" وسيتم إعلامك عند الحل
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <p className="font-medium text-gray-800">إغلاق الشكوى</p>
              <p className="text-sm text-gray-600 mt-1">
                بعد حل الشكوى، سيتم نقلها تلقائياً إلى "الأرشيف" ويمكنك الاطلاع عليها في أي وقت
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddComplaintPage;