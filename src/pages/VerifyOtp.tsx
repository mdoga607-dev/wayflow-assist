import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [challengeId, setChallengeId] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { factorId, phone, isEnroll } = location.state || {};

  useEffect(() => {
    if (!factorId || !phone) navigate("/auth");
    const getChallengeId = async () => {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId });
      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else if (data?.id) {
        setChallengeId(data.id);
      }
    };
    getChallengeId();
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [factorId, phone, navigate, toast]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: otp,
    });

    if (error) {
      toast({ title: "خطأ", description: "الكود غير صحيح", variant: "destructive" });
    } else {
      toast({ title: "نجاح", description: "تم التحقق بنجاح" });
      navigate("/"); 
    }
    setIsLoading(false);
  };

  const resendCode = async () => {
    setTimer(60);
    const { error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم إعادة إرسال الكود" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-sm p-6 text-center shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">تأكيد رقم الهاتف</h2>
        <p className="text-sm text-muted-foreground mb-6">أدخل كود التحقق المرسل إلى {phone}</p>

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            className="text-center text-2xl tracking-widest h-14"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="000000"
          />
          <Button className="w-full py-6 text-lg" disabled={isLoading || otp.length < 6}>
            تحقق الآن
          </Button>
        </form>

        <div className="mt-6 text-sm">
          {timer > 0 ? (
            <p className="text-muted-foreground">إعادة إرسال الكود خلال {timer} ثانية</p>
          ) : (
            <button onClick={resendCode} className="text-primary font-bold underline">إعادة إرسال الكود</button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VerifyOtp;