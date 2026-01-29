/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';
import { useSheets } from '@/hooks/useSheets';
import SheetsTable from '@/components/ship/SheetsTable';
import { toast } from '@/hooks/use-toast';

const SheetsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, loading: authLoading } = useAuth();
  const { sheets, loading, error, fetchSheets, deleteSheet, exportSheetToExcel } = useSheets();
  const [activeTab, setActiveTab] = useState('courier');

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // جلب البيانات عند تغيير التبويب
  useEffect(() => {
    const tab = searchParams.get('sheet_type') || 'courier';
    setActiveTab(tab);
    fetchSheets(tab);
  }, [searchParams]);

  const handleDeleteSheet = async (sheetId: string) => {
    const result = await deleteSheet(sheetId);
    if (result.success) {
      toast({ title: "تم الحذف", description: "تم حذف الشيت بنجاح" });
    } else {
      toast({ 
        title: "فشل الحذف", 
        description: result.error || "حدث خطأ أثناء حذف الشيت",
        variant: "destructive"
      });
    }
  };

  const handlePrintSheet = (sheetId: string) => {
    toast({ title: "قيد التنفيذ", description: "ميزة طباعة الشيت قيد التطوير" });
  };

  const handleExportSheet = async (sheetId: string) => {
    const result = await exportSheetToExcel(sheetId);
    if (!result.success) {
      toast({ 
        title: "فشل التصدير", 
        description: result.error || "حدث خطأ أثناء تصدير الشيت",
        variant: "destructive"
      });
    }
  };

  const handleCreateSheet = () => {
    toast({ title: "قيد التطوير", description: "ميزة إنشاء شيت جديد قيد التطوير" });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            إدارة الشيتات
          </h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة شيتات المناديب والمرتجعات والبيك أب
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleCreateSheet}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            إنشاء شيت جديد
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => fetchSheets(activeTab)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger 
            value="courier" 
            onClick={() => navigate('/sheets?sheet_type=courier')}
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            شيتات المناديب
          </TabsTrigger>
          <TabsTrigger 
            value="pickup" 
            onClick={() => navigate('/sheets?sheet_type=pickup')}
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            شيتات البيك أب
          </TabsTrigger>
          <TabsTrigger 
            value="returned" 
            onClick={() => navigate('/sheets?sheet_type=returned')}
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            شيتات المرتجعات
          </TabsTrigger>
          <TabsTrigger 
            value="travel" 
            onClick={() => navigate('/sheets?sheet_type=travel')}
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            شيتات السفر
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courier">
          <SheetsTable 
            sheets={sheets} 
            loading={loading} 
            onDelete={handleDeleteSheet}
            onPrint={handlePrintSheet}
            onExport={handleExportSheet}
          />
        </TabsContent>
        
        <TabsContent value="pickup">
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">شيتات البيك أب (قيد التطوير)</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="returned">
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">شيتات المرتجعات (قيد التطوير)</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="travel">
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">شيتات السفر (قيد التطوير)</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* رسالة خطأ */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      )}
    </div>
  );
};

export default SheetsPage;