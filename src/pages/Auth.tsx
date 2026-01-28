import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, User, Lock, Mail, Phone, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupStep, setSignupStep] = useState<'form' | 'verification'>('form');
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

    toast({ 
      title: "مرحباً بك", 
      description: "تم تسجيل الدخول بنجاح" 
    });
    navigate("/");
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

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { 
          full_name: signupFullName, 
          phone: signupPhone 
        },
      },
    });

    if (error) {
      toast({ 
        title: "خطأ", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      setVerificationEmail(signupEmail);
      setSignupStep('verification');
      toast({
        title: "تحقق من بريدك الإلكتروني",
        description: "تم إرسال رابط تفعيل إلى بريدك الإلكتروني. يرجى الضغط عليه لتفعيل الحساب.",
      });
    }
    setIsLoading(false);
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
        description: "فشل في إعادة إرسال رسالة التفعيل", 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "تم الإرسال", 
        description: "تم إعادة إرسال رسالة التفعيل إلى بريدك الإلكتروني" 
      });
    }
    setIsLoading(false);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">نظام الشحنات</h1>
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