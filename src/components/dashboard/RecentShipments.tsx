import { Eye, MoreVertical, Package, Loader2, FileSpreadsheet, Trash2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRecentShipments } from "@/hooks/useRecentShipments";
import { Link } from "react-router-dom";
import { useRef } from "react";
import * as XLSX from 'xlsx';

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
  returned: "مرتجع",
};

const RecentShipments = () => {
  const { data: shipments, isLoading, error } = useRecentShipments(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. وظيفة رفع ومعالجة ملف الإكسيل ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        console.log("البيانات المرفوعة:", data);
        alert(`تم قراءة ${data.length} صف من ملف الإكسيل بنجاح`);
        // هنا يمكنك إرسال الداتا للـ API الخاص بك
      } catch (err) {
        alert("خطأ في قراءة ملف الإكسيل");
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- 2. وظيفة تصفير البيانات ---
  const handleResetData = () => {
    const confirmReset = window.confirm("⚠️ تحذير: هل أنت متأكد من تصفير وحذف جميع البيانات؟ لا يمكن التراجع!");
    if (confirmReset) {
      console.log("يتم الآن تصفير جميع العدادات والبيانات...");
      // أضف هنا استدعاء الـ API الخاص بمسح قاعدة البيانات
      alert("تم تصفير البيانات بنجاح");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">آخر الشحنات</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">آخر الشحنات</h3>
        </div>
        <p className="text-destructive text-center py-8">خطأ في تحميل البيانات</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {/* الرأس (Header) يحتوي على العنوان والأزرار الجديدة */}
      <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <h3 className="text-lg font-semibold">آخر الشحنات</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* زر تصفير البيانات */}
          <Button 
            variant="ghost" 
            size="sm"
            className="text-destructive hover:bg-destructive/10 gap-2"
            onClick={handleResetData}
          >
            <Trash2 className="h-4 w-4" />
            تصفير البيانات
          </Button>

          {/* مدخل ملف الإكسيل المخفي */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            className="hidden"
            aria-label="رفع ملف إكسيل"
          />
          
          {/* زر رفع الإكسيل الظاهري */}
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 border-green-600 text-green-600 hover:bg-green-50 shadow-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="h-4 w-4" />
            رفع إكسيل
          </Button>

          <Link to="/shipments">
            <Button variant="outline" size="sm">
              عرض الكل
            </Button>
          </Link>
        </div>
      </div>
      
      {shipments && shipments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-muted/50 text-right">
                <th className="p-4">رقم التتبع</th>
                <th className="p-4">المستلم</th>
                <th className="p-4">الهاتف</th>
                <th className="p-4">المدينة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">المبلغ</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment, index) => (
                <tr 
                  key={shipment.id} 
                  className="border-b border-border hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-4 font-medium text-primary">#{shipment.tracking_number}</td>
                  <td className="p-4">{shipment.recipient_name}</td>
                  <td className="p-4" dir="ltr">{shipment.recipient_phone}</td>
                  <td className="p-4">{shipment.recipient_city || "-"}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "status-badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        `status-${shipment.status || 'pending'}`
                      )}
                    >
                      {statusLabels[shipment.status || 'pending'] || shipment.status}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">{shipment.cod_amount || 0} ر.س</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/track/${shipment.tracking_number}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-right">
                          <DropdownMenuItem>تعديل الشحنة</DropdownMenuItem>
                          <DropdownMenuItem>طباعة البوليصة</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive font-medium">
                            حذف الشحنة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد شحنات متاحة حالياً</p>
          <Link to="/add-shipment">
            <Button className="mt-4" variant="outline">
              إضافة أول شحنة
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentShipments;