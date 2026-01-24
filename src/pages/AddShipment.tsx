import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Upload, MapPin, Package, User, Phone, FileText } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

const AddShipment = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: "تم إضافة الشحنة بنجاح",
      description: "تم إنشاء الشحنة الجديدة وإرسالها للمندوب",
    });
    
    setIsSubmitting(false);
    navigate("/shipments");
  };

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
          <p className="text-muted-foreground">أدخل بيانات الشحنة الجديدة</p>
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
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone1">رقم الهاتف 1 *</Label>
              <Input
                id="phone1"
                type="tel"
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone2">رقم الهاتف 2</Label>
              <Input
                id="phone2"
                type="tel"
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">المدينة *</Label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="riyadh">الرياض</SelectItem>
                <SelectItem value="jeddah">جدة</SelectItem>
                <SelectItem value="dammam">الدمام</SelectItem>
                <SelectItem value="makkah">مكة</SelectItem>
                <SelectItem value="madinah">المدينة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان التفصيلي *</Label>
            <div className="relative">
              <Textarea
                id="address"
                placeholder="الحي، الشارع، رقم المبنى، معلومات إضافية..."
                rows={3}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute left-2 bottom-2 gap-1"
              >
                <MapPin className="h-4 w-4" />
                تحديد الموقع
              </Button>
            </div>
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
                defaultValue="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">الوزن (كجم)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="0.0"
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentType">طريقة الدفع *</Label>
              <Select required>
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
            <Label htmlFor="delegate">المندوب</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="اختر المندوب (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ahmed">أحمد محمد</SelectItem>
                <SelectItem value="khalid">خالد سعيد</SelectItem>
                <SelectItem value="omar">عمر علي</SelectItem>
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
          </div>
        </div>

        {/* Actions */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">ملخص الشحنة</h2>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">رسوم الشحن</span>
                <span>25 ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الضريبة</span>
                <span>3.75 ر.س</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>الإجمالي</span>
                  <span className="text-primary">28.75 ر.س</span>
                </div>
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
              className="flex-1 bg-accent hover:bg-accent/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ الشحنة"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddShipment;
