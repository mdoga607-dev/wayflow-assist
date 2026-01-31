/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Package, Search, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const PrintShipmentsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [printSettings, setPrintSettings] = useState({
    paperSize: 'a6',
    copies: 1,
    includeBarcode: true,
    includeLogo: true,
    showPrices: false,
  });

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShipments([
        { 
          id: '1', 
          tracking: 'TRK123456', 
          recipient: 'أحمد محمد', 
          area: 'الرياض - الشمال', 
          cod: 245, 
          status: 'قيد الانتظار' 
        },
        { 
          id: '2', 
          tracking: 'TRK123457', 
          recipient: 'خالد عبدالله', 
          area: 'الرياض - الجنوب', 
          cod: 180, 
          status: 'قيد الانتظار' 
        },
        { 
          id: '3', 
          tracking: 'TRK123458', 
          recipient: 'محمد سعيد', 
          area: 'جدة - المركز', 
          cod: 320, 
          status: 'قيد الانتظار' 
        },
      ]);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    if (selectedShipments.length === 0) {
      toast({ 
        title: "خطأ", 
        description: "يرجى اختيار شحنة واحدة على الأقل للطباعة", 
        variant: "destructive" 
      });
      return;
    }

    toast({ 
      title: "تم إرسال الطباعة", 
      description: `جارٍ طباعة ${selectedShipments.length} بوليصة شحن` 
    });
    
    // هنا يمكنك إضافة منطق الطباعة الفعلي
    console.log('طباعة الشحنات:', selectedShipments, printSettings);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(shipments.map(s => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

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
            <Printer className="h-7 w-7 text-primary" />
            طباعة الشحنات
          </h1>
          <p className="text-muted-foreground mt-1">اختر الشحنات وحدد إعدادات الطباعة</p>
        </div>
        <Button onClick={handlePrint} disabled={selectedShipments.length === 0}>
          <Printer className="h-4 w-4 ml-2" />
          طباعة البوليصات المحددة ({selectedShipments.length})
        </Button>
      </div>

      {/* Print Settings */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الطباعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paperSize">حجم الورق</Label>
              <Select 
                value={printSettings.paperSize} 
                onValueChange={(value) => setPrintSettings({ ...printSettings, paperSize: value })}
              >
                <SelectTrigger id="paperSize">
                  <SelectValue placeholder="اختر حجم الورق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 (طبيعي)</SelectItem>
                  <SelectItem value="a5">A5 (صغير)</SelectItem>
                  <SelectItem value="a6">A6 (مصغّر - موصى به)</SelectItem>
                  <SelectItem value="thermal">طابعة حرارية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copies">عدد النسخ</Label>
              <Select 
                value={printSettings.copies.toString()} 
                onValueChange={(value) => setPrintSettings({ ...printSettings, copies: parseInt(value) })}
              >
                <SelectTrigger id="copies">
                  <SelectValue placeholder="اختر العدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">نسخة واحدة</SelectItem>
                  <SelectItem value="2">نسختان</SelectItem>
                  <SelectItem value="3">3 نسخ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الخيارات الإضافية</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="barcode" 
                    checked={printSettings.includeBarcode} 
                    onCheckedChange={(checked) => setPrintSettings({ ...printSettings, includeBarcode: checked as boolean })}
                  />
                  <Label htmlFor="barcode">تضمين الباركود</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="logo" 
                    checked={printSettings.includeLogo} 
                    onCheckedChange={(checked) => setPrintSettings({ ...printSettings, includeLogo: checked as boolean })}
                  />
                  <Label htmlFor="logo">تضمين الشعار</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="prices" 
                    checked={printSettings.showPrices} 
                    onCheckedChange={(checked) => setPrintSettings({ ...printSettings, showPrices: checked as boolean })}
                  />
                  <Label htmlFor="prices">إظهار الأسعار</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 ml-2" />
                تصدير كـ PDF
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setPrintSettings({
                paperSize: 'a6',
                copies: 1,
                includeBarcode: true,
                includeLogo: true,
                showPrices: false,
              })}>
                إعادة الضبط
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>اختر الشحنات للطباعة</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث برقم البوليصة أو اسم المستلم..."
                  className="pl-4 pr-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedShipments.length === shipments.length && shipments.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>رقم البوليصة</TableHead>
                  <TableHead>اسم المستلم</TableHead>
                  <TableHead>المنطقة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox 
                        checked={selectedShipments.includes(shipment.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedShipments([...selectedShipments, shipment.id]);
                          } else {
                            setSelectedShipments(selectedShipments.filter(id => id !== shipment.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono font-medium">{shipment.tracking}</TableCell>
                    <TableCell className="font-medium">{shipment.recipient}</TableCell>
                    <TableCell>{shipment.area}</TableCell>
                    <TableCell className="font-medium text-green-600">{shipment.cod} ر.س</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{shipment.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {selectedShipments.length} شحنة محددة للطباعة • 
                  الإجمالي: {selectedShipments.reduce((sum, id) => {
                    const shipment = shipments.find(s => s.id === id);
                    return sum + (shipment?.cod || 0);
                  }, 0).toLocaleString()} ر.س
                </span>
              </div>
              <Button onClick={handlePrint} disabled={selectedShipments.length === 0} size="lg">
                <Printer className="h-4 w-4 ml-2" />
                طباعة ({selectedShipments.length}) بوليصة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrintShipmentsPage;