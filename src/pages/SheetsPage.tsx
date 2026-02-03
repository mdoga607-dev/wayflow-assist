import { useSearchParams } from "react-router-dom";
import { useSheets } from "@/hooks/useSheets";
import SheetsTable from "./../components/ship/SheetsTable";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SheetsPage = () => {
  const [searchParams] = useSearchParams();
  // التأكد من جلب النوع بدون علامات استفهام
  const type = searchParams.get("sheet_type") || "";

  const { sheets, loading, error } = useSheets(type);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mr-2">جاري مزامنة البيانات...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {type === "courier" ? "شيتات المناديب" : 
           type === "pickup" ? "شيتات البيك أب" : "إدارة الشيتات"}
        </h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>خطأ في قاعدة البيانات</AlertTitle>
          <AlertDescription>
            الجدول "sheets" قد لا يكون موجوداً أو لا تملك صلاحية الوصول إليه. 
            تأكد من تنفيذ كود SQL وتهيئة الـ Schema.
          </AlertDescription>
        </Alert>
      )}

      <SheetsTable 
        sheets={sheets} 
        loading={loading} 
        onDelete={() => {}} 
        onPrint={() => window.print()} 
        onExport={() => {}} 
      />
    </div>
  );
};

export default SheetsPage;