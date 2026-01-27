import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, User, Lock, Mail, Phone, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const parseJwt = (token: string) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  return JSON.parse(jsonPayload);
};

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast({
        title: "خطأ في الدخول",
        description: error.message === "Email not confirmed"
          ? "يرجى تأكيد البريد الإلكتروني أولاً"
          : "البيانات غير صحيحة",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (data.user && !data.user.confirmed_at) {
      toast({ title: "تأكيد مطلوب", description: "يرجى تأكيد البريد الإلكتروني أولاً" });
      setIsLoading(false);
      return;
    }

    toast({ title: "مرحباً بك", description: "تم تسجيل الدخول بنجاح" });
    navigate("/");
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { full_name: signupFullName, phone: signupPhone },
      },
    });

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "تفقد بريدك الإلكتروني",
        description: "أرسلنا رابط تفعيل لبريدك الإلكتروني، يرجى الضغط عليه لتفعيل الحساب",
      });
      if (data.user && !data.user.confirmed_at) {
        toast({ title: "تأكيد مطلوب", description: "يرجى تأكيد البريد قبل الدخول" });
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Package className="w-12 h-12 text-primary mx-auto mb-2" />
          <h1 className="text-2xl font-bold">نظام الشحنات</h1>
        </div>

        <Card className="shadow-2xl border-0">
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">حساب جديد</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input type="email" placeholder="mail@example.com" dir="ltr" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input type="password" placeholder="••••••••" dir="ltr" value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} required />
                  </div>
                  <Button className="w-full" disabled={isLoading}>
                    {isLoading ? "جاري الدخول..." : "دخول"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2 text-right">
                    <Label>الاسم الكامل</Label>
                    <Input placeholder="أحمد محمد" value={signupFullName} onChange={(e)=>setSignupFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input type="email" dir="ltr" value={signupEmail} onChange={(e)=>setSignupEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف (كود الدولة + الرقم)</Label>
                    <Input type="tel" placeholder="+2010..." dir="ltr" value={signupPhone} onChange={(e)=>setSignupPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input type="password" dir="ltr" value={signupPassword} onChange={(e)=>setSignupPassword(e.target.value)} required />
                  </div>
                  <Button className="w-full" disabled={isLoading}>
                    {isLoading ? "جاري المعالجة..." : "إنشاء الحساب وتفعيل البريد"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;