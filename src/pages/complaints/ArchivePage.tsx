/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ArchivePage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setComplaints([
        { id: '1', number: 'COMP-2025-100', type: 'شكوى عميل', customer: 'أحمد محمد', status: 'تم الحل', date: '2025-12-15', closedDate: '2025-12-20' },
        { id: '2', number: 'COMP-2025-099', type: 'شكوى تاجر', customer: 'شركة النور', status: 'تم الحل', date: '2025-12-10', closedDate: '2025-12-15' },
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
            <Archive className="h-7 w-7 text-primary" />
            أرشيف الشكاوى
          </h1>
          <p className="text-muted-foreground mt-1">عرض الشكاوى التي تم حلها وأرشفتها</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/complaints')}>
          العودة للشكاوى النشطة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>الشكاوى المؤرشفة</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث برقم الشكوى أو اسم العميل..."
                className="pl-4 pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الشكوى</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>العميل/التاجر</TableHead>
                <TableHead>حالة الحل</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>تاريخ الإغلاق</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow key={complaint.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono font-medium">{complaint.number}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {complaint.type}
                    </span>
                  </TableCell>
                  <TableCell>{complaint.customer}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {complaint.status}
                    </span>
                  </TableCell>
                  <TableCell>{complaint.date}</TableCell>
                  <TableCell>{complaint.closedDate}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">عرض التفاصيل</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchivePage;