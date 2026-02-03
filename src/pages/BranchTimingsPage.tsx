/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/BranchTimingsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Building2, CheckCircle, AlertCircle } from 'lucide-react';

const BranchTimingsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [timings, setTimings] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // جلب أوقات الفروع
        const { data: timingsData, error: timingsError } = await supabase
          .from('branch_timings')
          .select(`
            *,
            store:store_id (name)
          `)
          .order('store_id');

        if (timingsError) throw timingsError;
        
        // جلب المتاجر
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, name')
          .eq('status', 'active');

        if (storesError) throw storesError;
        
        setTimings(timingsData || []);
        setStores(storesData || []);
      } catch (err) {
        console.error('Error fetching timings:', err);
        alert('فشل تحميل أوقات الفروع. تأكد من وجود جدول branch_timings في قاعدة البيانات.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ترجمة أيام الأسبوع
  const getDayName = (dayIndex: number) => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayIndex] || '';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري تحميل أوقات الفروع...</p>
        </div>
      </div>
    );
  }

  // تنظيم البيانات حسب الفرع
  const timingsByStore = stores.map(store => ({
    store,
    days: timings.filter(t => t.store_id === store.id)
  }));

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            أوقات عمل الفروع
          </h1>
          <p className="text-muted-foreground mt-1">
            جدول أوقات العمل الرسمية لجميع فروع الشركة
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/stores')}>
          <Building2 className="h-4 w-4 ml-2" />
          إدارة الفروع
        </Button>
      </div>

      <div className="grid gap-6">
        {timingsByStore.map(({ store, days }) => (
          <Card key={store.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                {store.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اليوم</TableHead>
                      <TableHead>وقت الافتتاح</TableHead>
                      <TableHead>وقت الإغلاق</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 7 }, (_, i) => {
                      const dayTiming = days.find(d => d.day_of_week === i);
                      const isClosed = dayTiming?.is_closed || false;
                      
                      return (
                        <TableRow key={i} className={isClosed ? 'bg-muted/30' : ''}>
                          <TableCell className="font-medium">{getDayName(i)}</TableCell>
                          <TableCell>
                            {isClosed ? (
                              <Badge variant="destructive">مغلق</Badge>
                            ) : (
                              dayTiming?.open_time || '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {isClosed ? (
                              <Badge variant="destructive">مغلق</Badge>
                            ) : (
                              dayTiming?.close_time || '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {isClosed ? (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 ml-1" />
                                يوم إجازة
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 ml-1" />
                                يعمل
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">أوقات العمل القياسية</p>
              <p className="text-sm text-muted-foreground mt-1">
                السبت إلى الأربعاء: 9:00 ص - 9:00 م | الخميس: 10:00 ص - 10:00 م | الجمعة: 10:00 ص - 6:00 م
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">تعديل الأوقات</p>
              <p className="text-sm text-muted-foreground mt-1">
                يمكن تعديل أوقات العمل لكل فرع من خلال لوحة تحكم المدير العام
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">الإجازات الرسمية</p>
              <p className="text-sm text-muted-foreground mt-1">
                يتم إغلاق جميع الفروع في الإجازات الرسمية ويتم الإعلان عنها مسبقاً
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchTimingsPage;