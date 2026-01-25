import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, Home, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-destructive/20">
        <CardHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">غير مصرح</CardTitle>
          <CardDescription>
            ليس لديك صلاحية للوصول إلى هذه الصفحة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            الصفحة التي تحاول الوصول إليها تتطلب صلاحيات خاصة. يرجى التواصل مع مدير النظام إذا كنت تعتقد أن هذا خطأ.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 ml-2" />
              الذهاب للرئيسية
            </Button>
            <Button variant="outline" onClick={handleGoBack} className="w-full">
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للخلف
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="w-full text-muted-foreground">
              تسجيل الخروج
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;
