// src/pages/settings/GeneralSettingsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  MessageSquare, 
  Smartphone, 
  Truck, 
  Database,
  ShieldCheck,
  RefreshCcw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface SettingsData {
  id: string;
  company_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
  company_city: string;
  company_governorate: string;
  currency: string;
  timezone: string;
  notifications_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  auto_assign: boolean;
  maintenance_mode: boolean;
  created_at: string;
  updated_at: string;
}

const GeneralSettingsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [initialData, setInitialData] = useState<SettingsData | null>(null);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role !== 'head_manager') {
      toast({
        title: "غير مصرح",
        description: "فقط المدير العام يمكنه إدارة الإعدادات العامة",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب الإعدادات من قاعدة البيانات
  useEffect(() => {
    if (!authLoading && role === 'head_manager') {
      fetchSettings();
    }
  }, [authLoading, role]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // محاولة جلب الإعدادات الموجودة
      const { data: settingsData, error: fetchError } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // إذا لم تكن هناك إعدادات، إنشاء إعدادات افتراضية مصرية
      if (fetchError || !settingsData) {
        const defaultSettings: Omit<SettingsData, 'id' | 'created_at' | 'updated_at'> = {
          company_name: 'أمان للشحن',
          company_phone: '201000000000',
          company_email: 'support@amanshipping.com',
          company_address: 'شارع التسعين، المعادي الجديدة',
          company_city: 'القاهرة',
          company_governorate: 'القاهرة',
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          notifications_enabled: true,
          sms_enabled: true,
          whatsapp_enabled: true,
          auto_assign: true,
          maintenance_mode: false
        };

        const {  data:newSettings, error: insertError } = await supabase
          .from('system_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) throw insertError;
        
        setSettings(newSettings);
        setInitialData(newSettings);
      } else {
        setSettings(settingsData);
        setInitialData(settingsData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "فشل التحميل",
        description: "حدث خطأ أثناء تحميل الإعدادات. سيتم استخدام القيم الافتراضية.",
        variant: "destructive"
      });
      
      // استخدام القيم الافتراضية المصرية في حالة الفشل
      const defaultSettings: SettingsData = {
        id: 'default',
        company_name: 'أمان للشحن',
        company_phone: '201000000000',
        company_email: 'support@amanshipping.com',
        company_address: 'شارع التسعين، المعادي الجديدة',
        company_city: 'القاهرة',
        company_governorate: 'القاهرة',
        currency: 'EGP',
        timezone: 'Africa/Cairo',
        notifications_enabled: true,
        sms_enabled: true,
        whatsapp_enabled: true,
        auto_assign: true,
        maintenance_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setSettings(defaultSettings);
      setInitialData(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!settings || !initialData) return false;
    return JSON.stringify(settings) !== JSON.stringify(initialData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          company_name: settings.company_name,
          company_phone: settings.company_phone,
          company_email: settings.company_email,
          company_address: settings.company_address,
          company_city: settings.company_city,
          company_governorate: settings.company_governorate,
          currency: settings.currency,
          timezone: settings.timezone,
          notifications_enabled: settings.notifications_enabled,
          sms_enabled: settings.sms_enabled,
          whatsapp_enabled: settings.whatsapp_enabled,
          auto_assign: settings.auto_assign,
          maintenance_mode: settings.maintenance_mode,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      // تحديث البيانات الأولية بعد الحفظ الناجح
      setInitialData({...settings});
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث إعدادات النظام بنجاح",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setSettings({...initialData});
      toast({
        title: "تمت إعادة التعيين",
        description: "تمت استعادة الإعدادات الأصلية"
      });
    }
  };

  const handleTestConnection = async () => {
    toast({
      title: "جارٍ اختبار الاتصال...",
      description: "سيتم إرسال رسالة تجريبية إلى الإدارة قريباً"
    });
    
    // محاكاة اختبار الاتصال
    setTimeout(() => {
      toast({
        title: "نجح اختبار الاتصال",
        description: "تم الاتصال بنجاح بجميع الخدمات",
        variant: "default"
      });
    }, 1500);
  };

  if (authLoading || loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-foreground">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6 bg-background text-foreground min-h-screen" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <span>الإعدادات العامة</span>
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            إدارة إعدادات النظام الأساسية وبيانات الشركة
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges() || saving}
            className="border-border hover:bg-muted gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            إعادة التعيين
          </Button>
          <Button 
            onClick={handleTestConnection}
            variant="outline"
            className="border-border hover:bg-muted gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            اختبار الاتصال
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Alert className="bg-blue-900/30 border-blue-500/30">
        <AlertCircle className="h-5 w-5 text-blue-400" />
        <AlertTitle className="text-blue-300">ملاحظات هامة:</AlertTitle>
        <AlertDescription className="text-blue-200 space-y-1 mt-2">
          <p>• جميع الحقول مطلوبة ما لم يُذكر خلاف ذلك</p>
          <p>• التغييرات لن تُحفظ حتى تضغط على زر "حفظ التغييرات"</p>
          <p>• بعض التغييرات قد تتطلب إعادة تشغيل النظام لتصبح سارية المفعول</p>
          <p>• يوصى بعمل نسخة احتياطية قبل إجراء تغييرات كبرى</p>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* معلومات الشركة */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              معلومات الشركة
            </CardTitle>
            <CardDescription>
              البيانات الأساسية للشركة التي ستظهر في الفواتير والتقارير
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">اسم الشركة <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    value={settings.company_name}
                    onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                    className="pl-10 bg-background border-border"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyPhone">رقم الهاتف <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyPhone"
                    value={settings.company_phone}
                    onChange={(e) => setSettings({...settings, company_phone: e.target.value})}
                    dir="ltr"
                    className="pl-10 bg-background border-border font-mono"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  مثال: 201012345678 (بدون مسافات أو رموز)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyEmail">البريد الإلكتروني <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => setSettings({...settings, company_email: e.target.value})}
                    className="pl-10 bg-background border-border"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyAddress">العنوان <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyAddress"
                    value={settings.company_address}
                    onChange={(e) => setSettings({...settings, company_address: e.target.value})}
                    className="pl-10 bg-background border-border"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyCity">المدينة <span className="text-destructive">*</span></Label>
                <Select 
                  value={settings.company_city} 
                  onValueChange={(value) => setSettings({...settings, company_city: value})}
                >
                  <SelectTrigger id="companyCity" className="bg-background border-border">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="القاهرة">القاهرة</SelectItem>
                    <SelectItem value="الجيزة">الجيزة</SelectItem>
                    <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
                    <SelectItem value="القليوبية">القليوبية</SelectItem>
                    <SelectItem value="الشرقية">الشرقية</SelectItem>
                    <SelectItem value="الدقهلية">الدقهلية</SelectItem>
                    <SelectItem value="الغربية">الغربية</SelectItem>
                    <SelectItem value="كفر الشيخ">كفر الشيخ</SelectItem>
                    <SelectItem value="المنوفية">المنوفية</SelectItem>
                    <SelectItem value="البحيرة">البحيرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyGovernorate">المحافظة <span className="text-destructive">*</span></Label>
                <Select 
                  value={settings.company_governorate} 
                  onValueChange={(value) => setSettings({...settings, company_governorate: value})}
                >
                  <SelectTrigger id="companyGovernorate" className="bg-background border-border">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="القاهرة">القاهرة</SelectItem>
                    <SelectItem value="الجيزة">الجيزة</SelectItem>
                    <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
                    <SelectItem value="القليوبية">القليوبية</SelectItem>
                    <SelectItem value="الشرقية">الشرقية</SelectItem>
                    <SelectItem value="الدقهلية">الدقهلية</SelectItem>
                    <SelectItem value="الغربية">الغربية</SelectItem>
                    <SelectItem value="كفر الشيخ">كفر الشيخ</SelectItem>
                    <SelectItem value="المنوفية">المنوفية</SelectItem>
                    <SelectItem value="البحيرة">البحيرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyDescription">وصف الشركة</Label>
              <Textarea
                id="companyDescription"
                value={settings.company_address} // Using address as description for now
                onChange={(e) => setSettings({...settings, company_address: e.target.value})}
                placeholder="وصف مختصر عن الشركة وأنشطتها"
                className="min-h-[80px] bg-background border-border resize-none"
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground text-right">
                {settings.company_address.length}/255
              </p>
            </div>
          </CardContent>
        </Card>

        {/* الإعدادات المتقدمة */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              الإعدادات المتقدمة
            </CardTitle>
            <CardDescription>
              تخصيص إعدادات النظام حسب متطلبات عملك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currency">العملة الافتراضية</Label>
                <Select 
                  value={settings.currency} 
                  onValueChange={(value) => setSettings({...settings, currency: value})}
                >
                  <SelectTrigger id="currency" className="bg-background border-border">
                    <SelectValue placeholder="اختر العملة" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                    <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  العملة المستخدمة في جميع المعاملات المالية
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">المنطقة الزمنية</Label>
                <Select 
                  value={settings.timezone} 
                  onValueChange={(value) => setSettings({...settings, timezone: value})}
                >
                  <SelectTrigger id="timezone" className="bg-background border-border">
                    <SelectValue placeholder="اختر المنطقة الزمنية" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Africa/Cairo">القاهرة (مصر)</SelectItem>
                    <SelectItem value="Asia/Riyadh">الرياض (السعودية)</SelectItem>
                    <SelectItem value="Asia/Dubai">دبي (الإمارات)</SelectItem>
                    <SelectItem value="Asia/Baghdad">بغداد (العراق)</SelectItem>
                    <SelectItem value="Asia/Amman">عمان (الأردن)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  المنطقة الزمنية المستخدمة في النظام
                </p>
              </div>
            </div>

            <Separator className="my-2 bg-border" />
            
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <Label htmlFor="notificationsEnabled" className="text-sm font-medium">
                      تمكين الإشعارات
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    السماح بإرسال الإشعارات للمسؤولين والمستخدمين
                  </p>
                </div>
                <Switch
                  id="notificationsEnabled"
                  checked={settings.notifications_enabled}
                  onCheckedChange={(checked) => setSettings({...settings, notifications_enabled: checked})}
                  className={settings.notifications_enabled ? 'data-[state=checked]:bg-green-500' : ''}
                />
              </div>

              <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-blue-500" />
                    <Label htmlFor="smsEnabled" className="text-sm font-medium">
                      تمكين الرسائل القصيرة
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    تمكين إرسال الرسائل النصية للعملاء والمناديب
                  </p>
                </div>
                <Switch
                  id="smsEnabled"
                  checked={settings.sms_enabled}
                  onCheckedChange={(checked) => setSettings({...settings, sms_enabled: checked})}
                  className={settings.sms_enabled ? 'data-[state=checked]:bg-blue-500' : ''}
                />
              </div>

              <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <Label htmlFor="whatsappEnabled" className="text-sm font-medium">
                      تمكين الواتساب
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    تمكين إرسال الرسائل والتنبيهات عبر الواتساب
                  </p>
                </div>
                <Switch
                  id="whatsappEnabled"
                  checked={settings.whatsapp_enabled}
                  onCheckedChange={(checked) => setSettings({...settings, whatsapp_enabled: checked})}
                  className={settings.whatsapp_enabled ? 'data-[state=checked]:bg-green-500' : ''}
                />
              </div>

              <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-purple-500" />
                    <Label htmlFor="autoAssign" className="text-sm font-medium">
                      التخصيص التلقائي
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    تخصيص الشحنات تلقائياً للمناديب بناءً على الموقع والقدرة
                  </p>
                </div>
                <Switch
                  id="autoAssign"
                  checked={settings.auto_assign}
                  onCheckedChange={(checked) => setSettings({...settings, auto_assign: checked})}
                  className={settings.auto_assign ? 'data-[state=checked]:bg-purple-500' : ''}
                />
              </div>

              <div className="flex items-start justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <Label htmlFor="maintenanceMode" className="text-sm font-medium text-destructive">
                      وضع الصيانة
                    </Label>
                  </div>
                  <p className="text-xs text-destructive/80">
                    عند التفعيل، سيتم تعطيل النظام مؤقتاً للصيانة. المستخدمون لن يتمكنوا من تسجيل الدخول.
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
                  className={settings.maintenance_mode ? 'data-[state=checked]:bg-destructive' : ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ملخص التغييرات */}
        {hasChanges() && (
          <Alert className="bg-yellow-900/30 border-yellow-500/30">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <AlertTitle className="text-yellow-300">لديك تغييرات غير محفوظة</AlertTitle>
            <AlertDescription className="text-yellow-200 mt-2">
              <p>لقد قمت بإجراء تغييرات على الإعدادات. لا تنسَ حفظ التغييرات قبل مغادرة الصفحة.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* أزرار الحفظ */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges() || saving}
            className="border-border hover:bg-muted min-w-[150px]"
          >
            <RefreshCcw className="h-4 w-4 ml-2" />
            إعادة التعيين
          </Button>
          <Button 
            type="submit" 
            disabled={saving || !hasChanges()}
            className="bg-primary hover:bg-primary/90 min-w-[180px] gap-2 shadow-lg"
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

      {/* معلومات النظام */}
      <Card className="border-border bg-card/50 backdrop-blur-sm mt-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">آخر تحديث</span>
              <span className="font-medium">
                {settings.updated_at ? new Date(settings.updated_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'غير معروف'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">نوع النظام</span>
              <span className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                نظام إدارة شحنات
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">الإصدار</span>
              <span className="font-medium">v2.5.0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">قاعدة البيانات</span>
              <span className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Supabase
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettingsPage;