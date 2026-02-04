/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ChangePasswordPage.tsx
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
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ShieldCheck,
  Key
} from 'lucide-react';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // تقييم قوة كلمة المرور
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      setPasswordMessage('');
      return;
    }

    let strength = 0;
    const messages = [];

    // الطول
    if (newPassword.length >= 8) strength += 25;
    else messages.push('يجب أن تكون 8 أحرف على الأقل');
    // أحرف كبيرة
    if (/[A-Z]/.test(newPassword)) strength += 25;
    else messages.push('يجب أن تحتوي على حرف كبير');

    // أرقام
    if (/\d/.test(newPassword)) strength += 25;
    else messages.push('يجب أن تحتوي على رقم');
    // رموز خاصة
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25;
    else messages.push('يجب أن تحتوي على رمز خاص');
    setPasswordStrength(strength);
    
    if (strength === 100) {
      setPasswordMessage('كلمة مرور قوية جداً');
    } else if (strength >= 75) {
      setPasswordMessage('كلمة مرور قوية');
    } else if (strength >= 50) {
      setPasswordMessage('كلمة مرور متوسطة');
    } else {
      setPasswordMessage(messages.join('، '));
    }
  }, [newPassword]);

  const validateForm = () => {
    if (!currentPassword.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال كلمة المرور الحالية", variant: "destructive" });
      return false;
    }
    
    if (newPassword.length < 8) {
      toast({ title: "خطأ", description: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل", variant: "destructive" });
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" });
      return false;
    }
    
    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // إعادة مصادقة المستخدم بكلمة المرور الحالية
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error('كلمة المرور الحالية غير صحيحة');
      }
      
      // تغيير كلمة المرور
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: "تم التغيير بنجاح",
        description: "تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مرة أخرى.",
      });
      
      // تسجيل الخروج بعد 2 ثانية
      setTimeout(() => {
        supabase.auth.signOut();
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "فشل التغيير",
        description: error.message || "حدث خطأ أثناء تغيير كلمة المرور. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
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

  return (
    <div className="container py-8 max-w-2xl" dir="rtl">
      <Card className="border-primary/20 shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-blue-50">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Key className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription className="text-center mt-2">
            يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleChangePassword} className="space-y-6">
            {/* كلمة المرور الحالية */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                كلمة المرور الحالية <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                  required
                  className="pl-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ تأكد من إدخال كلمة المرور الحالية بشكل صحيح
              </p>
            </div>

            {/* كلمة المرور الجديدة */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                كلمة المرور الجديدة <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة"
                  required
                  className="pl-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* مؤشر قوة كلمة المرور */}
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength === 100 ? 'bg-green-500 w-full' :
                        passwordStrength >= 75 ? 'bg-green-400 w-3/4' :
                        passwordStrength >= 50 ? 'bg-yellow-400 w-1/2' :
                        'bg-red-400 w-1/4'
                      }`}
                    ></div>
                    <span className={`text-sm font-medium ${
                      passwordStrength === 100 ? 'text-green-600' :
                      passwordStrength >= 75 ? 'text-green-600' :
                      passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {passwordMessage}
                    </span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pr-5">
                    <li>يجب أن تكون 8 أحرف على الأقل</li>
                    <li>يجب أن تحتوي على حرف كبير ورقم ورمز خاص</li>
                    <li>تجنب استخدام معلومات شخصية في كلمة المرور</li>
                  </ul>
                </div>
              )}
            </div>

            {/* تأكيد كلمة المرور الجديدة */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                تأكيد كلمة المرور الجديدة <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  required
                  className="pl-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>كلمتا المرور غير متطابقتين</AlertDescription>
                </Alert>
              )}
            </div>

            {/* ملاحظات أمان */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">نصائح أمان هامة:</AlertTitle>
              <AlertDescription className="text-blue-700 mt-2 space-y-1">
                <p>• لا تستخدم نفس كلمة المرور لحسابات متعددة</p>
                <p>• غيّر كلمة المرور كل 3 أشهر على الأقل</p>
                <p>• تجنب استخدام معلومات شخصية مثل تاريخ الميلاد أو اسم العائلة</p>
                <p>• استخدم مديراً لكلمات المرور لتخزين كلمات المرور بشكل آمن</p>
              </AlertDescription>
            </Alert>

            {/* أزرار الإرسال */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                disabled={loading}
                className="flex-1"
              >
                <AlertCircle className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={loading || passwordStrength < 50 || newPassword !== confirmPassword}
                className="flex-1 bg-primary hover:bg-primary/90 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التغيير...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    تغيير كلمة المرور
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* دليل اختيار كلمة مرور قوية */}
      <Card className="mt-6 bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-primary" />
            دليل اختيار كلمة مرور قوية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">استخدم مزيجاً من الأحرف</p>
              <p className="text-sm text-muted-foreground mt-1">
                ادمج بين الأحرف الكبيرة والصغيرة والأرقام والرموز الخاصة (!, @, #, $, %)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">تجنب المعلومات الشخصية</p>
              <p className="text-sm text-muted-foreground mt-1">
                لا تستخدم اسمك، تاريخ ميلادك، رقم هاتفك، أو أي معلومات شخصية يمكن تخمينها
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">استخدم عبارات مرور طويلة</p>
              <p className="text-sm text-muted-foreground mt-1">
                اختر عبارة طويلة من 4-5 كلمات عشوائية بدلاً من كلمة واحدة معقدة
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium">لا تعيد استخدام كلمات المرور</p>
              <p className="text-sm text-muted-foreground mt-1">
                استخدم كلمة مرور فريدة لكل حساب مهم، خاصة للحسابات المالية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;