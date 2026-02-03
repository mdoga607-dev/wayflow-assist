/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Search, Loader2, RefreshCcw, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Branch {
  id: string;
  name: string;
  governorate: string;
  city: string | null;
  opening_time: string | null;
  closing_time: string | null;
  status: string;
}

const BranchTimingsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    governorate: '',
    city: '',
    opening_time: '09:00',
    closing_time: '18:00'
  });

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast({
        title: 'خطأ في التحميل',
        description: error.message || 'فشل تحميل الفروع',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!newBranch.name || !newBranch.governorate) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم الفرع والمحافظة',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('branches')
        .insert({
          name: newBranch.name,
          governorate: newBranch.governorate,
          city: newBranch.city || null,
          opening_time: newBranch.opening_time,
          closing_time: newBranch.closing_time,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الفرع بنجاح'
      });

      setIsAddDialogOpen(false);
      setNewBranch({ name: '', governorate: '', city: '', opening_time: '09:00', closing_time: '18:00' });
      fetchBranches();
    } catch (error: any) {
      console.error('Error adding branch:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إضافة الفرع',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (branch: Branch) => {
    try {
      const newStatus = branch.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('branches')
        .update({ status: newStatus })
        .eq('id', branch.id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} الفرع`
      });

      fetchBranches();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل تغيير الحالة',
        variant: 'destructive'
      });
    }
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.governorate.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Clock className="h-7 w-7 text-primary" />
            تحديد الوقت للفروع
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة أوقات العمل لكل فرع في النظام ({branches.length} فرع)
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة فرع جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة فرع جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">اسم الفرع</Label>
                <Input
                  id="name"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="مثال: فرع القاهرة الرئيسي"
                />
              </div>
              <div>
                <Label htmlFor="governorate">المحافظة</Label>
                <Input
                  id="governorate"
                  value={newBranch.governorate}
                  onChange={(e) => setNewBranch({ ...newBranch, governorate: e.target.value })}
                  placeholder="مثال: القاهرة"
                />
              </div>
              <div>
                <Label htmlFor="city">المدينة</Label>
                <Input
                  id="city"
                  value={newBranch.city}
                  onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                  placeholder="مثال: مدينة نصر"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opening_time">وقت الافتتاح</Label>
                  <Input
                    id="opening_time"
                    type="time"
                    value={newBranch.opening_time}
                    onChange={(e) => setNewBranch({ ...newBranch, opening_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="closing_time">وقت الإغلاق</Label>
                  <Input
                    id="closing_time"
                    type="time"
                    value={newBranch.closing_time}
                    onChange={(e) => setNewBranch({ ...newBranch, closing_time: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddBranch} disabled={saving} className="w-full">
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
            <CardTitle>جداول أوقات الفروع</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث باسم الفرع..."
                  className="pl-4 pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchBranches}>
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
                  <TableHead>اسم الفرع</TableHead>
                  <TableHead>المحافظة</TableHead>
                  <TableHead>وقت الافتتاح</TableHead>
                  <TableHead>وقت الإغلاق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد فروع
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => (
                    <TableRow key={branch.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.governorate}</TableCell>
                      <TableCell className="font-mono font-medium">{branch.opening_time || '09:00'}</TableCell>
                      <TableCell className="font-mono font-medium">{branch.closing_time || '18:00'}</TableCell>
                      <TableCell>
                        <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                          {branch.status === 'active' ? 'نشط' : 'معطل'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 ml-1" />
                            تعديل
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleStatus(branch)}
                          >
                            {branch.status === 'active' ? 'تعطيل' : 'تفعيل'}
                          </Button>
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

export default BranchTimingsPage;