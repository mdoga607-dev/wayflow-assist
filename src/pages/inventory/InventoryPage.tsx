/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Plus, Search, RefreshCcw, Loader2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Inventory {
  id: string;
  name: string;
  branch_id: string | null;
  store_id: string | null;
  delegate_id: string | null;
  total_items: number;
  counted_items: number;
  discrepancy: number;
  status: string;
  notes: string | null;
  inventory_date: string;
  created_at: string;
}

interface Branch {
  id: string;
  name: string;
}

const InventoryPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newInventory, setNewInventory] = useState({
    name: '',
    branch_id: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    fetchInventory();
    fetchBranches();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'خطأ في التحميل',
        description: error.message || 'فشل تحميل عمليات الجرد',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleAddInventory = async () => {
    if (!newInventory.name) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم عملية الجرد',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('inventory')
        .insert({
          name: newInventory.name,
          branch_id: newInventory.branch_id || null,
          notes: newInventory.notes || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة عملية الجرد بنجاح'
      });

      setIsAddDialogOpen(false);
      setNewInventory({ name: '', branch_id: '', notes: '' });
      fetchInventory();
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إضافة عملية الجرد',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'مجدول';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Database className="h-7 w-7 text-primary" />
            عمليات جرد الشحنات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة وتسجيل عمليات الجرد الدورية للشحنات في الفروع ({inventory.length} عملية)
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              بدء جرد جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عملية جرد جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">اسم عملية الجرد</Label>
                <Input
                  id="name"
                  value={newInventory.name}
                  onChange={(e) => setNewInventory({ ...newInventory, name: e.target.value })}
                  placeholder="مثال: جرد يناير 2026"
                />
              </div>
              <div>
                <Label htmlFor="branch">الفرع</Label>
                <Select
                  value={newInventory.branch_id}
                  onValueChange={(value) => setNewInventory({ ...newInventory, branch_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  value={newInventory.notes}
                  onChange={(e) => setNewInventory({ ...newInventory, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
              <Button onClick={handleAddInventory} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>سجل عمليات الجرد</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالاسم..."
                  className="pl-4 pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchInventory}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الجرد</TableHead>
                  <TableHead>تاريخ الجرد</TableHead>
                  <TableHead>عدد الشحنات</TableHead>
                  <TableHead>تم عدّها</TableHead>
                  <TableHead>الاختلاف</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد عمليات جرد
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono">{item.inventory_date}</TableCell>
                      <TableCell className="font-medium">{item.total_items.toLocaleString()}</TableCell>
                      <TableCell>{item.counted_items.toLocaleString()}</TableCell>
                      <TableCell className={item.discrepancy !== 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                        {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(item.status) as any}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 ml-1" />
                            عرض التفاصيل
                          </Button>
                          {item.status === 'pending' && (
                            <Button variant="outline" size="sm">بدء الجرد</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryPage;