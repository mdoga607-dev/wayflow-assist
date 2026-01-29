// src/pages/AddShipment.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, Upload, MapPin, Package, User, Phone, FileText, 
  Loader2, AlertCircle 
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
  const { data: shippers, isLoading: loadingShippers } = useShippers();
  const { data: delegates, isLoading: loadingDelegates } = useDelegates();
  const createShipment = useCreateShipment();

  // حالة الموقع المحدد من الخريطة
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

  // معالجة اختيار الموقع من الخريطة
  const handleMapSelect = (address: string, lat: number, lng: number, city: string, area: string) => {
    setSelectedLocation({ address, lat, lng, city, area });
    setFormData(prev => ({
      ...prev,
      address,
      city,
      area
    }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // إذا تم تغيير الحقل يدويًا، نمسح اختيار الخريطة
    if (field === 'address' || field === 'city' || field === 'area') {
      setSelectedLocation({ address: '', lat: 0, lng: 0, city: '', area: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من تحديد الموقع على الخريطة
    if (!selectedLocation.address || selectedLocation.lat === 0) {
      toast({ 
        title: "خطأ", 
        description: "يرجى تحديد الموقع على الخريطة بدقة", 
        variant: "destructive" 
      });
      return;
    }
    
    // التحقق من الحقول المطلوبة
    if (!formData.recipient_name.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم المستلم", variant: "destructive" });
      return;
    }
    
    if (!formData.phone1.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال رقم الهاتف", variant: "destructive" });
      return;
    }
    
    if (!formData.product_name.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال وصف المنتجات", variant: "destructive" });
      return;
    }

    try {
      await createShipment.mutateAsync({
        recipient_name: formData.recipient_name,
        recipient_phone: formData.phone1,
        recipient_city: selectedLocation.city || formData.city || "غير معروف",
        recipient_address: selectedLocation.address,
        recipient_area: selectedLocation.area || formData.area || "",
        product_name: formData.product_name,
        cod_amount: parseFloat(formData.cod_amount) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 25,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        notes: formData.notes || undefined,
        shipper_id: formData.shipper_id || undefined,
        delegate_id: formData.delegate_id || undefined,
      });
      
      toast({ 
        title: "تمت الإضافة بنجاح", 
        description: "تم إضافة الشحنة بنجاح" 
      });
      
      // إعادة تعيين النموذج
      setFormData({
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
      setSelectedLocation({ address: '', lat: 0, lng: 0, city: '', area: '' });
      
      navigate("/shipments");
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({ 
        title: "فشل الإضافة", 
        description: "حدث خطأ أثناء إضافة الشحنة. يرجى المحاولة مرة أخرى", 
        variant: "destructive" 
      });
    }
  };

  const shippingFee = parseFloat(formData.shipping_fee) || 25;
  const tax = shippingFee * 0.15;
  const total = shippingFee + tax;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إضافة شحنة جديدة</h1>
          <p className="text-muted-foreground">أدخل بيانات الشحنة الجديدة مع تحديد الموقع على خريطة مصر</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-4">
          <div className="flex items-center gap-2 text-primary mb-4">
            <User className="h-5 w-5" />
            <h2 className="text-lg font-semibold">بيانات المستلم</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">اسم المستلم *</Label>
            <Input
              id="customerName"
              placeholder="أدخل اسم المستلم"
              value={formData.recipient_name}
              onChange={(e) => handleChange("recipient_name", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone1">رقم الهاتف 1 *</Label>
              <Input
                id="phone1"
                type="tel"
                placeholder="010xxxxxxxx"
                dir="ltr"
                className="text-right"
                value={formData.phone1}
                onChange={(e) => handleChange("phone1", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone2">رقم الهاتف 2</Label>
              <Input
                id="phone2"
                type="tel"
                placeholder="010xxxxxxxx"
                dir="ltr"
                className="text-right"
                value={formData.phone2}
                onChange={(e) => handleChange("phone2", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">المدينة *</Label>
            <Select 
              value={formData.city} 
              onValueChange={(value) => handleChange("city", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="القاهرة">القاهرة</SelectItem>
                <SelectItem value="الجيزة">الجيزة</SelectItem>
                <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
                <SelectItem value="القليوبية">القليوبية</SelectItem>
                <SelectItem value="الشرقية">الشرقية</SelectItem>
                <SelectItem value="الدقهلية">الدقهلية</SelectItem>
                <SelectItem value="الغربية">الغربية</SelectItem>
                <SelectItem value="كفر الشيخ">كفر الشيخ</SelectItem>
                <SelectItem value="المنوفية">المنوفية</SelectItem>
                <SelectItem value="البحيرة">البحيرة</SelectItem>
                <SelectItem value="بني سويف">بني سويف</SelectItem>
                <SelectItem value="الفيوم">الفيوم</SelectItem>
                <SelectItem value="المنيا">المنيا</SelectItem>
                <SelectItem value="أسيوط">أسيوط</SelectItem>
                <SelectItem value="سوهاج">سوهاج</SelectItem>
                <SelectItem value="قنا">قنا</SelectItem>
                <SelectItem value="أسوان">أسوان</SelectItem>
                <SelectItem value="الأقصر">الأقصر</SelectItem>
                <SelectItem value="البحر الأحمر">البحر الأحمر</SelectItem>
                <SelectItem value="الوادي الجديد">الوادي الجديد</SelectItem>
                <SelectItem value="مطروح">مطروح</SelectItem>
                <SelectItem value="شمال سيناء">شمال سيناء</SelectItem>
                <SelectItem value="جنوب سيناء">جنوب سيناء</SelectItem>
                <SelectItem value="دمياط">دمياط</SelectItem>
                <SelectItem value="بورسعيد">بورسعيد</SelectItem>
                <SelectItem value="الإسماعيلية">الإسماعيلية</SelectItem>
                <SelectItem value="السويس">السويس</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* حقل العنوان مع الخريطة المجانية - تم إزالة التكرار */}
          <div className="space-y-2">
            <Label htmlFor="address">حدد الموقع على الخريطة *</Label>
            <MapSelector 
              onLocationSelect={handleMapSelect}
              initialLocation={
                selectedLocation.lat !== 0 ? 
                  { lat: selectedLocation.lat, lng: selectedLocation.lng } : 
                  undefined
              }
            />
            
            {selectedLocation.address && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">✓ تم تحديد العنوان:</p>
                    <p className="text-sm text-green-700 mt-1 break-words">{selectedLocation.address}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        المدينة: {selectedLocation.city || formData.city || "غير معروف"}
                      </span>
                      {selectedLocation.area && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          المنطقة: {selectedLocation.area}
                        </span>
                      )}
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!selectedLocation.address && (
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-700">
                    ⚠️ انقر على الخريطة أو ابحث عن عنوان مصري لتحديد الموقع (مثل: وسط القاهرة)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shipment Details */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-4">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Package className="h-5 w-5" />
            <h2 className="text-lg font-semibold">تفاصيل الشحنة</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="products">وصف المنتجات *</Label>
            <Textarea
              id="products"
              placeholder="اكتب وصف المنتجات المشحونة..."
              rows={3}
              value={formData.product_name}
              onChange={(e) => handleChange("product_name", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">الوزن (كجم)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="0.0"
                value={formData.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (ر.س) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="0"
                value={formData.cod_amount}
                onChange={(e) => handleChange("cod_amount", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentType">طريقة الدفع *</Label>
              <Select 
                value={formData.payment_type}
                onValueChange={(value) => handleChange("payment_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">الدفع عند الاستلام</SelectItem>
                  <SelectItem value="prepaid">مدفوع مسبقاً</SelectItem>
                  <SelectItem value="partial">دفع جزئي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipper">التاجر</Label>
            <Select 
              value={formData.shipper_id}
              onValueChange={(value) => handleChange("shipper_id", value)}
              disabled={loadingShippers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingShippers ? "جاري التحميل..." : "اختر التاجر (اختياري)"} />
              </SelectTrigger>
              <SelectContent>
                {loadingShippers ? (
                  <SelectItem value="loading">جاري التحميل...</SelectItem>
                ) : shippers && shippers.length > 0 ? (
                  shippers.map((shipper) => (
                    <SelectItem key={shipper.id} value={shipper.id}>
                      {shipper.name} {shipper.city && `- ${shipper.city}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-shippers">لا توجد تجار</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delegate">المندوب</Label>
            <Select 
              value={formData.delegate_id}
              onValueChange={(value) => handleChange("delegate_id", value)}
              disabled={loadingDelegates}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingDelegates ? "جاري التحميل..." : "اختر المندوب (اختياري)"} />
              </SelectTrigger>
              <SelectContent>
                {loadingDelegates ? (
                  <SelectItem value="loading">جاري التحميل...</SelectItem>
                ) : delegates && delegates.length > 0 ? (
                  delegates.map((delegate) => (
                    <SelectItem key={delegate.id} value={delegate.id}>
                      {delegate.name} {delegate.city && `- ${delegate.city}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-delegates">لا توجد مناديب</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes & Attachments */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-4">
          <div className="flex items-center gap-2 text-primary mb-4">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">ملاحظات ومرفقات</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              placeholder="أي ملاحظات إضافية للمندوب..."
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>رفع ملف</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                اسحب الملفات هنا أو{" "}
                <span className="text-primary font-medium">تصفح</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, Excel, صور (حد أقصى 10MB)
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ ملاحظة: رفع الملفات غير مفعل حالياً. سيتم تفعيله في التحديث القادم
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">ملخص الشحنة</h2>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">رسوم الشحن</span>
                <span>{shippingFee.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الضريبة (15%)</span>
                <span>{tax.toFixed(2)} ر.س</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>الإجمالي</span>
                  <span className="text-primary">{total.toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  💡 تلميح: يمكنك تحديد الموقع بدقة عن طريق:
                  <br />1. البحث عن العنوان في شريط البحث
                  <br />2. النقر على الموقع المطلوب على الخريطة
                  <br />3. سحب العلامة (Marker) لضبط الموقع بدقة
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={createShipment.isPending || !selectedLocation.address}
            >
              {createShipment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ الشحنة"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddShipment;