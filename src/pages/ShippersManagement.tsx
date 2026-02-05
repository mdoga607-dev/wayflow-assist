// src/pages/ShippersManagement.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, Plus, Store, Phone, Mail, MapPin, Package, Wallet, 
  TrendingUp, Users, RefreshCcw, Download, Filter, Eye, Edit, Trash2,
  AlertCircle, Info, ChevronLeft, Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Shipper {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  branch: string | null;
  total_shipments: number;
  balance: number;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; color: string }> = {
  active: { label: "نشط", variant: "default", color: "bg-green-100 text-green-800" },
  inactive: { label: "مش نشط", variant: "secondary", color: "bg-gray-100 text-gray-800" },
};

const ShippersManagement = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [shippers, setShippers] = useState<Shipper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [shipperToDelete, setShipperToDelete] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ماعندكش الصلاحية تدير التجار",
        variant: "destructive"
      });
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب بيانات التجار
  const fetchShippers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("shippers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // معالجة البيانات وتعيين قيم افتراضية
      const processedData = (data || []).map(s => ({
        ...s,
        phone: s.phone || 'مش متاح',
        email: s.email || 'مش متاح',
        address: s.address || 'مش محدد',
        city: s.city || 'مش محدد',
        branch: s.branch || 'بدون فرع',
        total_shipments: s.total_shipments || 0,
        balance: s.balance || 0,
        status: s.status || 'active',
      }));

      setShippers(processedData);
      toast({
        title: "تم التحميل",
        description: "تم تحميل بيانات التجار بنجاح",
      });
    } catch (err) {
      console.error('Error fetching shippers:', err);
      setError('فشل تحميل بيانات التجار. يرجى المحاولة مرة تانية.');
      toast({
        title: "فشل التحميل",
        description: "حصل خطأ أثناء تحميل بيانات التجار",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchShippers();
    }
  }, [authLoading, role]);

  // ✅ الحل الصحيح: الحصول على المدن الفريدة بعد التنظيف والتصفية
  const cities = Array.from(new Set(
    shippers
      .map(s => s.city?.trim())
      .filter((city): city is string => !!city)
  )).sort((a, b) => a.localeCompare(b));


  // تصفية التجار
  const filteredShippers = shippers.filter(shipper => {
    const matchesSearch = 
      shipper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shipper.phone && shipper.phone.includes(searchQuery)) ||
      (shipper.city && shipper.city.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCity = cityFilter === "all" || (shipper.city?.trim() === cityFilter);
    const matchesStatus = statusFilter === "all" || shipper.status === statusFilter;
    
    return matchesSearch && matchesCity && matchesStatus;
  });

  // حساب الإحصائيات
  const stats = {
    total: shippers.length,
    active: shippers.filter(s => s.status === "active").length,
    totalShipments: shippers.reduce((sum, s) => sum + s.total_shipments, 0),
    totalBalance: shippers.reduce((sum, s) => sum + s.balance, 0),
  };

  // تصدير البيانات
  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      const exportData = filteredShippers.map(shipper => ({
        'اسم التاجر': shipper.name,
        'رقم التليفون': shipper.phone,
        'البريد الإلكتروني': shipper.email,
        'العنوان': shipper.address,
        'المدينة': shipper.city,
        'الفرع': shipper.branch,
        'إجمالي الشحنات': shipper.total_shipments,
        'الرصيد': `${shipper.balance.toLocaleString()} ج.م`,
        'الحالة': statusConfig[shipper.status]?.label || shipper.status,
        'تاريخ التسجيل': format(new Date(shipper.created_at), 'dd/MM/yyyy', { locale: ar }),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'التجار');
      
      XLSX.writeFile(workbook, `التجار_${format(new Date(), 'dd-MM-yyyy', { locale: ar })}.xlsx`);
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير البيانات إلى ملف Excel بنجاح",
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: "فشل التصدير",
        description: "حصل خطأ أثناء تصدير البيانات",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // حذف تاجر
  const handleDeleteShipper = async () => {
    if (!shipperToDelete) return;

    try {
      const { error } = await supabase
        .from("shippers")
        .delete()
        .eq("id", shipperToDelete);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف التاجر بنجاح",
      });

      fetchShippers();
      setIsDeleteDialogOpen(false);
      setShipperToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      toast({
        title: "فشل الحذف",
        description: "حصل خطأ أثناء حذف التاجر",
        variant: "destructive"
      });
    }
  };

  // معالجة حالة التحميل
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-muted-foreground">جاري تحميل بيانات التجار...</p>
        </div>
      </div>
    );
  }

  // معالجة حالة الخطأ
  if (error) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> خطأ في التحميل
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-6 text-lg">{error}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()} variant="destructive">
                <RefreshCcw className="h-4 w-4 ml-2" />
                إعادة المحاولة
              </Button>
              <Button onClick={() => navigate('/app')} variant="outline">
                <ChevronLeft className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
            <Store className="h-8 w-8 text-primary" />
            إدارة التجار
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة كل التجار في النظام ({stats.total} تاجر)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={exportToExcel}
            variant="outline"
            disabled={isExporting || filteredShippers.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                تصدير Excel
              </>
            )}
          </Button>
          <Button 
            onClick={() => navigate('/app/shippers/add')}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            إضافة تاجر جديد
          </Button>
        </div>
      </div>

      {/* ملاحظات هامة */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ملاحظات هامة:</p>
              <ul className="list-disc pr-5 mt-1 space-y-1">
                <li>التجار النشطين فقط هم من يمكنهم إضافة شحنات جديدة</li>
                <li>يمكنك تصفية التجار حسب المدينة أو الحالة</li>
                <li>الرصيد الموضح هو المبلغ المستحق للتاجر عن الشحنات المسلمة</li>
                <li>يمكنك تعديل بيانات التاجر بالنقر على زر التعديل</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التجار</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.total}</p>
                <p className="text-xs text-green-600 mt-1">{stats.active} نشط</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalShipments.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الرصيد</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {stats.totalBalance.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">ج.م</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط الشحنات</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {stats.total > 0 ? Math.round(stats.totalShipments / stats.total) : 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">لكل تاجر</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر والبحث - ✅ الجزء المصحح */}
      <Card className="rounded-xl shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-gray-800">
            <Filter className="h-4 w-4 text-primary" />
            فلترة وبحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم التاجر أو التليفون أو المدينة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10"
              />
            </div>
            
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full">
                <MapPin className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المدن</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <Package className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">مش نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول التجار */}
      <Card className="rounded-xl shadow-sm border-border overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-gray-800">قائمة التجار</CardTitle>
            <CardDescription className="text-sm">
              {filteredShippers.length} من {shippers.length} تاجر
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchShippers}
            className="gap-1"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            تحديث
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {filteredShippers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right w-16">الصورة</TableHead>
                    <TableHead className="text-right w-48">اسم التاجر</TableHead>
                    <TableHead className="text-right w-36">رقم التليفون</TableHead>
                    <TableHead className="text-right w-40">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right w-32">المدينة</TableHead>
                    <TableHead className="text-right w-28">الشحنات</TableHead>
                    <TableHead className="text-right w-32">الرصيد</TableHead>
                    <TableHead className="text-right w-24">الحالة</TableHead>
                    <TableHead className="text-center w-40">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShippers.map((shipper) => (
                    <TableRow 
                      key={shipper.id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/shippers/${shipper.id}`)}
                    >
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          {/* ✅ تصحيح: إزالة المسافة الزائدة في رابط الصورة */}
                          <AvatarImage 
                            src={shipper.email 
                              ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(shipper.email)}` 
                              : undefined} 
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                            {shipper.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{shipper.name}</TableCell>
                      <TableCell dir="ltr" className="font-mono text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {shipper.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {shipper.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className="px-2 py-0.5 bg-blue-50">
                          <MapPin className="h-3 w-3 inline-block mr-0.5" />
                          {shipper.city}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-green-600 text-center">
                            {shipper.total_shipments}
                          </p>
                          <Progress 
                            value={shipper.total_shipments}
                            max={100} 
                            className="h-2 rounded-full bg-green-100"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-bold text-primary">
                            {Number(shipper.balance).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">ج.م</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={statusConfig[shipper.status]?.variant || "secondary"}
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-full",
                            statusConfig[shipper.status]?.color
                          )}
                        >
                          {statusConfig[shipper.status]?.label || 'مش معروف'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/app/shippers/${shipper.id}`);
                            }}
                            className="h-8 w-8 p-0 hover:bg-green-100"
                          >
                            <Eye className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/app/shippers/${shipper.id}/edit`);
                            }}
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                          >
                            <Edit className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShipperToDelete(shipper.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex justify-center mb-4">
                <div className="bg-muted/30 p-4 rounded-full">
                  <Store className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <p className="text-lg font-medium mb-2">مفيش تجار يطابقوا معايير البحث</p>
              <p className="text-sm mb-6 max-w-md mx-auto">
                {searchQuery || cityFilter !== 'all' || statusFilter !== 'all'
                  ? 'يرجى تعديل الفلاتر أو البحث بمعايير مختلفة'
                  : 'مفيش تجار مسجلين في النظام حالياً'}
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setCityFilter('all');
                    setStatusFilter('all');
                  }}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  إعادة تعيين الفلاتر
                </Button>
                <Button 
                  onClick={() => navigate('/app/shippers/add')}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  إضافة تاجر جديد
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* مربع حوار الحذف */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right text-gray-800">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <div className="text-right py-4">
            <div className="flex items-start gap-3 bg-red-50 p-3 rounded-lg mb-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">
                <span className="font-medium">تنبيه هام:</span> سيتم حذف جميع بيانات هذا التاجر بشكل نهائي، 
                بما في ذلك سجل الشحنات والتقييمات. لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <p className="text-muted-foreground">
              هل أنت متأكد من حذف هذا التاجر؟
            </p>
          </div>
          <DialogFooter className="flex flex-row-reverse gap-2">
            <Button onClick={handleDeleteShipper} variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              حذف نهائي
            </Button>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippersManagement;