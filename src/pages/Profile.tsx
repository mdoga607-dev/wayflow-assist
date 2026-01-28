import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          toast({ title: "خطأ", description: "فشل في تحميل الملف الشخصي", variant: "destructive" });
        } else if (data) {
          setFullName(data.full_name);
          setPhone(data.phone || "");
          setCity(data.city || "");
        }
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone, city })
        .eq('user_id', user.id);

      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "نجاح", description: "تم تحديث الملف الشخصي" });
        navigate("/"); // Or back to previous page
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <Button className="w-full" disabled={isLoading}>
              {isLoading ? "جاري التحديث..." : "تحديث"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;