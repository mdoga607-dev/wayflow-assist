import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, Store, Phone, Mail, MapPin, Package, Wallet, Building, User } from "lucide-react";

interface Shipper {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  branch: string | null;
  total_shipments: number;
  balance: number;
  status: string;
}

const ShippersManagement = () => {
  const { isHeadManager } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingShipper, setEditingShipper] = useState<Shipper | null>(null);
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", address: "", city: "", branch: "", status: "active",
  });

  const { data: shippers = [], isLoading } = useQuery({
    queryKey: ["shippers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shippers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Shipper[];
    },
  });

  const handleSubmit = async () => {
    if (!formData.name) return toast({ title: "الاسم مطلوب", variant: "destructive" });

    if (editingShipper) {
      const { error } = await supabase.from("shippers").update(formData).eq("id", editingShipper.id);
      if (!error) {
        toast({ title: "تم التحديث" });
        setEditingShipper(null);
      }
    } else {
      const { error } = await supabase.from("shippers").insert([formData]);
      if (!error) {
        toast({ title: "تمت الإضافة" });
        setIsAddDialogOpen(false);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["shippers"] });
  };

  if (!isHeadManager) return <div className="p-10 text-center">غير مصرح لك بالوصول</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة التجار</h1>
        <Button onClick={() => { setFormData({ name: "", phone: "", email: "", address: "", city: "", branch: "", status: "active" }); setIsAddDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" /> إضافة تاجر
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
            <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                    className="pr-10" 
                    placeholder="بحث عن تاجر..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>التاجر</TableHead>
            <TableHead>الهاتف</TableHead>
            <TableHead>الرصيد</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>العمليات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shippers.filter(s => s.name.includes(searchQuery)).map((shipper) => (
            <TableRow key={shipper.id}>
              <TableCell className="font-medium">{shipper.name}</TableCell>
              <TableCell>{shipper.phone}</TableCell>
              <TableCell>{shipper.balance} ج.م</TableCell>
              <TableCell><Badge>{shipper.status}</Badge></TableCell>
              <TableCell>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingShipper(shipper); setFormData(shipper); }}> <Edit className="h-4 w-4" /> </Button>
                    <Button variant="ghost" size="sm" className="text-red-500"> <Trash2 className="h-4 w-4" /> </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialogs for Add/Edit here... */}
    </div>
  );
};

export default ShippersManagement;