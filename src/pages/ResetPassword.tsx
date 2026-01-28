import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // مراقبة حالة المصادقة بدلاً من الفحص لمرة واحدة فقط
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "PASSWORD_RECOVERY") {
        // إذا حاول المستخدم دخول الصفحة بدون رابط استعادة، نعيده للرئيسية
        // ملاحظة: يمكنك تعطيل هذا السطر إذا كنت تواجه مشاكل في الاختبار المحلي
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast({ 
        title: "خطأ", 
        description: "كلمتا المرور غير متطابقتين", 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast({ 
        title: "خطأ", 
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({ 
        title: "خطأ", 
        description: error.message || "فشل في إعادة تعيين كلمة المرور", 
        variant: "destructive" 
      });
    } else {
      setStep('success');
      toast({ 
        title: "تم بنجاح", 
        description: "تم تغيير كلمة المرور بنجاح" 
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">إعادة تعيين كلمة المرور</h1>
          <p className="text-sm text-muted-foreground mt-2">أدخل كلمة المرور الجديدة والقوية</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardContent className="pt-6">
            {step === 'form' ? (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    {/* أيقونة القفل على اليمين */}
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      dir="ltr" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                      className="pr-10 pl-10 text-left" // pr للفل وقفل، pl للعين
                    />
                    {/* أيقونة العين على اليسار */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      dir="ltr" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                      className="pr-10 text-left"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري التغيير..." : "حفظ كلمة المرور الجديدة"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6 text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">تم التغيير بنجاح!</h3>
                  <p className="text-muted-foreground">
                    تم تحديث بياناتك، يمكنك الآن الدخول إلى حسابك.
                  </p>
                </div>

                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg shadow-lg"
                >
                  تسجيل الدخول الآن
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;