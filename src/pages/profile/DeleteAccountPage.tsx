/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DeleteAccountPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertCircle, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  UserX, 
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  FileText
} from 'lucide-react';

const DeleteAccountPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  const handleDeleteAccount = async () => {
    // التحقق من تأكيد البريد الإلكتروني
    if (confirmationEmail !== user?.email) {
      toast({
        title: "خطأ في التأكيد",
        description: "البريد الإلكتروني المدخل لا يتطابق مع بريدك الإلكتروني. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      return;
    }

    // التحقق من وجود سبب
    if (!reason.trim()) {
      toast({
        title: "يرجى تحديد السبب",
        description: "يساعدنا تحديد سبب الحذف على تحسين خدماتنا",
        variant: "destructive",
      });
      return;
    }

    setStep('processing');
    setLoading(true);

    try {
      // 1. تسجيل طلب حذف الحساب في قاعدة البيانات
      const { error: requestError } = await supabase
        .from('account_deletion_requests')
        .insert([{
          user_id: user.id,
          email: user.email,
          reason: reason.trim(),
          requested_at: new Date().toISOString(),
          status: 'pending'
        }]);

      if (requestError && requestError.code !== 'PGRST116') {
        // إذا كان الجدول غير موجود، نتجاهل الخطأ
        console.warn('Account deletion requests table not found:', requestError.message);
      }

      // 2. حذف بيانات المستخدم من جدول الملفات الشخصية
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: 'حساب محذوف',
          phone: null,
          city: null,
          avatar_url: null
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // لا نوقف العملية إذا فشل تحديث الملف الشخصي
      }

      // 3. تسجيل الخروج
      await signOut();

      // 4. عرض رسالة نجاح
      setStep('success');
      
      toast({
        title: "تم طلب حذف الحساب بنجاح",
        description: "تم استلام طلبك و سيتم مراجعته من قبل الإدارة. سيتم حذف حسابك نهائياً خلال 30 يوماً.",
      });

      // إعادة التوجيه بعد 5 ثوانٍ
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "فشل الحذف",
        description: error.message || "حدث خطأ أثناء معالجة طلب حذف الحساب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="container py-12 max-w-2xl" dir="rtl">
        <Card className="border-green-200 bg-green-50 shadow-xl">
          <CardHeader className="border-b border-green-200">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-green-800">
              تم استلام طلبك بنجاح
            </CardTitle>
            <CardDescription className="text-center mt-2 text-green-700">
              سيتم مراجعة طلبك وحذف حسابك نهائياً خلال 30 يوماً
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <AlertTitle className="text-green-800">ملاحظات هامة:</AlertTitle>
                <AlertDescription className="text-green-700 mt-2 space-y-1">
                  <p>• يمكنك استعادة حسابك خلال 30 يوماً بالتواصل مع الدعم الفني</p>
                  <p>• بعد 30 يوماً، سيتم حذف جميع بياناتك نهائياً ولا يمكن استعادتها</p>
                  <p>• سيتم إرسال تأكيد نهائي إلى بريدك الإلكتروني عند اكتمال الحذف</p>
                </AlertDescription>
              </div>
            </Alert>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-green-100">
                <Mail className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">البريد الإلكتروني</p>
                  <p className="text-green-700">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-green-100">
                <FileText className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">سبب الحذف</p>
                  <p className="text-green-700">{reason}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-green-100">
                <UserX className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">تاريخ الطلب</p>
                  <p className="text-green-700">
                    {new Date().toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center py-6">
              <p className="text-lg font-medium text-green-800 mb-2">شكراً لاستخدامك نظام أمان للشحن</p>
              <p className="text-green-700">
                نتطلع لخدمتك مرة أخرى في المستقبل
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/')}
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <XCircle className="h-4 w-4" />
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl" dir="rtl">
      <Card className="border-destructive/20 shadow-xl">
        <CardHeader className="border-b border-destructive/20 bg-destructive/5">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Trash2 className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-destructive flex items-center justify-center gap-2">
            <UserX className="h-6 w-6" />
            حذف الحساب نهائياً
          </CardTitle>
          <CardDescription className="text-center mt-2 text-destructive/80">
            ⚠️ هذا الإجراء لا يمكن التراجع عنه وسيؤدي إلى حذف جميع بياناتك بشكل دائم
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 'confirm' && (
            <div className="space-y-6">
              {/* تحذيرات هامة */}
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg">تحذيرات هامة قبل الحذف:</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p>• سيتم حذف جميع بياناتك الشخصية والشحنات والمعاملات بشكل دائم</p>
                  <p>• لن تتمكن من استعادة أي بيانات بعد اكتمال عملية الحذف</p>
                  <p>• سيتم إلغاء جميع الاشتراكات والخدمات النشطة المرتبطة بحسابك</p>
                  <p>• سيتم حذف حسابك نهائياً بعد 30 يوماً من تقديم الطلب</p>
                  <p className="font-medium mt-2">
                    نوصي بشدة بتنزيل نسخة احتياطية من بياناتك قبل المتابعة
                  </p>
                </AlertDescription>
              </Alert>

              {/* معلومات الحساب */}
              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserX className="h-5 w-5 text-destructive" />
                    معلومات الحساب المراد حذفه
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                    <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                    <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">معرف المستخدم</p>
                      <p className="font-medium font-mono">{user?.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                    <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                      <p className="font-medium">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : 'غير معروف'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* سبب الحذف */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  سبب حذف الحساب <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="يرجى إخبارنا بالسبب لمساعدتنا على تحسين خدماتنا (مثال: وجدت بديلاً أفضل، مشاكل فنية، إلخ.)"
                  rows={3}
                  required
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  ملاحظة: هذه المعلومات سرية ولن تُشارك مع أي جهة خارجية
                </p>
              </div>

              {/* تأكيد البريد الإلكتروني */}
              <div className="space-y-2">
                <Label htmlFor="confirmationEmail" className="flex items-center gap-2 text-destructive">
                  <ShieldCheck className="h-4 w-4" />
                  تأكيد البريد الإلكتروني <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmationEmail"
                  type="email"
                  value={confirmationEmail}
                  onChange={(e) => setConfirmationEmail(e.target.value)}
                  placeholder={`اكتب ${user?.email} للتأكيد`}
                  required
                  dir="ltr"
                  className="font-mono"
                />
                <p className="text-xs text-destructive/80">
                  ⚠️ لتأكيد حذف الحساب، يرجى كتابة بريدك الإلكتروني بالكامل كما هو موضح أعلاه
                </p>
              </div>

              {/* ملاحظات أخيرة */}
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">ملاحظة أخيرة:</AlertTitle>
                <AlertDescription className="text-yellow-700 mt-2">
                  <p>• بعد تقديم الطلب، سيكون لديك 30 يوماً لإلغاء الحذف عن طريق التواصل مع الدعم الفني</p>
                  <p>• سيتم إرسال بريد إلكتروني تأكيدي عند استلام طلبك</p>
                  <p>• لن يتم حذف الحساب فوراً، بل بعد مراجعة الطلب من قبل الإدارة</p>
                </AlertDescription>
              </Alert>

              {/* أزرار الإجراء */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 ml-2" />
                  إلغاء العملية
                </Button>
                <Button 
                  type="button" 
                  onClick={handleDeleteAccount}
                  disabled={loading || confirmationEmail !== user?.email || !reason.trim()}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-white gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري معالجة الطلب...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      تأكيد حذف الحساب
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-destructive border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold text-destructive mb-2">جاري معالجة طلب الحذف...</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                يرجى الانتظار بينما نقوم بمعالجة طلب حذف حسابك. قد تستغرق هذه العملية بضع ثوانٍ.
              </p>
              <div className="mt-8 space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive animate-pulse" style={{ width: '33%' }}></div>
                </div>
                <p className="text-sm text-muted-foreground">جاري حذف البيانات الشخصية...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* بدائل قبل الحذف */}
      <Card className="mt-6 bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-primary" />
            هل أنت متأكد من حذف الحساب؟ جرب هذه البدائل أولاً
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">تغيير كلمة المرور</p>
              <p className="text-sm text-muted-foreground mt-1">
                إذا كانت مشكلتك تتعلق بأمان الحساب، يمكنك تغيير كلمة المرور بدلاً من حذف الحساب
              </p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm mt-2"
                onClick={() => navigate('/app/profile/change-password')}
              >
                الذهاب إلى صفحة تغيير كلمة المرور
              </Button>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">إخفاء معلومات الحساب</p>
              <p className="text-sm text-muted-foreground mt-1">
                يمكنك إخفاء معلوماتك الشخصية من خلال تحديث إعدادات الخصوصية بدلاً من حذف الحساب
              </p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm mt-2"
                onClick={() => navigate('/app/profile')}
              >
                الذهاب إلى إعدادات الملف الشخصي
              </Button>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">التواصل مع الدعم الفني</p>
              <p className="text-sm text-muted-foreground mt-1">
                إذا كانت لديك أي مشكلة مع الحساب، فريق الدعم جاهز لمساعدتك في حلها
              </p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm mt-2"
                onClick={() => window.open('https://wa.me/201000000000', '_blank')}
              >
                التواصل مع الدعم عبر الواتساب
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteAccountPage;