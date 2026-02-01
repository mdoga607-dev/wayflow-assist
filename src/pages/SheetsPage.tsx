// src/pages/SheetsPage.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Eye, Truck, AlertCircle, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Sheet {
  id: string;
  name: string;
  sheet_type: string;
  created_at: string;
  status: string;
  delegate?: {
    name: string;
    phone: string;
  } | null;
  store?: {
    name: string;
  } | null;
}

const sheetTypeLabels: Record<string, string> = {
  courier: 'شيت مناديب',
  returned: 'شيت مرتجعات',
  pickup: 'شيت بيك أب',
  travel: 'شيت سفر',
  returned_travel: 'شيت مرتجعات سفر'
};

const sheetTypeColors: Record<string, string> = {
  courier: 'bg-blue-100 text-blue-800',
  returned: 'bg-red-100 text-red-800',
  pickup: 'bg-green-100 text-green-800',
  travel: 'bg-purple-100 text-purple-800',
  returned_travel: 'bg-orange-100 text-orange-800'
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
};

const SheetsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sheetType = searchParams.get('sheet_type') || 'courier';
  
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        setLoading(true);
        setError(null);

        const validTypes = ['courier', 'returned', 'pickup', 'travel', 'returned_travel'];
        if (!validTypes.includes(sheetType)) {
          throw new Error(`نوع الشيت غير صالح: ${sheetType}`);
        }

        // ✅ الحل الصحيح: استخدام الصيغة الصحيحة للـ join بدون !inner
        const { data, error } = await supabase
          .from('sheets')
          .select(`
            *,
            delegate:delegate_id (name, phone),
            store:store_id (name)
          `)
          .eq('sheet_type', sheetType)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase Error:', error);
          throw error;
        }
        
        setSheets(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'فشل تحميل الشيتات';
        setError(errorMessage);
        console.error('Error fetching sheets:', err);
        
        toast({
          title: "فشل التحميل",
          description: "حدث خطأ أثناء تحميل الشيتات. تأكد من وجود جدول sheets في قاعدة البيانات.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSheets();
  }, [sheetType]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري تحميل {sheetTypeLabels[sheetType] || 'الشيتات'}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">خطأ في تحميل الصفحة</CardTitle>
            <p className="text-muted-foreground mt-2">{error}</p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/app/sheets?sheet_type=courier')}
            >
              العودة لشيتات المناديب
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            {sheetTypeLabels[sheetType] || 'شيتات الشحنات'}
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة {sheetTypeLabels[sheetType] || 'الشيتات'} في النظام
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            رجوع
          </Button>
          <Button 
            onClick={() => navigate(`/app/sheets/add?sheet_type=${sheetType}`)}
            disabled
          >
            <Plus className="h-4 w-4 ml-2" />
            إنشاء شيت جديد
          </Button>
        </div>
      </div>

      {sheets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-24 w-24 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد شيتات من نوع "{sheetTypeLabels[sheetType]}"</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              ⚠️ <strong>ملاحظة هامة:</strong> تم إدخال بيانات تجريبية في قاعدة البيانات. 
              إذا لم تظهر البيانات، يرجى تحديث الصفحة أو التحقق من اتصال قاعدة البيانات.
            </p>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="h-4 w-4 ml-2" />
                تحديث الصفحة
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/app/sheets?sheet_type=courier')}
              >
                عرض شيتات المناديب
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/app/sheets?sheet_type=pickup')}
              >
                عرض شيتات البيك أب
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>قائمة {sheetTypeLabels[sheetType]} ({sheets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الشيت</TableHead>
                    <TableHead>المندوب</TableHead>
                    <TableHead>الفرع</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheets.map((sheet) => (
                    <TableRow key={sheet.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{sheet.name}</TableCell>
                      <TableCell>
                        {sheet.delegate ? (
                          <div>
                            <p>{sheet.delegate.name}</p>
                            <p className="text-xs text-muted-foreground">{sheet.delegate.phone}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sheet.store?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(sheet.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={sheetTypeColors[sheet.sheet_type]}>
                          {sheetTypeLabels[sheet.sheet_type] || sheet.sheet_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[sheet.status]}>
                          {sheet.status === 'active' ? 'نشط' : 
                           sheet.status === 'completed' ? 'مكتمل' : 'ملغى'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm"
                        >
                          <a href={`/app/sheets/${sheet.id}`}>
                            <Eye className="h-3 w-3 ml-1" />
                            عرض التفاصيل
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(sheetTypeLabels).map(([type, label]) => (
              <Button
                key={type}
                variant={sheetType === type ? "default" : "outline"}
                onClick={() => navigate(`/app/sheets?sheet_type=${type}`)}
                className={sheetType === type ? "bg-primary hover:bg-primary/90" : ""}
              >
                {label}
                {sheetType === type && (
                  <Truck className="h-3 w-3 mr-1 animate-pulse" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SheetsPage;