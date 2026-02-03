// src/pages/profile/EditProfilePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  User, Phone, MapPin, Image, Save, X, Loader2, AlertCircle, 
  CheckCircle, Upload, Camera 
} from 'lucide-react';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    city: '',
    avatar_url: '',
  });
  const [initialProfile, setInitialProfile] = useState<typeof profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('full_name, phone, city, avatar_url')
          .eq('user_id', user?.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // لم يتم العثور على ملف شخصي - إنشاء واحد جديد
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{
                user_id: user?.id,
                full_name: user?.email?.split('@')[0] || 'مستخدم جديد',
                phone: null,
                city: null,
                avatar_url: null
              }]);

            if (insertError) throw insertError;
            
            setProfile({
              full_name: user?.email?.split('@')[0] || 'مستخدم جديد',
              phone: '',
              city: '',
              avatar_url: ''
            });
          } else {
            throw fetchError;
          }
        } else if (data) {
          setProfile({
            full_name: data.full_name || user?.email?.split('@')[0] || 'مستخدم جديد',
            phone: data.phone || '',
            city: data.city || '',
            avatar_url: data.avatar_url || ''
          });
          setInitialProfile({
            full_name: data.full_name || '',
            phone: data.phone || '',
            city: data.city || '',
            avatar_url: data.avatar_url || ''
          });
          
          // تعيين معاينة الصورة الحالية
          if (data.avatar_url) {
            setAvatarPreview(data.avatar_url);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل تحميل البيانات';
        setError(errorMessage);
        toast({
          title: "فشل التحميل",
          description: "حدث خطأ أثناء تحميل بيانات الملف الشخصي. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  // معالجة اختيار ملف الصورة
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        toast({
          title: "خطأ في الملف",
          description: "يرجى اختيار ملف صورة صالح (JPG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }
      
      // التحقق من الحجم (الحد الأقصى 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ في الحجم",
          description: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت",
          variant: "destructive",
        });
        return;
      }
      
      setAvatarFile(file);
      
      // إنشاء معاينة فورية
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // رفع الصورة إلى Supabase Storage
  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null;
    
    try {
      // إنشاء مسار فريد للصورة
      const fileName = `avatar_${user.id}_${Date.now()}.${avatarFile.name.split('.').pop()}`;
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`public/${fileName}`, avatarFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // الحصول على رابط عام للصورة
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`public/${fileName}`);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "فشل رفع الصورة",
        description: "حدث خطأ أثناء رفع صورة الملف الشخصي. سيتم حفظ البيانات بدون الصورة.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الاسم
    if (!profile.full_name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "الاسم الكامل مطلوب",
        variant: "destructive",
      });
      return;
    }
    
    // التحقق من رقم الهاتف (إذا تم إدخاله)
    if (profile.phone && !/^01[0-9]{9}$/.test(profile.phone)) {
      toast({
        title: "خطأ في البيانات",
        description: "رقم الهاتف غير صحيح. يجب أن يبدأ بـ 01 ويتكون من 11 رقم",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let avatarUrl = profile.avatar_url;
      
      // رفع الصورة الجديدة إذا تم اختيارها
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // تحديث الملف الشخصي
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim() || null,
          city: profile.city.trim() || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "تم الحفظ بنجاح",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            تم تحديث بيانات الملف الشخصي بنجاح
          </div>
        ),
      });

      // إعادة توجيه بعد 1.5 ثانية
      setTimeout(() => {
        navigate('/app/profile');
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'فشل تحديث البيانات';
      setError(errorMessage);
      toast({
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // التحقق مما إذا كان هناك تغييرات غير محفوظة
    if (initialProfile && (
      profile.full_name !== initialProfile.full_name ||
      profile.phone !== initialProfile.phone ||
      profile.city !== initialProfile.city ||
      avatarFile
    )) {
      if (!confirm('لديك تغييرات غير محفوظة. هل أنت متأكد من المغادرة؟')) {
        return;
      }
    }
    navigate('/app/profile');
  };

  // التحقق مما إذا كان هناك تغييرات
  const hasChanges = initialProfile && (
    profile.full_name !== initialProfile.full_name ||
    profile.phone !== initialProfile.phone ||
    profile.city !== initialProfile.city ||
    avatarFile !== null
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري تحميل بيانات الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* رأس الصفحة */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              تعديل الملف الشخصي
            </h1>
            <p className="text-muted-foreground mt-1">
              حدّث معلومات ملفك الشخصي لإدارة أفضل لحسابك
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={saving}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={saving || !hasChanges || !profile.full_name.trim()}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* بطاقة الملف الشخصي */}
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-blue-50">
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <User className="h-6 w-6" />
              معلومات الملف الشخصي
            </CardTitle>
            <CardDescription>
              يمكنك تعديل جميع المعلومات الشخصية هنا. الحقول المميزة بـ * مطلوبة.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* قسم الصورة الشخصية */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-lg font-medium">
                  <Camera className="h-5 w-5 text-primary" />
                  الصورة الشخصية
                </Label>
                <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="معاينة الصورة" 
                          className="w-full h-full object-cover"
                        />
                      ) : profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="الصورة الحالية" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-primary/50" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-1 shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <Upload className="h-5 w-5" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      • اختر صورة شخصية واضحة تظهر وجهك
                      <br />• الصيغ المدعومة: JPG, PNG, GIF
                      <br />• الحد الأقصى للحجم: 5 ميجابايت
                    </p>
                    {avatarFile && (
                      <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} ك.ب)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* الاسم الكامل */}
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    الاسم الكامل <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                    required
                    className="font-medium"
                  />
                  <p className="text-xs text-muted-foreground">
                    سيتم عرض هذا الاسم في جميع أنحاء النظام
                  </p>
                </div>

                {/* رقم الهاتف */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    رقم الهاتف (اختياري)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    dir="ltr"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    مثال: 01012345678 (سيتم استخدامه للتواصل والتنبيهات)
                  </p>
                </div>

                {/* المدينة */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    المدينة (اختياري)
                  </Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="أدخل مدينتك (مثال: القاهرة، جدة، الإسكندرية)"
                  />
                  <p className="text-xs text-muted-foreground">
                    مدينتك الحالية لتحسين خدمات التوصيل
                  </p>
                </div>
              </div>

              {/* ملاحظات هامة */}
              <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h3 className="font-medium text-blue-800">ملاحظات هامة:</h3>
                      <ul className="text-sm text-blue-700 space-y-1 pr-2">
                        <li>• جميع التغييرات يتم حفظها فوراً في قاعدة البيانات الآمنة</li>
                        <li>• صورتك الشخصية ستكون مرئية فقط للمسؤولين ولن تظهر للعملاء</li>
                        <li>• يمكنك العودة لأي وقت لتعديل معلوماتك</li>
                        <li>• الحفاظ على معلوماتك محدثة يساعدنا على تقديم خدمة أفضل</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* أزرار الحفظ والإلغاء (تكرار في الأسفل) */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 sm:flex-none"
                >
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !hasChanges || !profile.full_name.trim()}
                  className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* دليل سريع */}
        <Card className="mt-6 bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-5 w-5 text-primary" />
              دليل تحديث الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">الصورة الشخصية</p>
                <p className="text-sm text-muted-foreground mt-1">
                  اختر صورة واضحة تظهر وجهك بجودة عالية. هذا يساعد الفريق على التعرف عليك بسهولة.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">الاسم الكامل</p>
                <p className="text-sm text-muted-foreground mt-1">
                  استخدم اسمك الحقيقي كما يظهر في مستنداتك الرسمية لتجنب أي التباس.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">رقم الهاتف</p>
                <p className="text-sm text-muted-foreground mt-1">
                  تأكد من صحة رقم الهاتف لتلقي التنبيهات الهامة والتحديثات الفورية.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">المدينة</p>
                <p className="text-sm text-muted-foreground mt-1">
                  حدد مدينتك بدقة لتحسين خدمات التوصيل والتواصل مع أقرب فرع لك.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfilePage;