import { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  FileText, Printer, Trash2, Eye, Plus, Download, FileSpreadsheet 
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

  const handleExport = (sheetId: string) => {
    onExport(sheetId);
    toast({ title: "قيد التنفيذ", description: "ميزة التصدير قيد التطوير" });
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">جاري تحميل الشيتات...</p>
      </Card>
    );
  }

  if (sheets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">لا توجد شيتات حالياً</p>
        <Button 
          variant="outline" 
          className="mt-4 gap-2"
          onClick={() => toast({ title: "قيد التطوير", description: "ميزة إنشاء شيت جديد قيد التطوير" })}
        >
          <Plus className="h-4 w-4" /> إنشاء شيت جديد
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الشيت</TableHead>
                <TableHead>المندوب</TableHead>
                <TableHead>عدد الشحنات</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheets.map((sheet) => (
                <TableRow key={sheet.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{sheet.name}</TableCell>
                  <TableCell>
                    {sheet.delegate?.name} 
                    {sheet.delegate?.phone && (
                      <span className="text-muted-foreground block text-xs mt-1">
                        {sheet.delegate.phone}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {sheet.shipments_count || 0}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(sheet.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewDetails(sheet.id)}
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        onClick={() => onPrint(sheet.id)}
                        title="طباعة"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => handleExport(sheet.id)}
                        title="تصدير"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا الشيت؟ سيتم فصل الشحنات المرتبطة به.')) {
                            onDelete(sheet.id);
                          }
                        }}
                        title="حذف"
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