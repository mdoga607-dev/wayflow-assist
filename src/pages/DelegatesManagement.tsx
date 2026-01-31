// src/pages/DelegatesManagement.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Plus, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Delegate {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: string;
  total_delivered: number;
  total_delayed: number;
}

const DelegatesManagement = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchDelegates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('delegates')
          .select('id, name, phone, city, status, total_delivered, total_delayed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDelegates(data || []);
      } catch (err) {
        console.error('Error fetching delegates:', err);
        toast({
          title: "فشل التحميل",
          description: "حدث خطأ أثناء تحميل قائمة المناديب",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDelegates();
  }, []);

  const filteredDelegates = delegates.filter(delegate =>
    delegate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delegate.phone.includes(searchTerm) ||
    delegate.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-7 w-7 text-primary" />
            إدارة المناديب
          </h1>
          <p className="text-muted-foreground mt-1">عرض وإدارة جميع مناديب التوصيل في النظام</p>
        </div>
        <Button onClick={() => navigate('/app/delegates/add')}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مندوب جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة المناديب</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم المندوب أو الهاتف أو المدينة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المندوب</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>الشحنات المسلمة</TableHead>
                  <TableHead>المتأخرة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDelegates.map((delegate) => (
                  <TableRow key={delegate.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{delegate.name}</TableCell>
                    <TableCell dir="ltr" className="font-mono">{delegate.phone}</TableCell>
                    <TableCell>{delegate.city}</TableCell>
                    <TableCell className="font-bold text-green-600">{delegate.total_delivered}</TableCell>
                    <TableCell className="font-bold text-yellow-600">{delegate.total_delayed}</TableCell>
                    <TableCell>
                      <Badge variant={delegate.status === 'active' ? 'default' : 'secondary'}>
                        {delegate.status === 'active' ? 'نشط' : 
                         delegate.status === 'inactive' ? 'غير نشط' : 'في إجازة'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {/* ✅ الحل الصحيح: استخدام Link مع asChild */}
                      <Link to={`/app/delegate/${delegate.id}`} asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 ml-1" />
                          عرض التفاصيل
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredDelegates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">لا توجد مناديب تطابق معايير البحث</p>
              <p className="mt-2">يرجى تعديل الفلاتر أو إضافة مندوب جديد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// دالة مساعدة للإشعارات (إذا لم تكن موجودة)
const toast = ({ title, description, variant }: { 
  title: string; 
  description?: string; 
  variant?: 'default' | 'destructive' 
}) => {
  console.log(`${variant === 'destructive' ? '❌' : '✅'} ${title}${description ? `: ${description}` : ''}`);
};

export default DelegatesManagement;