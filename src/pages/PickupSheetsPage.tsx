// src/pages/PickupSheetsPage.tsx
import { useState, useEffect } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Package, 
  Plus, 
  RefreshCcw, 
  Loader2, 
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PickupSheet {
  sheet_id: string;
  sheet_name: string;
  created_at: string;
  status: string;
  delegate_name: string | null;
  delegate_phone: string | null;
  store_name: string | null;
  total_shipments: number;
  pending_count: number;
  delivered_count: number;
  total_cod: number;
  total_shipping_fee: number;
}

const PickupSheetsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [sheets, setSheets] = useState<PickupSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager', 'courier'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب شيتات البيك أب
  const fetchSheets = async () => {
    try {
      setLoading(true);
      
      const { data: sheetsData, error } = await supabase
        .from('pickup_sheets_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // تطبيق التصفية حسب الحالة
      let filteredSheets = sheetsData || [];
      if (filterStatus === 'active') {
        filteredSheets = filteredSheets.filter(s => s.status === 'active');
      } else if (filterStatus === 'completed') {
        filteredSheets = filteredSheets.filter(s => s.status === 'completed');
      }
      
      setSheets(filteredSheets);
    } catch (error) {
      console.error('Error fetching pickup sheets:', error);
      toast({
        title: "فشل التحميل",
        description: "حدث خطأ أثناء تحميل شيتات البيك أب",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, [filterStatus]);

  const handleRefresh = () => {
    fetchSheets();
  };

  const handleViewSheet = (sheetId: string) => {
    navigate(`/app/sheets/${sheetId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">نشط</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">ملغى</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">غير معروف</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري تحميل شيتات البيك أب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Truck className="h-7 w-7 text-primary" />
            شيتات البيك أب
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة جميع شيتات استلام الشحنات من التجار
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
          <Button 
            onClick={() => navigate('/app/sheets/create-pickup')}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            إنشاء شيت بيك أب جديد
          </Button>
        </div>
      </div>

      {/* عوامل التصفية */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
          className="gap-1"
        >
          الكل ({sheets.length})
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('active')}
          className="gap-1"
        >
          النشطة ({sheets.filter(s => s.status === 'active').length})
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('completed')}
          className="gap-1"
        >
          المكتملة ({sheets.filter(s => s.status === 'completed').length})
        </Button>
      </div>

      {/* جدول الشيتات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة شيتات البيك أب ({sheets.length})</CardTitle>
          <CardDescription>
            عرض جميع شيتات استلام الشحنات مع ملخص للشحنات المرتبطة بكل شيت
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sheets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">لا توجد شيتات بيك أب</p>
              <p className="max-w-md mx-auto">
                يمكنك إنشاء شيت بيك أب جديد بالنقر على زر "إنشاء شيت بيك أب جديد" أعلاه
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate('/app/sheets/create-pickup')}>
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء شيت بيك أب جديد
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>اسم الشيت</TableHead>
                    <TableHead>المندوب</TableHead>
                    <TableHead>الفرع</TableHead>
                    <TableHead>الشحنات</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheets.map((sheet) => (
                    <TableRow key={sheet.sheet_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium max-w-xs truncate">
                        {sheet.sheet_name}
                      </TableCell>
                      <TableCell>
                        {sheet.delegate_name ? (
                          <div>
                            <div>{sheet.delegate_name}</div>
                            <div className="text-xs text-muted-foreground">{sheet.delegate_phone}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">غير محدد</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sheet.store_name || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span>{sheet.total_shipments}</span>
                          {sheet.pending_count > 0 && (
                            <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                              {sheet.pending_count} معلقة
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {sheet.total_cod.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>{getStatusBadge(sheet.status)}</TableCell>
                      <TableCell>
                        {format(new Date(sheet.created_at), 'PPP HH:mm', { locale: ar })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSheet(sheet.sheet_id)}
                        >
                          <Eye className="h-4 w-4" />
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

      {/* دليل الاستخدام */}
      <Card className="mt-6 bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-primary" />
            دليل استخدام شيتات البيك أب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">إنشاء شيت بيك أب</p>
              <p className="text-sm text-muted-foreground mt-1">
                اختر الشحنات المطلوب استلامها والمندوب المسؤول، وسيتم إنشاء شيت تلقائياً
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">متابعة الشيت</p>
              <p className="text-sm text-muted-foreground mt-1">
                يمكن تتبع حالة الشيت ومعرفة عدد الشحنات المستلمة مقابل المعلقة
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">إكمال الشيت</p>
              <p className="text-sm text-muted-foreground mt-1">
                بعد استلام جميع الشحنات، يقوم المندوب بتحديث حالة الشيت إلى "مكتمل"
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium">تقارير الأداء</p>
              <p className="text-sm text-muted-foreground mt-1">
                يمكن عرض تقارير أداء المناديب بناءً على عدد الشيتات المكتملة ووقت الإنجاز
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickupSheetsPage;