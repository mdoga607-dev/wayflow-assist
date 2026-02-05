import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Trash2 } from "lucide-react";
import { error } from "console";

const UserManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

// ...existing code...
const handleDeleteUnconfirmedUsers = async () => {
  setIsLoading(true);
  try {
    const { data, error } = await supabase.rpc('delete_unconfirmed_users' as never);
    if (error) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "تم",
        description: `تم حذف ${data} مستخدم غيرمؤكد`,
      });
    }
  } catch (err) {
    toast({
      title: "خطأ",
      description: "حدث خطأ غير متوقع",
      variant: "destructive"
    });
  }
  setIsLoading(false);
};

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
          <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              حذف المستخدمين غير المؤكدين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              هذا الإجراء سيحذف جميع المستخدمين الذين سجلوا منذ أكثر من 24 ساعة ولم يؤكدوا بريدهم الإلكتروني.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه. تأكد من أنك تريد حذف هؤلاء المستخدمين.
              </p>
            </div>
            <Button
              onClick={handleDeleteUnconfirmedUsers}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? "جاري الحذف..." : "حذف المستخدمين غير المؤكدين"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;