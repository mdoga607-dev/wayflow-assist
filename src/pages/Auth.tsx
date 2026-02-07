// src/pages/Auth.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, User, Lock, Mail, Phone, Eye, EyeOff, 
  ArrowLeft, CheckCircle, Truck, AlertCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupStep, setSignupStep] = useState<'form' | 'verification'>('form');
  const [accountType, setAccountType] = useState<'courier' | 'shipper' | 'guest'>('guest'); // ✅ حالة نوع الحساب
  const navigate = useNavigate();
  const { toast } = useToast();

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup State
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        toast({
          title: "تأكيد مطلوب",
          description: "يرجى تأكيد البريد الإلكتروني أولاً قبل تسجيل الدخول",
          variant: "destructive"
        });
      } else {
        toast({
          title: "خطأ في الدخول",
          description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          variant: "destructive"
        });
      }
      setIsLoading(false);
      return;
    }

    if (data.user && !data.user.confirmed_at) {
      toast({ 
        title: "تأكيد مطلوب", 
        description: "يرجى تأكيد البريد الإلكتروني أولاً" 
      });
      setIsLoading(false);
      return;
    }

    // ✅ الحصول على دور المستخدم من جدول user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    toast({ 
      title: "مرحباً بك", 
      description: "تم تسجيل الدخول بنجاح" 
    });
    
    // ✅ توجيه المستخدم حسب دوره
    const userRole = roleData?.role;
    if (userRole === 'guest') {
      navigate("/guest/orders");
    } else {
      navigate("/app/dashboard");
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      toast({ 
        title: "خطأ", 
        description: "يرجى إدخال بريد إلكتروني صحيح", 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }

    // التحقق من قوة كلمة المرور
    if (signupPassword.length < 6) {
      toast({ 
        title: "خطأ", 
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }

    // ✅ التحقق من اختيار نوع الحساب
    if (accountType === 'courier' && !signupPhone) {
      toast({ 
        title: "خطأ", 
        description: "رقم الهاتف مطلوب للمناديب", 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { 
            full_name: signupFullName, 
            phone: signupPhone,
            role: accountType // ✅ حفظ نوع الحساب في الميتاداتا
          },
        },
      });

      if (error) {
        // ✅ رسائل خطأ مخصصة لأنواع مختلفة من الأخطاء
        if (error.message.includes('already registered')) {
          toast({ 
            title: "الحساب موجود مسبقاً", 
            description: "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.",
            variant: "destructive" 
          });
        } else if (error.message.includes('Email rate limit exceeded')) {
          toast({ 
            title: "تم تجاوز الحد", 
            description: "تم إرسال العديد من طلبات التسجيل. يرجى المحاولة لاحقاً.",
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "خطأ في التسجيل", 
            description: error.message, 
            variant: "destructive" 
          });
        }
        setIsLoading(false);
        return;
      }

      // ✅ إنشاء السجل في جدول المستخدمين بعد التسجيل
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: data.user.id,
            role: accountType
          }]);

        if (profileError) {
          console.error('Error creating user role:', profileError);
          // لا نوقف التسجيل لكن نسجل الخطأ
        }
      }

      setVerificationEmail(signupEmail);
      setSignupStep('verification');
      toast({
        title: "تحقق من بريدك الإلكتروني",
        description: "تم إرسال رابط تفعيل إلى بريدك الإلكتروني. يرجى الضغط عليه لتفعيل الحساب.",
      });
    } catch (err) {
      console.error('Signup error:', err);
      toast({ 
        title: "خطأ غير متوقع", 
        description: "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: verificationEmail,
    });

    if (error) {
      toast({ 
        title: "خطأ", 
        description: "فشل في إعادة إرسال رسالة التفعيل. تحقق من اتصالك بالإنترنت.", 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "تم الإرسال", 
        description: "تم إعادة إرسال رسالة التفعيل إلى بريدك الإلكتروني. تحقق من مجلد الرسائل غير المرغوب فيها." 
      });
    }
    setIsLoading(false);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  // ✅ دالة لعرض وصف نوع الحساب
  const getAccountTypeDescription = () => {
    switch(accountType) {
      case 'courier':
        return "ستتمكن من توصيل الشحنات ومتابعة المهام اليومية وإدارة جدول التوصيل.";
      case 'shipper':
        return "ستتمكن من إرسال الشحنات وتتبعها وإدارة طلبات البيك أب وعرض التقارير.";
      case 'guest':
        return "ستتمكن من تتبع شحناتك فقط عبر رقم التتبع دون الحاجة لحساب كامل.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">نظام أمان للشحن</h1>
          <p className="text-sm text-muted-foreground mt-2">إدارة الشحنات المتكاملة</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50">
                <TabsTrigger value="login" className="font-medium">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup" className="font-medium">حساب جديد</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email" 
                        placeholder="mail@example.com" 
                        dir="ltr" 
                        value={loginEmail} 
                        onChange={(e)=>setLoginEmail(e.target.value)} 
                        required 
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        dir="ltr" 
                        value={loginPassword} 
                        onChange={(e)=>setLoginPassword(e.target.value)} 
                        required 
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
                  </Button>

                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {signupStep === 'form' ? (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">الاسم الكامل</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="أحمد محمد" 
                          value={signupFullName} 
                          onChange={(e)=>setSignupFullName(e.target.value)} 
                          required 
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          dir="ltr" 
                          value={signupEmail} 
                          onChange={(e)=>setSignupEmail(e.target.value)} 
                          required 
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        سيتم إرسال رابط تفعيل إلى هذا البريد
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="tel" 
                          placeholder="+2010..." 
                          dir="ltr" 
                          value={signupPhone} 
                          onChange={(e)=>setSignupPhone(e.target.value)} 
                          required={accountType === 'courier'} // ✅ إلزامي للمناديب فقط
                          className="pl-10"
                        />
                      </div>
                      {accountType === 'courier' && (
                        <p className="text-xs text-blue-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          رقم الهاتف إلزامي للمناديب للتواصل الفعّال
                        </p>
                      )}
                    </div>

                    {/* ✅ قسم اختيار نوع الحساب - المطلوب في السؤال */}
                    <div className="space-y-2 mb-6">
                      <Label>نوع الحساب</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            accountType === 'courier' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-primary/50'
                          }`}
                          onClick={() => setAccountType('courier')}
                        >
                          <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="text-center font-medium">مندوب</div>
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            لتوصيل الشحنات وإدارة المهام
                          </p>
                        </div>
                        
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            accountType === 'shipper' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-primary/50'
                          }`}
                          onClick={() => setAccountType('shipper')}
                        >
                          <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="text-center font-medium">تاجر</div>
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            لإرسال الشحنات وإدارة الطلبات
                          </p>
                        </div>
                        
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            accountType === 'guest' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-primary/50'
                          }`}
                          onClick={() => setAccountType('guest')}
                        >
                          <User className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="text-center font-medium">ضيف</div>
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            لتتبع الشحنات فقط
                          </p>
                        </div>
                      </div>
                      
                      {/* ✅ عرض وصف مخصص لنوع الحساب المختار */}
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-700">{getAccountTypeDescription()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          dir="ltr" 
                          value={signupPassword} 
                          onChange={(e)=>setSignupPassword(e.target.value)} 
                          required 
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        يجب أن تكون 6 أحرف على الأقل
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "جاري التسجيل..." : "إنشاء الحساب"}
                    </Button>
                    
                    <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground">
                        بالتسجيل، أنت توافق على <a href="#" className="text-primary hover:underline">شروط الخدمة</a> و <a href="#" className="text-primary hover:underline">سياسة الخصوصية</a>
                      </p>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6 text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold mb-2">تحقق من بريدك الإلكتروني</h3>
                      <p className="text-muted-foreground mb-4">
                        تم إرسال رابط تفعيل إلى:
                      </p>
                      <p className="font-medium text-primary bg-primary/10 px-4 py-2 rounded-lg inline-block">
                        {verificationEmail}
                      </p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                      <p>يرجى فتح البريد الإلكتروني والضغط على رابط التفعيل لتفعيل حسابك.</p>
                      <p className="mt-2">إذا لم تستلم الرسالة، تحقق من مجلد الرسائل غير المرغوب فيها.</p>
                    </div>

                    <div className="space-y-3">
                      <Button 
                        onClick={() => setSignupStep('form')}
                        variant="outline"
                        className="w-full"
                      >
                        <ArrowLeft className="h-4 w-4 ml-2" />
                        تعديل البيانات
                      </Button>
                      
                      <Button 
                        onClick={handleResendVerification}
                        variant="ghost"
                        className="w-full text-primary hover:bg-primary/10"
                        disabled={isLoading}
                      >
                        {isLoading ? "جاري الإرسال..." : "إعادة إرسال رسالة التفعيل"}
                      </Button>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => navigate('/auth')}
                        variant="link"
                        className="text-sm"
                      >
                        <ArrowLeft className="h-3 w-3 ml-1" />
                        العودة لصفحة تسجيل الدخول
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;