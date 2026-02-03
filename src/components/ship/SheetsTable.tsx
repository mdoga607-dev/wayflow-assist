import { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  FileText, Printer, Trash2, Eye, Plus, FileSpreadsheet 
} from "lucide-react";
import { Sheet as SheetType } from "@/hooks/useSheets";
import SheetDetailsModal from "./SheetDetailsModal";
import { toast } from "@/hooks/use-toast";

interface SheetsTableProps {
  sheets: SheetType[];
  loading: boolean;
  onDelete: (sheetId: string) => void;
  onPrint: (sheetId: string) => void;
  onExport: (sheetId: string) => void;
}

const SheetsTable = ({ sheets, loading, onDelete, onPrint, onExport }: SheetsTableProps) => {
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleViewDetails = (sheetId: string) => {
    setSelectedSheetId(sheetId);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">جاري تحميل البيانات...</p>
      </Card>
    );
  }

  if (sheets.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">لا توجد شيتات حالياً في هذا القسم</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden border-t-4 border-t-primary">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">اسم الشيت</TableHead>
                <TableHead className="text-right">المندوب / المتجر</TableHead>
                <TableHead className="text-right">عدد الشحنات</TableHead>
                <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheets.map((sheet) => (
                <TableRow key={sheet.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-primary">{sheet.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{sheet.delegate?.name || sheet.store?.name || "غير محدد"}</span>
                      {sheet.delegate?.phone && (
                        <span className="text-xs text-muted-foreground">{sheet.delegate.phone}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                      {sheet.shipments_count || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(sheet.created_at).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => handleViewDetails(sheet.id)}
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        onClick={() => onPrint(sheet.id)}
                        title="طباعة"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف الشيت؟')) onDelete(sheet.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selectedSheetId && (
        <SheetDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          sheetId={selectedSheetId}
        />
      )}
    </>
  );
};

export default SheetsTable;