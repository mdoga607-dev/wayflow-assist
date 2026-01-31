import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@radix-ui/react-select';

const GeneralSettingsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: 'WayFlow Assist',
    companyPhone: '966112345678',
    companyEmail: 'support@wayflow.com',
    companyAddress: 'الرياض، المملكة العربية السعودية',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    notificationsEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    autoAssign: true,
  });

  useEffect(() => {
    if (!authLoading && role !== 'head_manager') {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // محاكاة الحفظ
    setTimeout(() => {
      toast({ 
        title: "تم الحفظ بنجاح", 
        description: "تم تحديث إعدادات النظام بنجاح" 
      });
      setLoading(false);
    }, 1500);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            الإعدادات العامة
          </h1>
          <p className="text-muted-foreground mt-1">إدارة إعدادات النظام الأساسية</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* معلومات الشركة */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الشركة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">اسم الشركة *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">رقم الهاتف *</Label>
                <Input
                  id="companyPhone"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  dir="ltr"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">البريد الإلكتروني *</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">العنوان *</Label>
                <Input
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الإعدادات المتقدمة */}
        <Card>
          <CardHeader>
            <CardTitle>الإعدادات المتقدمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">العملة الافتراضية</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العملة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                    <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">المنطقة الزمنية</Label>
                <Select 
                  value={formData.timezone} 
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنطقة الزمنية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">الرياض (السعودية)</SelectItem>
                    <SelectItem value="Africa/Cairo">القاهرة (مصر)</SelectItem>
                    <SelectItem value="Asia/Dubai">دبي (الإمارات)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificationsEnabled" className="text-sm font-medium">تمكين الإشعارات</Label>
                  <p className="text-xs text-muted-foreground mt-1">السماح بإرسال الإشعارات للمسؤولين والمستخدمين</p>
                </div>
                <Switch
                  id="notificationsEnabled"
                  checked={formData.notificationsEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, notificationsEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsEnabled" className="text-sm font-medium">تمكين الرسائل القصيرة</Label>
                  <p className="text-xs text-muted-foreground mt-1">تمكين إرسال الرسائل النصية للعملاء</p>
                </div>
                <Switch
                  id="smsEnabled"
                  checked={formData.smsEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, smsEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="whatsappEnabled" className="text-sm font-medium">تمكين الواتساب</Label>
                  <p className="text-xs text-muted-foreground mt-1">تمكين إرسال الرسائل عبر الواتساب</p>
                </div>
                <Switch
                  id="whatsappEnabled"
                  checked={formData.whatsappEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, whatsappEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoAssign" className="text-sm font-medium">التخصيص التلقائي</Label>
                  <p className="text-xs text-muted-foreground mt-1">تخصيص الشحنات تلقائياً للمناديب بناءً على الموقع</p>
                </div>
                <Switch
                  id="autoAssign"
                  checked={formData.autoAssign}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoAssign: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* زر الحفظ */}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading} className="min-w-[150px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GeneralSettingsPage;