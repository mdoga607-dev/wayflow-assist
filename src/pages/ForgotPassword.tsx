import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
// تم إضافة Lock هنا
import { Mail, ArrowLeft, CheckCircle, Lock } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'sent'>('form');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ 
        title: "خطأ", 
        description: "يرجى إدخال بريد إلكتروني صحيح", 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({ 
          title: "خطأ", 
          description: "فشل في إرسال الرابط. تأكد من أن البريد مسجل لدينا.", 
          variant: "destructive" 
        });
      } else {
        setStep('sent');
        toast({ 
          title: "تم الإرسال", 
          description: "تم إرسال رابط إعادة تعيين كلمة المرور بنجاح" 
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">إعادة تعيين كلمة المرور</h1>
          <p className="text-sm text-muted-foreground mt-2">أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardContent className="pt-6">
            {step === 'form' ? (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                  <div className="relative">
                    {/* تحسين: وضع الأيقونة في اليمين بما أن الواجهة RTL */}
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      placeholder="mail@example.com" 
                      dir="ltr" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="pr-10" // تغيير من pl-10 إلى pr-10
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                </Button>

                <div className="text-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => navigate('/auth')}
                    className="text-sm text-primary hover:underline font-medium flex items-center justify-center mx-auto"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> {/* تغيير ml إلى mr */}
                    العودة لتسجيل الدخول
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">تم إرسال الرابط</h3>
                  <p className="text-muted-foreground mb-4">
                    تم إرسال رابط إعادة تعيين كلمة المرور إلى:
                  </p>
                  <p className="font-medium text-primary bg-primary/10 px-4 py-2 rounded-lg inline-block" dir="ltr">
                    {email}
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                  <p>يرجى فتح البريد الإلكتروني والضغط على الرابط.</p>
                  <p className="mt-2 text-xs">إذا لم تجد الرسالة، تحقق من صندوق الرسائل غير المرغوب فيها (Spam).</p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/auth')}
                    variant="outline"
                    className="w-full"
                  >
                    العودة لتسجيل الدخول
                  </Button>
                  
                  <Button 
                    onClick={handleResetPassword}
                    variant="ghost"
                    className="w-full text-primary hover:bg-primary/10"
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري الإرسال..." : "إعادة إرسال الرابط"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;