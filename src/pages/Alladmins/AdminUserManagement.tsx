/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/UserManagement.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  CheckCircle, 
  UserX, 
  RefreshCcw, 
  Loader2, 
  AlertCircle,
  Info,
  Users,
  Database,
  
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { SelectItem } from "@/components/ui/select";

interface InactiveClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  last_active?: string;
  created_at: string;
  client_type: 'shipper' | 'delegate' | 'other';
}

const UserManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [inactiveClients, setInactiveClients] = useState<InactiveClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<InactiveClient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [loadingClients, setLoadingClients] = useState(true);
  const { toast } = useToast();

  // جلب العملاء غير النشطين عند التحميل
  useEffect(() => {
    fetchInactiveClients();
  }, []);

  // تطبيق الفلاتر
  useEffect(() => {
    let filtered = [...inactiveClients];
    
    // تصفية البحث
    if (searchTerm.trim()) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm))
      );
    }
    
    // تصفية نوع العميل
    if (clientTypeFilter !== "all") {
      filtered = filtered.filter(client => client.client_type === clientTypeFilter);
    }
    
    setFilteredClients(filtered);
  }, [searchTerm, clientTypeFilter, inactiveClients]);

  // جلب العملاء غير النشطين
  const fetchInactiveClients = async () => {
    try {
      setLoadingClients(true);
      
      // جلب التجار غير النشطين
      const { data: shippersData, error: shippersError } = await supabase
        .from('shippers')
        .select(`
          id,
          name,
          email,
          phone,
          status,
          created_at
        `)
        .eq('status', 'inactive')
        .order('created_at', { ascending: false });

      if (shippersError) throw shippersError;

      // جلب المناديب غير النشطين
      const { data: delegatesData, error: delegatesError } = await supabase
        .from('delegates')
        .select(`
          id,
          name,
          phone,
          status,
          created_at
        `)
        .eq('status', 'inactive')
        .order('created_at', { ascending: false });

      if (delegatesError) throw delegatesError;

      // دمج البيانات وتنسيقها
      const combinedClients: InactiveClient[] = [
        ...(shippersData || []).map(shipper => ({
          id: shipper.id,
          name: shipper.name,
          email: shipper.email || 'غير متاح',
          phone: shipper.phone || 'غير متاح',
          status: shipper.status,
          created_at: shipper.created_at,
          last_active: shipper.created_at, // يمكن استبداله بتاريخ آخر نشاط فعلي
          client_type: 'shipper' as const
        })),
        ...(delegatesData || []).map(delegate => ({
          id: delegate.id,
          name: delegate.name,
          email: delegate.phone || 'غير متاح', // للمناديب، البريد هو رقم التليفون
          phone: delegate.phone || 'غير متاح',
          status: delegate.status,
          created_at: delegate.created_at,
          last_active: delegate.created_at,
          client_type: 'delegate' as const
        }))
      ];

      setInactiveClients(combinedClients);
      setFilteredClients(combinedClients);
      
      toast({
        title: "تم التحميل",
        description: `تم تحميل ${combinedClients.length} عميل غير نشط`,
      });
    } catch (err: any) {
      console.error('خطأ في جلب العملاء غير النشطين:', err);
      toast({
        title: "فشل التحميل",
        description: err.message || "حدث خطأ أثناء تحميل بيانات العملاء غير النشطين",
        variant: "destructive"
      });
    } finally {
      setLoadingClients(false);
    }
  };

  // تفعيل عميل واحد
  const handleActivateClient = async (clientId: string, client_type: string, clientType: 'shipper' | 'delegate') => {
    setActivatingId(clientId);
    try {
      let error;
      
      if (clientType === 'shipper') {
        // تفعيل تاجر
        ({ error } = await supabase
          .from('shippers')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', clientId));
      } else {
        // تفعيل مندوب
        ({ error } = await supabase
          .from('delegates')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', clientId));
      }

      if (error) throw error;

      // تحديث القائمة المحلية
      setInactiveClients(prev => prev.filter(client => client.id !== clientId));
      setFilteredClients(prev => prev.filter(client => client.id !== clientId));
      
      toast({
        title: "تم التفعيل",
        description: "تم تفعيل العميل بنجاح وأصبح متاحاً لاستخدام النظام",
      });
      
      // إعادة تحميل القائمة بعد 1 ثانية لإظهار التحديث
      setTimeout(fetchInactiveClients, 1000);
    } catch (err: any) {
      console.error('خطأ في تفعيل العميل:', err);
      toast({
        title: "فشل التفعيل",
        description: err.message || "حدث خطأ أثناء تفعيل العميل. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setActivatingId(null);
    }
  };

  // تفعيل جميع العملاء غير النشطين
  const handleActivateAllClients = async () => {
    if (!window.confirm("هل أنت متأكد من تفعيل جميع العملاء غير النشطين؟\nهذا الإجراء هيؤدي لتفعيل كل التجار والمناديب غير النشطين في النظام.")) {
      return;
    }

    setIsLoading(true);
    try {
      // تفعيل جميع التجار غير النشطين
      const { error: shippersError } = await supabase
        .from('shippers')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('status', 'inactive');

      if (shippersError) throw shippersError;

      // تفعيل جميع المناديب غير النشطين
      const { error: delegatesError } = await supabase
        .from('delegates')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('status', 'inactive');

      if (delegatesError) throw delegatesError;

      toast({
        title: "تم التفعيل",
        description: "تم تفعيل جميع العملاء غير النشطين بنجاح",
      });
      
      // إعادة تحميل القائمة
      fetchInactiveClients();
    } catch (err: any) {
      console.error('خطأ في تفعيل جميع العملاء:', err);
      toast({
        title: "فشل التفعيل",
        description: err.message || "حدث خطأ أثناء تفعيل العملاء. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // الحصول على أنواع العملاء الفريدة
  const clientTypes = [...new Set(inactiveClients.map(client => client.client_type))];

  if (loadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card rounded-xl shadow-lg border border-border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">جاري تحميل بيانات العملاء غير النشطين...</p>
          <p className="text-sm text-muted-foreground mt-1">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 py-6 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* رأس الصفحة */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <Users className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-primary">
            إدارة العملاء غير النشطين
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            عرض وتفعيل التجار والمناديب غير النشطين في النظام. 
            يمكنك تفعيل عميل واحد أو تفعيل جميع العملاء دفعة واحدة.
          </p>
        </div>

        {/* ملاحظات هامة */}
        <Alert className="bg-blue-50/70 border-blue-200">
          <AlertTitle className="flex items-center gap-2 text-blue-800 font-bold">
            <Info className="h-4 w-4 flex-shrink-0" />
            ملاحظات هامة
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-blue-700 text-sm">
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>العميل غير النشط هو تاجر أو مندوب تم تعطيل حسابه أو لم يقم بالتسجيل فعلياً في النظام</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>التفعيل هيسمح للعميل باستخدام النظام بشكل طبيعي مرة أخرى</span>
            </p>
            <p className="flex items-start gap-2 bg-blue-100 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-800 mt-0.5 flex-shrink-0" />
              <span className="font-bold">تنبيه:</span> 
              <span>التفعيل لا يمكن التراجع عنه. تأكد من أن العميل يستحق التفعيل قبل المتابعة.</span>
            </p>
          </AlertDescription>
        </Alert>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي غير النشطين</p>
                  <p className="text-3xl font-bold mt-1 text-primary">{inactiveClients.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <UserX className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تجار غير نشطين</p>
                  <p className="text-3xl font-bold mt-1 text-green-600">
                    {inactiveClients.filter(c => c.client_type === 'shipper').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مناديب غير نشطين</p>
                  <p className="text-3xl font-bold mt-1 text-blue-600">
                    {inactiveClients.filter(c => c.client_type === 'delegate').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* أدوات التحكم والفلاتر */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50/30 pb-4">
            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
              <Database className="h-5 w-5 text-primary" />
              التحكم في العملاء غير النشطين
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600">
              استخدم أدوات التحكم أدناه لتصفية وتفعيل العملاء غير النشطين
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث باسم العميل أو البريد أو التليفون..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Users className="h-4 w-4 ml-2 text-muted-foreground" />
                    <SelectValue placeholder="كل الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    <SelectItem value="shipper">تجار</SelectItem>
                    <SelectItem value="delegate">مناديب</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  onClick={fetchInactiveClients}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  تحديث القائمة
                </Button>
                
                <Button
                  onClick={handleActivateAllClients}
                  disabled={isLoading || inactiveClients.length === 0}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري التفعيل...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      تفعيل الكل ({inactiveClients.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* جدول العملاء غير النشطين */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50/80 pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-gray-800">قائمة العملاء غير النشطين</CardTitle>
                <CardDescription className="mt-1 text-sm text-gray-600">
                  عرض {filteredClients.length} عميل من إجمالي {inactiveClients.length} عميل غير نشط
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                  التجار: {filteredClients.filter(c => c.client_type === 'shipper').length}
                </Badge>
                <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                  المناديب: {filteredClients.filter(c => c.client_type === 'delegate').length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredClients.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground bg-muted/30">
                <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <UserX className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-2xl font-medium mb-2">
                  {searchTerm || clientTypeFilter !== 'all' 
                    ? 'مفيش عملاء غير نشطين يطابقوا البحث' 
                    : 'مفيش عملاء غير نشطين'}
                </p>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm || clientTypeFilter !== 'all'
                    ? 'جرب غير معايير البحث أو امسح الفلاتر عشان تشوف كل العملاء غير النشطين'
                    : 'كل العملاء في النظام نشطين حالياً. هتظهر هنا أي عميل يتم تعطيله مستقبلاً.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-right w-16">النوع</TableHead>
                      <TableHead className="text-right min-w-[200px]">اسم العميل</TableHead>
                      <TableHead className="text-right min-w-[200px]">البريد / التليفون</TableHead>
                      <TableHead className="text-right w-32">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-right w-28">الحالة</TableHead>
                      <TableHead className="text-right w-32">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow 
                        key={client.id} 
                        className="hover:bg-muted/40 transition-colors border-b border-border/50"
                      >
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full",
                              client.client_type === 'shipper' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            )}
                          >
                            {client.client_type === 'shipper' ? 'تاجر' : 'مندوب'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{client.name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {client.client_type === 'shipper' ? client.email : client.phone}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800 border border-red-200 px-2 py-1 text-xs font-medium rounded-full">
                            غير نشط
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleActivateClient(client.id, client.client_type, client.client_type)}
                            disabled={activatingId === client.id}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {activatingId === client.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}
                            تفعيل
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* نصائح وإرشادات */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50/30 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium">نصائح لإدارة العملاء غير النشطين:</p>
                <ul className="list-disc pr-5 mt-2 space-y-1.5">
                  <li><span className="font-medium">للتجار غير النشطين:</span> تأكد من أن التاجر لا يزال يريد استخدام النظام قبل التفعيل. يمكنك الاتصال بهم هاتفياً للتأكيد.</li>
                  <li><span className="font-medium">للمناديب غير النشطين:</span> تحقق من سبب تعطيل الحساب (إجازة، مشكلة، إلخ) قبل التفعيل. قد يحتاج المندوب إلى تدريب إضافي.</li>
                  <li><span className="font-medium">التفعيل الجماعي:</span> استخدم زر "تفعيل الكل" بحذر. يُنصح بتفعيل العملاء بشكل فردي للتحقق من كل حالة على حدة.</li>
                  <li><span className="font-medium">المتابعة:</span> بعد التفعيل، راقب أداء العميل الجديد خلال الأيام الأولى لضمان التكيف الجيد مع النظام.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// أيقونة الشاحنة المطلوبة
const Truck = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <rect x="3" y="11" width="18" height="8" rx="2" />
    <path d="M7 11V7a3 3 0 0 1 6 0v4" />
    <path d="M17 11V7a3 3 0 0 1 6 0v4" />
  </svg>
);

// أيقونة البحث المطلوبة
const Search = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default UserManagement;