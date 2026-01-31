/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const CampaignsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCampaigns([
        { id: '1', name: 'عرض خاص يناير', type: 'تسويق', messages: 1250, status: 'مكتملة', date: '2026-01-15' },
        { id: '2', name: 'تذكير بالدفع', type: 'تذكير', messages: 850, status: 'قيد التنفيذ', date: '2026-01-25' },
        { id: '3', name: 'عرض جديد فبراير', type: 'تسويق', messages: 2000, status: 'مجدولة', date: '2026-02-01' },
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
            <MessageCircle className="h-7 w-7 text-primary" />
            حملات الواتساب
          </h1>
          <p className="text-muted-foreground mt-1">إدارة حملات التسويق عبر الواتساب</p>
        </div>
        <Button onClick={() => navigate('/app/whatsapp/add-campaign')}>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء حملة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة الحملات</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم الحملة أو النوع..."
                className="pl-4 pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الحملة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>عدد الرسائل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.type === 'تسويق' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {campaign.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{campaign.messages.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'مكتملة' 
                        ? 'bg-green-100 text-green-800' 
                        : campaign.status === 'قيد التنفيذ'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </TableCell>
                  <TableCell>{campaign.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">عرض التفاصيل</Button>
                      <Button variant="outline" size="sm">إحصائيات</Button>
                    </div>
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

export default CampaignsPage;