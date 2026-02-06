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
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Save, 
  Loader2, 
  AlertCircle,
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Smartphone, 
  Truck,
  ShieldCheck,
  RefreshCcw,
  MessageSquare,
  Bell
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

const egyptianGovernorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية',
  'الدقهلية', 'الغربية', 'كفر الشيخ', 'المنوفية', 'البحيرة',
  'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء',
  'جنوب سيناء', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مطروح'
];

const GeneralSettingsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [initialData, setInitialData] = useState<SettingsData | null>(null);

  useEffect(() => {
    if (!authLoading && role !== 'head_manager') {
      toast({
        title: "غير مصرح",
        description: "فقط المدير العام يمكنه إدارة الإعدادات العامة",
        variant: "destructive"
      });
      navigate('/app/dashboard');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    if (!authLoading && role === 'head_manager') {
      fetchSettings();
    }
  }, [authLoading, role]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as SettingsData);
        setInitialData(data as SettingsData);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          company_name: 'العلماية للشحن',
          company_phone: '01012345678',
          company_email: 'support@elalamia.com',
          company_address: '',
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

        const { data: newData, error: insertError } = await supabase
          .from('system_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) throw insertError;
        
        setSettings(newData as SettingsData);
        setInitialData(newData as SettingsData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الإعدادات",
        variant: "destructive"
      });
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

      setInitialData({...settings});
      
      toast({
        title: "تم الحفظ",
        description: "تم تحديث الإعدادات بنجاح"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
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
        title: "تم إعادة التعيين",
        description: "تمت استعادة الإعدادات الأصلية"
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">لا توجد إعدادات</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
              <Settings className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-primary" />
            </div>
            <span>الإعدادات العامة</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 hidden sm:inline" />
            إدارة إعدادات النظام وبيانات الشركة
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges() || saving}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <RefreshCcw className="h-4 w-4 ml-2" />
            <span className="hidden sm:inline">إعادة التعيين</span>
            <span className="sm:hidden">تعيين</span>
          </Button>
        </div>
      </div>

      {/* Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-600 dark:text-blue-400">ملاحظة</AlertTitle>
        <AlertDescription className="text-blue-600/80 dark:text-blue-400/80 text-sm">
          التغييرات لن تُحفظ حتى تضغط على زر "حفظ التغييرات"
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              معلومات الشركة
            </CardTitle>
            <CardDescription className="text-sm">
              البيانات الأساسية للشركة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-sm">اسم الشركة *</Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_phone" className="text-sm">رقم الهاتف *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_phone"
                    value={settings.company_phone}
                    onChange={(e) => setSettings({...settings, company_phone: e.target.value})}
                    dir="ltr"
                    className="pl-10 font-mono text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_email" className="text-sm">البريد الإلكتروني *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_email"
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => setSettings({...settings, company_email: e.target.value})}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_address" className="text-sm">العنوان</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_address"
                    value={settings.company_address}
                    onChange={(e) => setSettings({...settings, company_address: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_city" className="text-sm">المدينة *</Label>
                <Select 
                  value={settings.company_city} 
                  onValueChange={(value) => setSettings({...settings, company_city: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {egyptianGovernorates.map((gov) => (
                      <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_governorate" className="text-sm">المحافظة *</Label>
                <Select 
                  value={settings.company_governorate} 
                  onValueChange={(value) => setSettings({...settings, company_governorate: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {egyptianGovernorates.map((gov) => (
                      <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              إعدادات النظام
            </CardTitle>
            <CardDescription className="text-sm">
              العملة والتوقيت
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm">العملة</Label>
                <Select 
                  value={settings.currency} 
                  onValueChange={(value) => setSettings({...settings, currency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                    <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                    <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm">المنطقة الزمنية</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={settings.timezone} 
                    onValueChange={(value) => setSettings({...settings, timezone: value})}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Cairo">توقيت القاهرة (UTC+2)</SelectItem>
                      <SelectItem value="Asia/Riyadh">توقيت الرياض (UTC+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">توقيت دبي (UTC+4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              الإشعارات والتنبيهات
            </CardTitle>
            <CardDescription className="text-sm">
              إعدادات الإشعارات والرسائل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">الإشعارات</p>
                    <p className="text-xs text-muted-foreground">تفعيل إشعارات النظام</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications_enabled}
                  onCheckedChange={(checked) => setSettings({...settings, notifications_enabled: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">رسائل SMS</p>
                    <p className="text-xs text-muted-foreground">إرسال رسائل SMS</p>
                  </div>
                </div>
                <Switch
                  checked={settings.sms_enabled}
                  onCheckedChange={(checked) => setSettings({...settings, sms_enabled: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">واتساب</p>
                    <p className="text-xs text-muted-foreground">إرسال رسائل واتساب</p>
                  </div>
                </div>
                <Switch
                  checked={settings.whatsapp_enabled}
                  onCheckedChange={(checked) => setSettings({...settings, whatsapp_enabled: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">التوزيع التلقائي</p>
                    <p className="text-xs text-muted-foreground">توزيع الشحنات تلقائياً</p>
                  </div>
                </div>
                <Switch
                  checked={settings.auto_assign}
                  onCheckedChange={(checked) => setSettings({...settings, auto_assign: checked})}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">وضع الصيانة</p>
                  <p className="text-xs text-muted-foreground">إيقاف الموقع مؤقتاً للصيانة</p>
                </div>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end sticky bottom-4">
          <Button 
            type="submit" 
            disabled={!hasChanges() || saving}
            className="w-full sm:w-auto shadow-lg"
            size="lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GeneralSettingsPage;
