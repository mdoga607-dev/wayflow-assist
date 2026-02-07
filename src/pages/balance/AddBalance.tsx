// src/pages/balance/AddBalance.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BalanceForm } from '@/components/balance/BalanceForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Calendar, 
  Tag, 
  User, 
  Truck, 
  Package, 
  TrendingUp,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const AddBalance = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
    
    // محاكاة تحميل لتحسين تجربة المستخدم
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [authLoading, role, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/30 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white rounded-2xl shadow-xl border border-blue-100"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute inset-2 border-4 border-blue-200 rounded-full animate-spin-reverse border-b-transparent"></div>
            <DollarSign className="absolute inset-0 w-10 h-10 m-auto text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري إعداد نموذج الإضافة...</h2>
          <p className="text-gray-600">يرجى الانتظار لحظات</p>
          <div className="mt-6 w-48 h-1 bg-blue-100 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '35%' }}></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/30 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* شريط التقدم الزخرفي */}
        <div className="w-full h-1.5 bg-gradient-to-r from-primary to-blue-400 rounded-full mb-8 shadow-lg"></div>
        
        {/* رأس الصفحة - تصميم احترافي */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-2xl mb-6 border-4 border-white">
            <DollarSign className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-primary mb-4">
            إضافة عملية مالية
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            أضف عملية مالية جديدة (دفع، تحصيل، مصروف، إلخ) إلى النظام بسهولة وأمان
          </p>
          
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => navigate('/app/balance')}
              variant="outline"
              size="lg"
              className="gap-2 h-12 px-8 text-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-5 w-5" />
              العودة إلى الحسابات
            </Button>
          </div>
        </motion.div>

        {/* نموذج إضافة العملية المالية - داخل بطاقة مزخرفة */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-7 border-b-0">
              <div className="flex items-center justify-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <CardTitle className="text-2xl font-bold">نموذج إضافة عملية مالية</CardTitle>
                  <CardDescription className="text-blue-100 mt-1 text-lg font-medium">
                    يرجى ملء جميع الحقول المطلوبة بدقة
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-7">
              <BalanceForm 
                onSuccess={() => {
                  navigate('/app/balance');
                }} 
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* ملاحظات هامة - تصميم جذاب */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10"
        >
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50/30 overflow-hidden shadow-xl">
            <CardHeader className="pb-4 bg-blue-50/70 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Info className="h-6 w-6 text-blue-700" />
                </div>
                <CardTitle className="text-xl text-gray-800">ملاحظات هامة قبل الإضافة</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <NoteItem 
                  icon={<Tag className="h-5 w-5 text-green-600" />}
                  title="المبلغ المطلوب"
                  description="يجب أن يكون رقماً موجباً (يمكن إدخال أرقام عشرية)"
                  color="bg-green-50 border-green-200 text-green-800"
                />
                <NoteItem 
                  icon={<FileText className="h-5 w-5 text-blue-600" />}
                  title="نوع العملية"
                  description="حقل مطلوب، بينما باقي الحقول اختيارية"
                  color="bg-blue-50 border-blue-200 text-blue-800"
                />
                <NoteItem 
                  icon={<User className="h-5 w-5 text-purple-600" />}
                  title="ربط العملية"
                  description="يمكن ربط العملية بتاجر أو مندوب أو فرع واحد فقط (أو بدون أي منهم)"
                  color="bg-purple-50 border-purple-200 text-purple-800"
                />
                <NoteItem 
                  icon={<Calendar className="h-5 w-5 text-amber-600" />}
                  title="التاريخ"
                  description="التاريخ الافتراضي هو اليوم الحالي، ويمكن تعديله"
                  color="bg-amber-50 border-amber-200 text-amber-800"
                />
                <NoteItem 
                  icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
                  title="المراجعة"
                  description="جميع العمليات تخضع لمراجعة المدير العام قبل التنفيذ"
                  color="bg-emerald-50 border-emerald-200 text-emerald-800"
                />
                <NoteItem 
                  icon={<AlertCircle className="h-5 w-5 text-red-600" />}
                  title="التأكد من البيانات"
                  description="تأكد من صحة البيانات قبل الحفظ لتجنب الأخطاء المالية"
                  color="bg-red-50 border-red-200 text-red-800"
                />
              </div>
              
              <div className="mt-6 p-5 bg-white rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg text-gray-800 mb-2">نصيحة هامة:</h4>
                    <p className="text-gray-700 leading-relaxed">
                      يُنصح بكتابة ملاحظات واضحة لكل عملية مالية لتسهيل المراجعة والتحليل المالي لاحقاً. 
                      الملاحظات الواضحة تساعد في فهم طبيعة العملية وتسريع عملية الموافقة عليها.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* نصائح إضافية */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 md:p-8 text-white text-center shadow-2xl">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Truck className="h-8 w-8" />
              <Package className="h-8 w-8" />
              <DollarSign className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3">لضمان أفضل النتائج</h3>
            <p className="text-lg max-w-3xl mx-auto opacity-95 leading-relaxed">
              استخدم أسماء واضحة للعمليات المالية، وتأكد من اختيار النوع الصحيح (تحصيل، دفع، مصروف، إلخ)، 
              واربط العملية بالجهة الصحيحة (تاجر، مندوب، فرع) لتسهيل التقارير المالية لاحقاً.
            </p>
            <Button 
              onClick={() => navigate('/app/balance')}
              variant="secondary"
              size="lg"
              className="mt-6 bg-white text-indigo-700 hover:bg-gray-100 font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <ArrowLeft className="h-5 w-5 ml-2" />
              العودة إلى صفحة الحسابات
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// مكون العنصر الواحد في الملاحظات
const NoteItem = ({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) => (
  <div className={cn(
    "p-4 rounded-xl border flex items-start gap-3 transition-all hover:shadow-md",
    color
  )}>
    <div className="mt-1 flex-shrink-0">{icon}</div>
    <div>
      <h4 className="font-bold text-gray-800 mb-1">{title}</h4>
      <p className="text-sm text-gray-700">{description}</p>
    </div>
  </div>
);

export default AddBalance;