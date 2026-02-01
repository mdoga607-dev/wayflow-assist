// src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, Mail, Phone, MapPin, Calendar, Shield, Edit, LogOut, 
  Package, Truck, Wallet, 
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  full_name: string;
  phone?: string;
  city?: string;
  avatar_url?: string;
  email?: string;
  role?: string;
  created_at: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // جلب بيانات الملف الشخصي
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (profileError) throw profileError;

        // جلب رتبة المستخدم
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user?.id)
          .limit(1);

        setProfile({
          ...profileData,
          email: user?.email || '',
          role: roleData?.[0]?.role || 'user',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">لم يتم العثور على الملف الشخصي</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/app/dashboard')}>
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ترجمة الرتب
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'head_manager': 'مدير عام',
      'manager': 'مدير فرع',
      'courier': 'مندوب توصيل',
      'shipper': 'تاجر',
      'user': 'مستخدم',
      'guest': 'ضيف'
    };
    return roles[role] || role;
  };

  // ألوان الرتب
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'head_manager': 'bg-[#1a7061] text-white',
      'manager': 'bg-[#317896] text-white',
      'courier': 'bg-[#d24b60] text-white',
      'shipper': 'bg-[#6a5acd] text-white',
      'user': 'bg-gray-500 text-white',
      'guest': 'bg-gray-400 text-white'
    };
    return colors[role] || 'bg-gray-500 text-white';
  };

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            الملف الشخصي
          </h1>
          <p className="text-muted-foreground mt-1">عرض وتحديث معلومات حسابك</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/app/dashboard')}>
            <Package className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Button>
          <Button onClick={handleSignOut} variant="destructive">
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* البطاقة الرئيسية */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center pb-4">
            <Avatar className="h-24 w-24 mx-auto border-4 border-primary">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                {profile.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl mt-4">{profile.full_name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-primary" />
              <Badge className={getRoleColor(profile.role || 'user')}>
                {getRoleLabel(profile.role || 'user')}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </p>
                <p className="font-medium">{profile.email}</p>
              </div>
              
              {profile.phone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    رقم الهاتف
                  </p>
                  <p dir="ltr" className="font-medium font-mono">{profile.phone}</p>
                </div>
              )}
              
              {profile.city && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    المدينة
                  </p>
                  <p className="font-medium">{profile.city}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  تاريخ التسجيل
                </p>
                <p className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <Button className="w-full" variant="outline" onClick={() => navigate('/app/profile/edit')}>
              <Edit className="h-4 w-4 ml-2" />
              تعديل الملف الشخصي
            </Button>
          </CardContent>
        </Card>

        {/* إحصائيات المستخدم */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              إحصائيات النشاط
            </CardTitle>
            <CardDescription>
              ملخص نشاطك في النظام خلال الفترة الأخيرة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                    <p className="text-2xl font-bold text-primary mt-1">120</p>
                  </div>
                  <Package className="h-8 w-8 text-primary/50" />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50/5 rounded-lg border border-blue-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الشحنات النشطة</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">25</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-500/50" />
                </div>
              </div>
              
              <div className="p-4 bg-green-50/5 rounded-lg border border-green-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">2,450 ر.س</p>
                  </div>
                  <Wallet className="h-8 w-8 text-green-500/50" />
                </div>
              </div>
              
              <div className="p-4 bg-purple-50/5 rounded-lg border border-purple-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">المهام المكتملة</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">45</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-500/50" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-4">آخر النشاطات</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Package className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">تم إنشاء شحنة جديدة</p>
                    <p className="text-sm text-muted-foreground">قبل 2 ساعة</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">تم تحديث حالة شحنة</p>
                    <p className="text-sm text-muted-foreground">قبل 5 ساعات</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Wallet className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">تم إضافة عملية مالية</p>
                    <p className="text-sm text-muted-foreground">أمس</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;