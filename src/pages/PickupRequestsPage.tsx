// src/pages/PickupRequestsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, Plus, RefreshCcw, Package, MapPin, Clock, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PickupRequest {
  id: string;
  shipper: {
    name: string;
    phone: string;
  };
  delegate?: {
    name: string;
  } | null;
  pickup_address: string;
  pickup_time: string;
  status: string;
  created_at: string;
}

const PickupRequestsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('pickup_requests')
          .select(`
            *,
            shipper:shipper_id (name, phone),
            delegate:delegate_id (name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching pickup requests:', err);
        toast({
          title: "فشل التحميل",
          description: "حدث خطأ أثناء تحميل طلبات البيك أب",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري تحميل طلبات البيك أب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            طلبات البيك أب
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض جميع طلبات استلام الشحنات من التجار
          </p>
        </div>
        <Button 
          onClick={() => navigate('/app/pickup-requests/add')}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          إضافة طلب بيك أب جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة طلبات البيك أب ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">لا توجد طلبات بيك أب حالية</p>
              <p className="max-w-md mx-auto">
                يمكنك إضافة طلب بيك أب جديد بالنقر على زر "إضافة طلب بيك أب جديد" أعلاه
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاجر</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>عنوان الاستلام</TableHead>
                    <TableHead>المندوب</TableHead>
                    <TableHead>وقت الاستلام</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{request.shipper.name}</TableCell>
                      <TableCell dir="ltr" className="font-mono">{request.shipper.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{request.pickup_address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.delegate?.name || (
                          <span className="text-muted-foreground">لم يُعيّن بعد</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {new Date(request.pickup_time).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === 'pending' ? 'outline' :
                          request.status === 'assigned' ? 'secondary' :
                          request.status === 'picked' ? 'default' : 'destructive'
                        }>
                          {request.status === 'pending' && 'قيد الانتظار'}
                          {request.status === 'assigned' && 'تم التعيين'}
                          {request.status === 'picked' && 'تم الاستلام'}
                          {request.status === 'cancelled' && 'ملغى'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/app/pickup-requests/${request.id}`)}
                        >
                          <Package className="h-3 w-3 ml-1" />
                          عرض التفاصيل
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
    </div>
  );
};

export default PickupRequestsPage;