/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DelegatesManagement.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Eye, Search, Plus, Truck, Phone, MapPin, Wallet, TrendingUp, Award, 
  RefreshCcw, Download, Filter, Edit, Trash2, CheckCircle, Users, BarChart3, AlertCircle, Info,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Delegate {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: string;
  total_delivered: number;
  total_delayed: number;
  total_returned: number;
  balance: number;
  commission_due: number;
  avatar_url: string | null;
  branch: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; color: string }> = {
  active: { label: "نشط", variant: "default", color: "bg-green-100 text-green-800" },
  inactive: { label: "مش نشط", variant: "secondary", color: "bg-gray-100 text-gray-800" },
  on_leave: { label: "فى إجازة", variant: "outline", color: "bg-blue-100 text-blue-800" },
  busy: { label: "مشغول", variant: "outline", color: "bg-yellow-100 text-yellow-800" },
};

const DelegatesManagement = () => {
  const navigate = useNavigate();
  const auth = useAuth() ?? { role: null, loading: true, user: null };
  const { role, loading: authLoading, user } = auth;

  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [sortBy, setSortBy] = useState<keyof Delegate>('total_delivered');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [delegateToDelete, setDelegateToDelete] = useState<string | null>(null);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (authLoading) return;

    if (!role || !['head_manager', 'manager'].includes(role as string)) {
      toast({
        title: "غير مصرح",
        description: "ماعندكش الصلاحية لإدارة المناديب",
        variant: "destructive"
      });
      navigate('/unauthorized', { replace: true });
    }
  }, [authLoading, role, navigate]);

  // جلب المناديب
  const fetchDelegates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('delegates')
        .select(`
          id,
          name,
          phone,
          city,
          status,
          total_delivered,
          total_delayed,
          total_returned,
          balance,
          commission_due,
          avatar_url,
          branch,
          created_at
        `)
        .order(sortBy as string, { ascending: sortOrder === 'asc' });

      if (error) throw error;

      const processedData = (data || []).map(d => ({
        ...d,
        phone: d.phone || 'مش متاح',
        city: d.city || 'مش محدد',
        total_delivered: d.total_delivered || 0,
        total_delayed: d.total_delayed || 0,
        total_returned: d.total_returned || 0,
        balance: d.balance || 0,
        commission_due: d.commission_due || 0,
        branch: d.branch || 'بدون فرع',
      }));

      setDelegates(processedData);
      toast({
        title: "تم التحميل",
        description: "تم تحميل بيانات المناديب بنجاح",
      });
    } catch (err: any) {
      console.error('Error fetching delegates:', err);
      const errorMessage = err.message || 'فشل تحميل بيانات المناديب. يرجى المحاولة مرة تانية.';
      setError(errorMessage);
      toast({
        title: "فشل التحميل",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && role && ['head_manager', 'manager'].includes(role as string)) {
      fetchDelegates();
    }
  }, [authLoading, role, sortBy, sortOrder]);

  // الحصول على المحافظات الفريدة
  const cities = [...new Set(delegates.map(d => d.city).filter(Boolean))];
  
  // الحصول على الفروع الفريدة
  const branches = [...new Set(
    delegates
      .map(d => d.branch?.trim() || 'بدون فرع')
      .filter(branch => branch && branch !== 'بدون فرع')
  )];

  // فلترة وترتيب
  const filteredDelegates = delegates
    .filter(delegate => {
      const matchesSearch = 
        delegate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delegate.phone.includes(searchTerm) ||
        delegate.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCity = cityFilter === 'all' || delegate.city === cityFilter;
      const matchesStatus = statusFilter === 'all' || delegate.status === statusFilter;
      const matchesBranch = branchFilter === 'all' || delegate.branch === branchFilter;
      
      return matchesSearch && matchesCity && matchesStatus && matchesBranch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'total_delivered') {
        return sortOrder === 'asc' 
          ? a.total_delivered - b.total_delivered 
          : b.total_delivered - a.total_delivered;
      } else if (sortBy === 'balance') {
        return sortOrder === 'asc' 
          ? a.balance - b.balance 
          : b.balance - a.balance;
      }
      return 0;
    });

  // إحصائيات
  const stats = {
    total: delegates.length,
    active: delegates.filter(d => d.status === 'active').length,
    totalDelivered: delegates.reduce((sum, d) => sum + d.total_delivered, 0),
    totalDelayed: delegates.reduce((sum, d) => sum + d.total_delayed, 0),
    totalReturned: delegates.reduce((sum, d) => sum + d.total_returned, 0),
    totalBalance: delegates.reduce((sum, d) => sum + d.balance, 0),
    avgDeliveryRate: delegates.length > 0
      ? Math.round(
          (delegates.reduce((sum, d) => {
            const total = d.total_delivered + d.total_delayed + d.total_returned;
            return sum + (total > 0 ? (d.total_delivered / total) * 100 : 0);
          }, 0) / delegates.length)
        )
      : 0,
  };

  // تصدير Excel
  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      const exportData = filteredDelegates.map(delegate => ({
        'اسم المندوب': delegate.name,
        'رقم التليفون': delegate.phone,
        'المحافظة': delegate.city,
        'الفرع': delegate.branch,
        'الحالة': statusConfig[delegate.status]?.label || delegate.status,
        'التسليمات': delegate.total_delivered,
        'المتأخر': delegate.total_delayed,
        'المرتجع': delegate.total_returned,
        'الرصيد': `${delegate.balance.toLocaleString()} ج.م`,
        'العمولة المستحقة': `${delegate.commission_due.toLocaleString()} ج.م`,
        'تاريخ الإنشاء': format(new Date(delegate.created_at), 'dd/MM/yyyy', { locale: ar }),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'المناديب');
      
      XLSX.writeFile(workbook, `مناديب_${format(new Date(), 'dd-MM-yyyy', { locale: ar })}.xlsx`);
      
      toast({
        title: "تم التصدير",
        description: "تم حفظ ملف Excel بنجاح"
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء إنشاء الملف",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // حذف مندوب
  const handleDeleteDelegate = async () => {
    if (!delegateToDelete) return;

    try {
      const { error } = await supabase
        .from('delegates')
        .delete()
        .eq('id', delegateToDelete);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف المندوب بنجاح"
      });

      fetchDelegates();
      setIsDeleteDialogOpen(false);
      setDelegateToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({
        title: "فشل الحذف",
        description: err.message || "حدث خطأ أثناء الحذف",
        variant: "destructive"
      });
    }
  };

  // حالة التحميل
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/20">
        <div className="text-center p-8 bg-card rounded-xl shadow-lg border border-border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">جاري تحميل بيانات المناديب...</p>
          <p className="text-sm text-muted-foreground mt-1">برجاء الانتظار</p>
        </div>
      </div>
    );
  }

  // حالة الخطأ
  if (error) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2 justify-center">
              <AlertCircle className="h-6 w-6" />
              خطأ في التحميل
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-6 text-lg max-w-2xl mx-auto">{error}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="destructive"
                className="gap-2 px-6 py-3"
              >
                <RefreshCcw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
              <Button 
                onClick={() => navigate('/app')} 
                variant="outline"
                className="gap-2 px-6 py-3"
              >
                <Truck className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            إدارة المناديب
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة كل مناديب التوصيل في النظام ({stats.total} مندوب)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={exportToExcel}
            variant="outline"
            disabled={isExporting || filteredDelegates.length === 0}
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
            onClick={() => navigate('/app/delegates/stats')}
            variant="outline"
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            إحصائيات الأداء
          </Button>
          <Button 
            onClick={() => navigate('/app/delegates/add')}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            إضافة مندوب جديد
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
                <li>المناديب النشطين فقط هم من يمكنهم استقبال شحنات جديدة</li>
                <li>يمكنك تصفية المناديب حسب المحافظة أو الفرع أو الحالة</li>
                <li>الرصيد الموضح هو المبلغ المستحق للمندوب عن الشحنات المسلمة</li>
                <li>يمكنك تعديل بيانات المندوب بالنقر على زر التعديل</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالى المناديب</p>
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
                <p className="text-sm text-muted-foreground">إجمالى التسليمات</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalDelivered.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">+{stats.totalDelayed} متأخر</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معدل التسليم</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgDeliveryRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">من {stats.totalReturned} مرتجع</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالى الرصيد</p>
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
      </div>

      {/* الفلاتر والبحث */}
      <Card className="rounded-xl shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-gray-800">
            <Filter className="h-4 w-4 text-primary" />
            فلترة وبحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم المندوب أو التليفون أو المحافظة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-10"
              />
            </div>
            
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full">
                <MapPin className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="اختر المحافظة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المحافظات</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={`city-${city}`} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <CheckCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">مش نشط</SelectItem>
                <SelectItem value="on_leave">فى إجازة</SelectItem>
                <SelectItem value="busy">مشغول</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full">
                <Award className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="اختر الفرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفروع</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={`branch-${branch}`} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
                {delegates.some(d => !d.branch || d.branch?.trim() === 'بدون فرع') && (
                  <SelectItem key="بدون-فرع" value="بدون فرع">
                    بدون فرع
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">ترتيب حسب:</span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as keyof Delegate)}>
                <SelectTrigger className="w-40 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_delivered">عدد التسليمات</SelectItem>
                  <SelectItem value="name">الاسم</SelectItem>
                  <SelectItem value="balance">الرصيد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="gap-1"
            >
              {sortOrder === 'asc' ? '↑ تصاعدي' : '↓ تنازلي'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setCityFilter('all');
                setStatusFilter('all');
                setBranchFilter('all');
                setSortBy('total_delivered');
                setSortOrder('desc');
              }}
              className="gap-1 text-sm"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول المناديب - الجزء المصحح بالكامل */}
      <Card className="rounded-xl shadow-sm border-border overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-gray-800">قائمة المناديب</CardTitle>
            <CardDescription className="text-sm">
              {filteredDelegates.length} من {delegates.length} مندوب
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDelegates}
              className="gap-1"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDelegates.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right w-16">الصورة</TableHead>
                    <TableHead className="text-right w-48">اسم المندوب</TableHead>
                    <TableHead className="text-right w-36">رقم التليفون</TableHead>
                    <TableHead className="text-right w-32">المحافظة</TableHead>
                    <TableHead className="text-right w-28">تم التسليم</TableHead>
                    <TableHead className="text-right w-24">متأخر</TableHead>
                    <TableHead className="text-right w-24">مرتجع</TableHead>
                    <TableHead className="text-right w-32">الرصيد</TableHead>
                    <TableHead className="text-right w-28">الحالة</TableHead>
                    <TableHead className="text-center w-40">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDelegates.map((delegate) => {
                    const total = delegate.total_delivered + delegate.total_delayed + delegate.total_returned;
                    const deliveryRate = total > 0 ? (delegate.total_delivered / total) * 100 : 0;
                    
                    // ✅ دوال آمنة للتنقل مع التحقق من صحة الـ ID
                    const handleRowClick = () => {
                      if (delegate.id && delegate.id !== 'undefined' && delegate.id !== 'null') {
                        navigate(`/app/delegate/${delegate.id}`);
                      } else {
                        toast({
                          title: "خطأ في البيانات",
                          description: "المندوب ده مش ليه رقم تعريفي صحيح. راجع البيانات في قاعدة البيانات.",
                          variant: "destructive"
                        });
                      }
                    };
                    
                    const handleViewDetails = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (delegate.id && delegate.id !== 'undefined' && delegate.id !== 'null') {
                        navigate(`/app/delegate/${delegate.id}`);
                      }
                    };
                    
                    const handleEdit = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (delegate.id && delegate.id !== 'undefined' && delegate.id !== 'null') {
                        navigate(`/app/delegate/${delegate.id}/edit`);
                      }
                    };
                    
                    const handleDelete = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (delegate.id && delegate.id !== 'undefined' && delegate.id !== 'null') {
                        setDelegateToDelete(delegate.id);
                        setIsDeleteDialogOpen(true);
                      }
                    };
                    
                    return (
                      <TableRow 
                        key={delegate.id || `delegate-${Math.random()}`} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={handleRowClick}
                      >
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={delegate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(delegate.name)}`} 
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                              {delegate.name.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-gray-900">{delegate.name || 'بدون اسم'}</p>
                            <p className="text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 inline-block mr-1" />
                              {delegate.branch || 'بدون فرع'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {delegate.phone || 'مش متاح'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className="px-2 py-0.5 bg-blue-50">
                            <MapPin className="h-3 w-3 inline-block mr-0.5" />
                            {delegate.city || 'مش محدد'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-bold text-green-600 text-center">
                              {delegate.total_delivered || 0}
                            </p>
                            <Progress 
                              value={Math.round(deliveryRate)}
                              className="h-2.5 rounded-full bg-green-100"
                              style={{ '--progress-bg': 'bg-green-600' } as React.CSSProperties}
                             
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-red-600 text-center">
                          {delegate.total_delayed || 0}
                        </TableCell>
                        <TableCell className="font-bold text-amber-600 text-center">
                          {delegate.total_returned || 0}
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="font-bold text-primary">
                              {Number(delegate.balance || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">ج.م</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={statusConfig[delegate.status]?.variant || "secondary"}
                            className={cn(
                              "px-3 py-1 text-xs font-medium rounded-full",
                              statusConfig[delegate.status]?.color || "bg-gray-100 text-gray-800"
                            )}
                          >
                            {statusConfig[delegate.status]?.label || 'مش معروف'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleEdit}
                              className="h-8 w-8 p-0 hover:bg-blue-100"
                              disabled={!delegate.id || delegate.id === 'undefined'}
                            >
                              <Edit className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleViewDetails}
                              className="h-8 w-8 p-0 hover:bg-green-100"
                              disabled={!delegate.id || delegate.id === 'undefined'}
                            >
                              <Eye className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleDelete}
                              className="h-8 w-8 p-0 hover:bg-red-100"
                              disabled={!delegate.id || delegate.id === 'undefined'}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground bg-muted/30">
              <div className="flex justify-center mb-4">
                <div className="bg-muted p-4 rounded-full">
                  <Truck className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xl font-medium mb-2">مفيش مناديب يطابقوا معايير البحث</p>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {searchTerm || cityFilter !== 'all' || statusFilter !== 'all' || branchFilter !== 'all'
                  ? 'جرب غير معايير البحث أو امسح الفلاتر عشان تشوف كل المناديب'
                  : 'مفيش مناديب مسجلين في النظام دلوقتي'}
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setCityFilter('all');
                    setStatusFilter('all');
                    setBranchFilter('all');
                  }}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  مسح الفلاتر
                </Button>
                <Button 
                  onClick={() => navigate('/app/delegates/add')}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  أضف مندوب جديد
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نصائح لإدارة المناديب */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/30 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-700" />
            نصائح لإدارة المناديب بفعالية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800">مراقبة الأداء</p>
              <p className="text-sm text-gray-700 mt-1">
                راقب معدل التسليم لكل مندوب وقم بتحفيز المناديب ذوي الأداء العالي
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800">التوزيع العادل</p>
              <p className="text-sm text-gray-700 mt-1">
                وزع الشحنات بشكل عادل بين المناديب بناءً على قدراتهم ومناطقهم
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-800 text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800">التحفيز والمكافآت</p>
              <p className="text-sm text-gray-700 mt-1">
                قم بمكافأة المناديب المتميزين لزيادة حماسهم وتحسين الأداء العام
              </p>
            </div>
          </div>
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
                <span className="font-medium">تنبيه هام:</span> سيتم حذف جميع بيانات هذا المندوب بشكل نهائي، 
                بما في ذلك سجل الشحنات والتقييمات. لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <p className="text-muted-foreground">
              هل أنت متأكد من حذف هذا المندوب؟
            </p>
          </div>
          <DialogFooter className="flex flex-row-reverse gap-2">
            <Button onClick={handleDeleteDelegate} variant="destructive" className="gap-2">
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

export default DelegatesManagement;