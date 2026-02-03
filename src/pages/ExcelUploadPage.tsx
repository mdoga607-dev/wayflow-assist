/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ExcelUploadPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, 
  XCircle, Loader2, FileText, Package, Truck, Database 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ShipmentRow {
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: string;
  recipient_area?: string;
  cod_amount: number;
  product_name?: string;
  weight?: number;
  notes?: string;
  status?: string;
  errors?: string[];
}

const ExcelUploadPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ShipmentRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  // معالجة اختيار الملف
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // التحقق من نوع الملف
    if (!selectedFile.name.toLowerCase().endsWith('.xlsx') && 
        !selectedFile.name.toLowerCase().endsWith('.xls')) {
      toast({
        title: "خطأ في نوع الملف",
        description: "يرجى اختيار ملف Excel صالح ( بصيغة .xlsx أو .xls)",
        variant: "destructive",
      });
      return;
    }

    // التحقق من الحجم (الحد الأقصى 10 ميجابايت)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "خطأ في الحجم",
        description: "حجم الملف يجب ألا يتجاوز 10 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setPreviewData([]);
    setValidationErrors([]);
    setUploadResults(null);
    parseExcelFile(selectedFile);
  };

  // تحليل ملف Excel
  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // تحويل إلى مصفوفة من الكائنات
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('الملف فارغ أو لا يحتوي على بيانات');
        }

        // استخراج رؤوس الأعمدة من الصف الأول
        const headers = jsonData[0] as string[];
        const requiredHeaders = [
          'رقم التتبع', 'اسم المستلم', 'رقم الهاتف', 'العنوان', 'المدينة', 'المبلغ'
        ];

        // التحقق من وجود الأعمدة المطلوبة
        const missingHeaders = requiredHeaders.filter(h => !headers.some(col => 
          col?.toString().trim().includes(h)
        ));

        if (missingHeaders.length > 0) {
          throw new Error(`الأعمدة التالية مفقودة: ${missingHeaders.join(', ')}`);
        }

        // تحويل البيانات إلى كائنات
        const shipments: ShipmentRow[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          // إنشاء كائن الشحنة
          const shipment: ShipmentRow = {
            tracking_number: '',
            recipient_name: '',
            recipient_phone: '',
            recipient_address: '',
            recipient_city: '',
            cod_amount: 0,
            errors: []
          };

          // تعيين القيم بناءً على رؤوس الأعمدة
          headers.forEach((header, index) => {
            const value = row[index];
            const headerStr = header?.toString().trim();

            if (!headerStr) return;

            if (headerStr.includes('رقم التتبع') || headerStr.includes('Tracking')) {
              shipment.tracking_number = value?.toString().trim() || '';
            } else if (headerStr.includes('اسم المستلم') || headerStr.includes('Recipient Name')) {
              shipment.recipient_name = value?.toString().trim() || '';
            } else if (headerStr.includes('رقم الهاتف') || headerStr.includes('Phone')) {
              shipment.recipient_phone = value?.toString().trim() || '';
            } else if (headerStr.includes('العنوان') || headerStr.includes('Address')) {
              shipment.recipient_address = value?.toString().trim() || '';
            } else if (headerStr.includes('المدينة') || headerStr.includes('City')) {
              shipment.recipient_city = value?.toString().trim() || '';
            } else if (headerStr.includes('المنطقة') || headerStr.includes('Area')) {
              shipment.recipient_area = value?.toString().trim() || '';
            } else if (headerStr.includes('المبلغ') || headerStr.includes('Amount')) {
              shipment.cod_amount = parseFloat(value) || 0;
            } else if (headerStr.includes('المنتج') || headerStr.includes('Product')) {
              shipment.product_name = value?.toString().trim() || '';
            } else if (headerStr.includes('الوزن') || headerStr.includes('Weight')) {
              shipment.weight = parseFloat(value) || undefined;
            } else if (headerStr.includes('الملاحظات') || headerStr.includes('Notes')) {
              shipment.notes = value?.toString().trim() || '';
            }
          });

          // التحقق من صحة البيانات
          if (!shipment.tracking_number) {
            shipment.errors?.push('رقم التتبع مطلوب');
          }
          if (!shipment.recipient_name) {
            shipment.errors?.push('اسم المستلم مطلوب');
          }
          if (!shipment.recipient_phone) {
            shipment.errors?.push('رقم الهاتف مطلوب');
          } else if (!/^01[0-9]{9}$/.test(shipment.recipient_phone)) {
            shipment.errors?.push('رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)');
          }
          if (!shipment.recipient_address) {
            shipment.errors?.push('العنوان مطلوب');
          }
          if (!shipment.recipient_city) {
            shipment.errors?.push('المدينة مطلوبة');
          }
          if (shipment.cod_amount < 0) {
            shipment.errors?.push('المبلغ يجب أن يكون أكبر من أو يساوي صفر');
          }

          // إضافة الشحنة إذا كانت تحتوي على أخطاء أو بدون أخطاء
          shipments.push(shipment);

          // جمع الأخطاء العامة
          if (shipment.errors && shipment.errors.length > 0) {
            errors.push(`الصف ${i + 1}: ${shipment.errors.join(', ')}`);
          }
        }

        setPreviewData(shipments);
        setValidationErrors(errors);

        if (errors.length > 0) {
          toast({
            title: "تم اكتشاف أخطاء",
            description: `تم العثور على ${errors.length} خطأ في البيانات. يرجى مراجعة الجدول أدناه.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "تم تحليل الملف بنجاح",
            description: `جاهز لرفع ${shipments.length} شحنة`,
          });
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        const errorMessage = error instanceof Error ? error.message : 'فشل تحليل ملف Excel';
        toast({
          title: "فشل تحليل الملف",
          description: errorMessage,
          variant: "destructive",
        });
        setValidationErrors([errorMessage]);
      }
    };

    reader.onerror = () => {
      toast({
        title: "فشل قراءة الملف",
        description: "حدث خطأ أثناء قراءة ملف Excel",
        variant: "destructive",
      });
    };

    reader.readAsArrayBuffer(file);
  };

  // رفع البيانات إلى قاعدة البيانات
  const handleUpload = async () => {
    if (previewData.length === 0 || validationErrors.length > 0) {
      toast({
        title: "لا يمكن الرفع",
        description: "يرجى تصحيح جميع الأخطاء قبل الرفع",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadResults(null);

    try {
      const validShipments = previewData.filter(s => !s.errors || s.errors.length === 0);
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // رفع الشحنات واحدة تلو الأخرى مع تحديث التقدم
      for (let i = 0; i < validShipments.length; i++) {
        const shipment = validShipments[i];
        
        try {
          // إنشاء رقم تتبع فريد إذا لم يكن موجوداً
          const trackingNumber = shipment.tracking_number || `EG-${Date.now()}-${i}`;
          
          const { error } = await supabase
            .from('shipments')
            .insert([{
              tracking_number: trackingNumber,
              recipient_name: shipment.recipient_name,
              recipient_phone: shipment.recipient_phone,
              recipient_address: shipment.recipient_address,
              recipient_city: shipment.recipient_city,
              recipient_area: shipment.recipient_area || null,
              cod_amount: shipment.cod_amount,
              product_name: shipment.product_name || null,
              weight: shipment.weight || null,
              notes: shipment.notes || null,
              status: shipment.status || 'pending',
              created_at: new Date().toISOString()
            }]);

          if (error) {
            throw error;
          }
          successCount++;
        } catch (err) {
          failedCount++;
          const errorMsg = err instanceof Error ? err.message : `فشل رفع الشحنة ${shipment.tracking_number}`;
          errors.push(`الشحنة ${shipment.tracking_number}: ${errorMsg}`);
        }

        // تحديث شريط التقدم
        const currentProgress = Math.round(((i + 1) / validShipments.length) * 100);
        setProgress(currentProgress);
      }

      setUploadResults({
        success: successCount,
        failed: failedCount,
        errors
      });

      if (successCount > 0) {
        toast({
          title: "تم الرفع بنجاح",
          description: `تم رفع ${successCount} شحنة بنجاح${failedCount > 0 ? ` وفشل ${failedCount}` : ''}`,
        });
      }

      if (failedCount > 0) {
        toast({
          title: "بعض الشحنات فشلت",
          description: `فشل رفع ${failedCount} شحنة. تحقق من السجلات للتفاصيل.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading shipments:', error);
      toast({
        title: "فشل الرفع",
        description: "حدث خطأ أثناء رفع الشحنات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // تنزيل نموذج Excel
  const downloadTemplate = () => {
    // إنشاء بيانات نموذجية
    const templateData = [
      {
        'رقم التتبع': 'EG-1234567',
        'اسم المستلم': 'محمد أحمد',
        'رقم الهاتف': '01012345678',
        'العنوان': 'شارع التسعين، عمارة 15، الدور الثالث، شقة 5',
        'المدينة': 'القاهرة',
        'المنطقة': 'المعادي',
        'المبلغ': 250,
        'اسم المنتج': 'هاتف محمول',
        'الوزن': 0.5,
        'الملاحظات': 'الرجاء التوصيل بعد الساعة 5 مساءً'
      },
      {
        'رقم التتبع': 'EG-7654321',
        'اسم المستلم': 'سارة خالد',
        'رقم الهاتف': '01123456789',
        'العنوان': 'شارع جامعة الدول، عمارة 42، الدور الثاني',
        'المدينة': 'القاهرة',
        'المنطقة': 'المهندسين',
        'المبلغ': 180,
        'اسم المنتج': 'لابتوب',
        'الوزن': 2.3,
        'الملاحظات': 'العنوان بجوار مطعم الفخر'
      }
    ];

    // إنشاء ملف Excel
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "نموذج الشحنات");
    
    // تنزيل الملف
    XLSX.writeFile(wb, "نموذج_استيراد_الشحنات.xlsx");
    
    toast({
      title: "تم تنزيل النموذج",
      description: "تم تنزيل ملف نموذج استيراد الشحنات بنجاح"
    });
  };

  // تنزيل تقرير الأخطاء
  const downloadErrorReport = () => {
    if (!uploadResults?.errors || uploadResults.errors.length === 0) return;
    
    const errorData = uploadResults.errors.map((error, index) => ({
      'رقم': index + 1,
      'الخطأ': error
    }));
    
    const ws = XLSX.utils.json_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير الأخطاء");
    XLSX.writeFile(wb, "تقرير_الأخطاء_الشحنات.xlsx");
    
    toast({
      title: "تم تنزيل تقرير الأخطاء",
      description: "تم تنزيل تقرير الأخطاء بنجاح"
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* رأس الصفحة */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              رفع ملفات Excel للشحنات
            </h1>
            <p className="text-muted-foreground mt-1">
              استيراد الشحنات دفعة واحدة باستخدام ملف Excel
            </p>
          </div>
          <Button onClick={() => navigate('/app/shipments')} variant="outline">
            <Package className="h-4 w-4 ml-2" />
            العودة لقائمة الشحنات
          </Button>
        </div>

        {/* بطاقة رفع الملف */}
        <Card className="mb-6 border-green-200">
          <CardHeader className="bg-green-50/50">
            <CardTitle className="text-2xl font-bold text-green-800 flex items-center gap-2">
              <Upload className="h-6 w-6" />
              رفع ملف Excel
            </CardTitle>
            <CardDescription className="text-green-700 mt-2">
              اختر ملف Excel يحتوي على بيانات الشحنات لاستيرادها دفعة واحدة
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
              <FileSpreadsheet className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <Label htmlFor="excel-upload" className="cursor-pointer">
                <div className="mx-auto w-48">
                  <Input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Button className="gap-2 bg-green-600 hover:bg-green-700">
                      <Upload className="h-4 w-4" />
                      {file ? 'تغيير الملف' : 'اختر ملف Excel'}
                    </Button>
                    {file && (
                      <p className="text-sm text-green-700 mt-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {file.name} ({(file.size / 1024).toFixed(1)} ك.ب)
                      </p>
                    )}
                  </div>
                </div>
              </Label>
              <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                • الصيغ المدعومة: XLSX, XLS
                <br />• الحد الأقصى للحجم: 10 ميجابايت
                <br />• يجب أن يحتوي الملف على الأعمدة المطلوبة (انظر النموذج أدناه)
              </p>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={downloadTemplate}
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="h-4 w-4" />
                  تنزيل نموذج Excel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://example.com/excel-guide', '_blank')}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  دليل الاستخدام
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* رسالة التحقق من الأخطاء */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>تم اكتشاف أخطاء في البيانات</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pr-5 space-y-1 mt-2 max-h-48 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
              <p className="mt-3 font-medium">
                ⚠️ يجب تصحيح جميع الأخطاء قبل الرفع. يمكنك تنزيل نموذج Excel للاطلاع على التنسيق الصحيح.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* معاينة البيانات */}
        {previewData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                معاينة البيانات ({previewData.length} شحنة)
              </CardTitle>
              <CardDescription>
                {validationErrors.length === 0 
                  ? 'تم التحقق من البيانات بنجاح. جاهز للرفع.' 
                  : `${previewData.filter(s => !s.errors || s.errors.length === 0).length} شحنة صالحة للرفع`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>رقم التتبع</TableHead>
                      <TableHead>اسم المستلم</TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>المبلغ (ر.س)</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((shipment, index) => (
                      <TableRow 
                        key={index} 
                        className={shipment.errors && shipment.errors.length > 0 ? 'bg-red-50/50' : ''}
                      >
                        <TableCell className="font-medium">{shipment.tracking_number || 'سيتم إنشاؤه تلقائياً'}</TableCell>
                        <TableCell>{shipment.recipient_name}</TableCell>
                        <TableCell dir="ltr" className="font-mono">{shipment.recipient_phone}</TableCell>
                        <TableCell>{shipment.recipient_city}</TableCell>
                        <TableCell className="font-bold text-primary">{shipment.cod_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {shipment.errors && shipment.errors.length > 0 ? (
                            <div className="flex items-center gap-1 text-red-600 text-sm">
                              <XCircle className="h-3 w-3" />
                              <span>يوجد أخطاء</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="h-3 w-3" />
                              <span>صالح للرفع</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-green-600">
                    {previewData.filter(s => !s.errors || s.errors.length === 0).length}
                  </span>{" "}
                  شحنة صالحة للرفع |{" "}
                  <span className="font-medium text-red-600">
                    {previewData.filter(s => s.errors && s.errors.length > 0).length}
                  </span>{" "}
                  شحنة بها أخطاء
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading || validationErrors.length > 0 || previewData.length === 0}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري الرفع...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        رفع {previewData.filter(s => !s.errors || s.errors.length === 0).length} شحنة
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFile(null);
                      setPreviewData([]);
                      setValidationErrors([]);
                      setUploadResults(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 ml-2" />
                    مسح البيانات
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* شريط التقدم */}
        {uploading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>جاري رفع الشحنات...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* نتائج الرفع */}
        {uploadResults && (
          <Card className={uploadResults.failed > 0 ? 'border-destructive' : 'border-green-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadResults.failed > 0 ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {uploadResults.failed > 0 
                  ? 'اكتمل الرفع مع وجود أخطاء' 
                  : 'تم الرفع بنجاح'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">{uploadResults.success}</div>
                    <div className="text-sm text-muted-foreground">شحنات ناجحة</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold text-destructive mb-2">{uploadResults.failed}</div>
                    <div className="text-sm text-muted-foreground">شحنات فاشلة</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {((uploadResults.success / (uploadResults.success + uploadResults.failed)) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">معدل النجاح</div>
                  </CardContent>
                </Card>
              </div>

              {uploadResults.failed > 0 && uploadResults.errors.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>تفاصيل الأخطاء</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pr-5 space-y-1 mt-2 max-h-48 overflow-y-auto">
                      {uploadResults.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
                {uploadResults.failed > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={downloadErrorReport}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    تنزيل تقرير الأخطاء
                  </Button>
                )}
                <Button 
                  onClick={() => navigate('/app/shipments')}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Package className="h-4 w-4" />
                  عرض جميع الشحنات
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setValidationErrors([]);
                    setUploadResults(null);
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  رفع ملف جديد
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* دليل الاستخدام */}
        <Card className="bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-5 w-5 text-primary" />
              دليل استخدام رفع ملفات Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">تنزيل نموذج Excel</p>
                <p className="text-sm text-muted-foreground mt-1">
                  انقر على "تنزيل نموذج Excel" لتحميل ملف جاهز يحتوي على التنسيق الصحيح والأعمدة المطلوبة.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">إدخال البيانات</p>
                <p className="text-sm text-muted-foreground mt-1">
                  املأ البيانات في الملف مع الالتزام بالتنسيق:
                  <br />• رقم التتبع: فريد لكل شحنة (أو اتركه فارغاً ليتم إنشاؤه تلقائياً)
                  <br />• رقم الهاتف: يجب أن يبدأ بـ 01 ويتكون من 11 رقم
                  <br />• المبلغ: أرقام فقط بدون رموز
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">رفع الملف</p>
                <p className="text-sm text-muted-foreground mt-1">
                  اختر الملف المعد مسبقاً واضغط على "رفع" بعد التأكد من عدم وجود أخطاء في المعاينة.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">مراجعة النتائج</p>
                <p className="text-sm text-muted-foreground mt-1">
                  بعد الرفع، سترى تقريراً يوضح عدد الشحنات الناجحة والفاشلة. يمكنك تنزيل تقرير الأخطاء لتصحيحها وإعادة الرفع.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExcelUploadPage;