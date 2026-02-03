/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, Upload, MapPin, Package, User, Phone, FileText, 
  Loader2, AlertCircle, PlusCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShippers } from "@/hooks/useShippers";
import { useDelegates } from "@/hooks/useDelegates";
import { useCreateShipment } from "@/hooks/useCreateShipment";
import { MapSelector } from '@/components/ui/MapSelector';
import { toast } from "@/hooks/use-toast";

const AddShipment = () => {
  const navigate = useNavigate();
  const { shippers, loading: loadingShippers } = useShippers();
  const { delegates, loading: loadingDelegates } = useDelegates();
  const createShipment = useCreateShipment();

  const [selectedLocation, setSelectedLocation] = useState({
    address: '',
    lat: 0,
    lng: 0,
    city: '',
    area: ''
  });

  const [formData, setFormData] = useState({
    recipient_name: "",
    phone1: "",
    phone2: "",
    city: "",
    address: "",
    area: "",
    product_name: "",
    quantity: "1",
    weight: "",
    cod_amount: "",
    payment_type: "cod",
    shipping_fee: "25",
    shipper_id: "",
    delegate_id: "",
    notes: "",
  });

  // تحديث المدينة تلقائياً عند اختيار موقع من الخريطة يحتوي على "بنها" أو غيرها
  const handleMapSelect = (address: string, lat: number, lng: number, city: string, area: string) => {
    setSelectedLocation({ address, lat, lng, city, area });
    
    // محاولة مطابقة المدينة المرجعة من الخريطة مع قائمة المدن لدينا
    setFormData(prev => ({
      ...prev,
      address,
      city: city || prev.city,
      area: area || prev.area
    }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation.address || selectedLocation.lat === 0) {
      toast({ title: "الموقع مطلوب", description: "يرجى تحديد مكان التسليم على الخريطة", variant: "destructive" });
      return;
    }

    try {
      await createShipment.mutateAsync({
        recipient_name: formData.recipient_name,
        recipient_phone: formData.phone1,
        recipient_city: formData.city || selectedLocation.city,
        recipient_address: selectedLocation.address,
        recipient_area: formData.area || selectedLocation.area,
        product_name: formData.product_name,
        cod_amount: parseFloat(formData.cod_amount) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        notes: formData.notes || undefined,
        shipper_id: formData.shipper_id || undefined,
        delegate_id: formData.delegate_id || undefined,
      });
      
      toast({ title: "تم الحفظ", description: "تمت إضافة الشحنة بنجاح" });
      navigate("/shipments");
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="container pb-20 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
               <PlusCircle className="h-5 w-5 text-primary" />
               إضافة شحنة جديدة
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right Column: Customer & Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <User className="h-5 w-5 text-primary" /> بيانات المستلم
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المستلم *</Label>
                <Input 
                  value={formData.recipient_name} 
                  onChange={(e) => handleChange("recipient_name", e.target.value)}
                  placeholder="الاسم الثلاثي"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف الأساسي *</Label>
                <Input 
                  type="tel"
                  value={formData.phone1} 
                  onChange={(e) => handleChange("phone1", e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="text-left font-mono"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-orange-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" /> تحديد الموقع (ابحث عن "بنها" أو "القاهرة"...)
              </Label>
              <MapSelector onLocationSelect={handleMapSelect} />
              {selectedLocation.address && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                  <strong>العنوان المختار:</strong> {selectedLocation.address}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <Package className="h-5 w-5 text-primary" /> تفاصيل الطرد
            </h2>
            <div className="space-y-2">
              <Label>محتوى الشحنة *</Label>
              <Textarea 
                value={formData.product_name} 
                onChange={(e) => handleChange("product_name", e.target.value)}
                placeholder="مثال: ملابس، أدوات منزلية..."
                required 
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-2">
                  <Label>المبلغ (COD)</Label>
                  <Input type="number" value={formData.cod_amount} onChange={(e)=>handleChange("cod_amount", e.target.value)} />
               </div>
               <div className="space-y-2">
                  <Label>رسوم الشحن</Label>
                  <Input type="number" value={formData.shipping_fee} onChange={(e)=>handleChange("shipping_fee", e.target.value)} />
               </div>
               <div className="space-y-2">
                  <Label>الوزن</Label>
                  <Input type="number" value={formData.weight} onChange={(e)=>handleChange("weight", e.target.value)} placeholder="0.5" />
               </div>
            </div>
          </div>
        </div>

        {/* Left Column: Assignment & Summary */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border space-y-4 text-right">
             <h2 className="text-lg font-semibold border-b pb-2">التوجيه</h2>
             
             <div className="space-y-2">
                <Label>التاجر (الراسل)</Label>
                <Select value={formData.shipper_id} onValueChange={(v)=>handleChange("shipper_id", v)}>
                  <SelectTrigger><SelectValue placeholder="اختر التاجر" /></SelectTrigger>
                  <SelectContent>
                    {shippers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>

             <div className="space-y-2 pt-2">
                <Label>تكليف مندوب</Label>
                <Select value={formData.delegate_id} onValueChange={(v)=>handleChange("delegate_id", v)}>
                  <SelectTrigger><SelectValue placeholder="اختر المندوب" /></SelectTrigger>
                  <SelectContent>
                    {delegates?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
          </div>

          <div className="bg-primary text-primary-foreground rounded-xl p-6 shadow-lg space-y-4">
             <h2 className="text-xl font-bold text-center">ملخص الحساب</h2>
             <div className="space-y-2 border-t border-primary-foreground/20 pt-4">
                <div className="flex justify-between">
                   <span>صافي الطرد:</span>
                   <span>{formData.cod_amount || 0} ج.م</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-primary-foreground/40">
                   <span>الإجمالي المطلوب:</span>
                   <span>{(Number(formData.cod_amount) + Number(formData.shipping_fee)) || 0} ج.م</span>
                </div>
             </div>
             <Button 
                type="submit" 
                className="w-full bg-white text-primary hover:bg-gray-100 font-bold text-lg"
                disabled={createShipment.isPending}
             >
                {createShipment.isPending ? <Loader2 className="animate-spin" /> : "تأكيد وإضافة الشحنة"}
             </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddShipment;