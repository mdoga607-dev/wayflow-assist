/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Search, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const AreasPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAreas([
        { 
          id: '1', 
          name: 'الرياض - الشمال', 
          governorate: 'الرياض', 
          coverage: '95%', 
          couriers: 18, 
          status: 'نشط' 
        },
        { 
          id: '2', 
          name: 'الرياض - الجنوب', 
          governorate: 'الرياض', 
          coverage: '92%', 
          couriers: 15, 
          status: 'نشط' 
        },
        { 
          id: '3', 
          name: 'جدة - المركز', 
          governorate: 'مكة', 
          coverage: '98%', 
          couriers: 22, 
          status: 'نشط' 
        },
        { 
          id: '4', 
          name: 'الدمام - الشمال', 
          governorate: 'الشرقية', 
          coverage: '89%', 
          couriers: 12, 
          status: 'تحت التطوير' 
        },
      ]);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

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
            <MapPin className="h-7 w-7 text-primary" />
            إدارة المناطق
          </h1>
          <p className="text-muted-foreground mt-1">عرض وإدارة المناطق الجغرافية للتغطية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/app/areas/governorates')}>
            <Layers className="h-4 w-4 ml-2" />
            إدارة المحافظات
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة منطقة جديدة
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة المناطق</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم المنطقة أو المحافظة..."
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
                  <TableHead>اسم المنطقة</TableHead>
                  <TableHead>المحافظة</TableHead>
                  <TableHead>معدل التغطية</TableHead>
                  <TableHead>عدد المناديب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.governorate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        parseInt(area.coverage) >= 95
                          ? 'bg-green-100 text-green-800'
                          : parseInt(area.coverage) >= 90
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {area.coverage}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{area.couriers}</TableCell>
                    <TableCell>
                      <Badge variant={area.status === 'نشط' ? 'default' : 'secondary'}>
                        {area.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">تعديل</Button>
                        <Button variant="outline" size="sm">تفاصيل</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AreasPage;