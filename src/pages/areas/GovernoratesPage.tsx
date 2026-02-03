/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Search, Loader2, Edit, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Governorate {
  id: string;
  name: string;
  name_en: string | null;
  code: string | null;
  shipping_fee: number;
  delivery_days: number;
  status: string;
  created_at: string;
  areas_count?: number;
}

const GovernoratesPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    fetchGovernorates();
  }, []);

  const fetchGovernorates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('governorates')
        .select('*')
        .order('name');

      if (error) throw error;

      // حساب عدد المناطق لكل محافظة
      const governoratesWithCounts = await Promise.all(
        (data || []).map(async (gov) => {
          const { count } = await supabase
            .from('areas')
            .select('*', { count: 'exact', head: true })
            .eq('governorate_id', gov.id);
          return { ...gov, areas_count: count || 0 };
        })
      );

      setGovernorates(governoratesWithCounts);
    } catch (error: any) {
      console.error('Error fetching governorates:', error);
      toast({
        title: 'خطأ في التحميل',
        description: error.message || 'فشل تحميل المحافظات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGovernorates = governorates.filter(gov => 
    gov.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gov.code && gov.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (gov.name_en && gov.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
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
            <Layers className="h-7 w-7 text-primary" />
            إدارة المحافظات
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة محافظات التغطية الجغرافية ({governorates.length} محافظة)
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة محافظة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة المحافظات</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم المحافظة أو الكود..."
                className="pl-4 pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المحافظة</TableHead>
                <TableHead>الاسم بالإنجليزي</TableHead>
                <TableHead>كود المحافظة</TableHead>
                <TableHead>رسوم الشحن</TableHead>
                <TableHead>أيام التوصيل</TableHead>
                <TableHead>عدد المناطق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGovernorates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد محافظات
                  </TableCell>
                </TableRow>
              ) : (
                filteredGovernorates.map((gov) => (
                  <TableRow key={gov.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{gov.name}</TableCell>
                    <TableCell className="text-muted-foreground">{gov.name_en || '-'}</TableCell>
                    <TableCell className="font-mono font-medium text-primary">{gov.code || '-'}</TableCell>
                    <TableCell>{gov.shipping_fee.toLocaleString()} ج.م</TableCell>
                    <TableCell>{gov.delivery_days} يوم</TableCell>
                    <TableCell>{gov.areas_count || 0} منطقة</TableCell>
                    <TableCell>
                      <Badge variant={gov.status === 'active' ? 'default' : 'secondary'}>
                        {gov.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 ml-1" />
                          تعديل
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/app/areas?governorate=${gov.id}`)}>
                          <Eye className="h-3 w-3 ml-1" />
                          المناطق
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovernoratesPage;