/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/balance/PaymentReportPage.tsx
import { useState, useEffect } from "react";
import { 
  FileText, Download, Filter, Calendar, TrendingUp, TrendingDown, 
  CheckCircle, Clock, AlertCircle, Search, RefreshCcw, Printer, 
  ArrowDownCircle, ArrowUpCircle, Wallet, User, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Label } from "@radix-ui/react-label";

// واجهة تقرير الدفع
interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  type: 'collection' | 'payment' | 'refund';
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  customer_name: string;
  customer_phone: string;
  shipment_id: string;
  notes?: string;
  collected_by: string;
  branch: string;
  category: string;
}

// بيانات مصرية حقيقية لتقرير المدفوعات
const egyptianPaymentRecords: PaymentRecord[] = [
  {
    id: "PAY-2024-001",
    date: "2024-01-15",
    amount: 1250,
    type: "collection",
    method: "كاش",
    status: "completed",
    customer_name: "محمد أحمد",
    customer_phone: "01012345678",
    shipment_id: "SHIP-1001",
    notes: "تحصيل شحنة إكسسوارات إلكترونية",
    collected_by: "خالد سعيد",
    branch: "القاهرة - المعادي",
    category: "شحنات محلية"
  },
  {
    id: "PAY-2024-002",
    date: "2024-01-15",
    amount: 850,
    type: "collection",
    method: "تحويل بنكي",
    status: "completed",
    customer_name: "سارة محمد",
    customer_phone: "01123456789",
    shipment_id: "SHIP-1002",
    notes: "تحصيل شحنة ملابس",
    collected_by: "إسلام حسن",
    branch: "القاهرة - المهندسين",
    category: "شحنات محلية"
  },
  {
    id: "PAY-2024-003",
    date: "2024-01-14",
    amount: 2100,
    type: "collection",
    method: "كاش",
    status: "completed",
    customer_name: "أحمد علي",
    customer_phone: "01234567890",
    shipment_id: "SHIP-1003",
    notes: "تحصيل شحنة أجهزة منزلية",
    collected_by: "مصطفى علي",
    branch: "الجيزة - المهندسين",
    category: "شحنات محلية"
  },
  {
    id: "PAY-2024-004",
    date: "2024-01-14",
    amount: 1750,
    type: "payment",
    method: "تحويل بنكي",
    status: "completed",
    customer_name: "شركة النقل السريع",
    customer_phone: "01543210987",
    shipment_id: "EXP-2001",
    notes: "دفع راتب مندوب يناير",
    collected_by: "الإدارة",
    branch: "المكتب الرئيسي",
    category: "رواتب"
  },
  {
    id: "PAY-2024-005",
    date: "2024-01-13",
    amount: 950,
    type: "collection",
    method: "كاش",
    status: "pending",
    customer_name: "فاطمة علي",
    customer_phone: "01098765432",
    shipment_id: "SHIP-1004",
    notes: "تحصيل شحنة مستحضرات تجميل",
    collected_by: "خالد سعيد",
    branch: "القاهرة - شبرا",
    category: "شحنات محلية"
  },
  {
    id: "PAY-2024-006",
    date: "2024-01-13",
    amount: 3200,
    type: "collection",
    method: "شيك",
    status: "completed",
    customer_name: "عمرو عبد الرحمن",
    customer_phone: "01187654321",
    shipment_id: "SHIP-1005",
    notes: "تحصيل شحنة قطع غيار",
    collected_by: "إسلام حسن",
    branch: "القاهرة - مدينة نصر",
    category: "شحنات محلية"
  },
  {
    id: "PAY-2024-007",
    date: "2024-01-12",
    amount: 1450,
    type: "payment",
    method: "كاش",
    status: "completed",
    customer_name: "مطعم الوجبات السريعة",
    customer_phone: "01276543210",
    shipment_id: "EXP-2002",
    notes: "دفع إيجار مكتب يناير",
    collected_by: "الإدارة",
    branch: "المكتب الرئيسي",
    category: "مصاريف ثابتة"
  },
  {
    id: "PAY-2024-008",
    date: "2024-01-12",
    amount: 680,
    type: "collection",
    method: "كاش",
    status: "completed",
    customer_name: "ياسر محمد",
    customer_phone: "01565432109",
    shipment_id: "SHIP-1006",
    notes: "تحصيل شحنة كتب",
    collected_by: "مصطفى علي",
    branch: "الإسكندرية - سموحة",
    category: "شحنات محلية"
  },
  {
    id: "PAY-2024-009",
    date: "2024-01-11",
    amount: 1950,
    type: "collection",
    method: "تحويل بنكي",
    status: "completed",
    customer_name: "هاني سمير",
    customer_phone: "01065432109",
    shipment_id: "SHIP-1007",
    notes: "تحصيل شحنة إلكترونيات",
    collected_by: "خالد سعيد",
    branch: "القاهرة - المعادي",
    category: "شحنات محلية"
  },
  {
    id: "PAY-2024-010",
    date: "2024-01-11",
    amount: 450,
    type: "refund",
    method: "كاش",
    status: "completed",
    customer_name: "وائل فتحي",
    customer_phone: "01154321098",
    shipment_id: "SHIP-1008",
    notes: "إرجاع مبلغ شحنة تالفة",
    collected_by: "إسلام حسن",
    branch: "القاهرة - المهندسين",
    category: "مرتجعات"
  },
  {
    id: "PAY-2024-011",
    date: "2024-01-10",
    amount: 2800,
    type: "collection",
    method: "كاش",
    status: "failed",
    customer_name: "شريف عبد الحميد",
    customer_phone: "01254321098",
    shipment_id: "SHIP-1009",
    notes: "فشل التحصيل - العميل غير موجود",
    collected_by: "مصطفى علي",
    branch: "القاهرة - مدينة نصر",
    category: "شحنات محلية"
  },
  {
    id: "PAY-2024-012",
    date: "2024-01-10",
    amount: 1100,
    type: "collection",
    method: "تحويل بنكي",
    status: "completed",
    customer_name: "شركة التجارة الإلكترونية",
    customer_phone: "01543210987",
    shipment_id: "SHIP-1010",
    notes: "تحصيل شحنة منتجات رقمية",
    collected_by: "خالد سعيد",
    branch: "القاهرة - المعادي",
    category: "شحنات تجارية"
  },
  {
    id: "PAY-2024-013",
    date: "2024-01-09",
    amount: 750,
    type: "payment",
    method: "كاش",
    status: "completed",
    customer_name: "محل السوبر ماركت",
    customer_phone: "01043210987",
    shipment_id: "EXP-2003",
    notes: "دفع فاتورة كهرباء",
    collected_by: "الإدارة",
    branch: "المكتب الرئيسي",
    category: "مصاريف تشغيلية"
  },
  {
    id: "PAY-2024-014",
    date: "2024-01-09",
    amount: 1650,
    type: "collection",
    method: "كاش",
    status: "completed",
    customer_name: "أحمد سعيد",
    customer_phone: "01132109876",
    shipment_id: "SHIP-1011",
    notes: "تحصيل شحنة أدوات مكتبية",
    collected_by: "إسلام حسن",
    branch: "الجيزة - المهندسين",
    category: "شحنات محلية"
  },
  {
    id: "PAY-2024-015",
    date: "2024-01-08",
    amount: 2250,
    type: "collection",
    method: "شيك",
    status: "pending",
    customer_name: "مصنع الأثاث",
    customer_phone: "01221098765",
    shipment_id: "SHIP-1012",
    notes: "تحصيل شحنة أثاث مكتبي",
    collected_by: "مصطفى علي",
    branch: "القاهرة - مدينة نصر",
    category: "شحنات تجارية"
  }
];

const PaymentReportPage = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecords, setFilteredRecords] = useState<PaymentRecord[]>(egyptianPaymentRecords);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // حساب الإحصائيات
  const totalCollections = filteredRecords
    .filter(r => r.type === 'collection' && r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalPayments = filteredRecords
    .filter(r => r.type === 'payment' && r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const pendingAmount = filteredRecords
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const failedAmount = filteredRecords
    .filter(r => r.status === 'failed')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const netBalance = totalCollections - totalPayments;

  // تطبيق الفلاتر
  useEffect(() => {
    let filtered = [...egyptianPaymentRecords];
    
    // فلتر التاريخ
    if (dateFrom) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(dateTo));
    }
    
    // فلتر النوع
    if (typeFilter !== "all") {
      filtered = filtered.filter(r => r.type === typeFilter);
    }
    
    // فلتر الحالة
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // فلتر طريقة الدفع
    if (methodFilter !== "all") {
      filtered = filtered.filter(r => r.method === methodFilter);
    }
    
    // فلتر الفرع
    if (branchFilter !== "all") {
      filtered = filtered.filter(r => r.branch === branchFilter);
    }
    
    // فلتر البحث
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.id.toLowerCase().includes(searchLower) ||
        r.customer_name.toLowerCase().includes(searchLower) ||
        r.customer_phone.includes(searchTerm) ||
        r.shipment_id.toLowerCase().includes(searchLower) ||
        r.collected_by.toLowerCase().includes(searchLower) ||
        r.branch.toLowerCase().includes(searchLower) ||
        r.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredRecords(filtered);
  }, [dateFrom, dateTo, typeFilter, statusFilter, methodFilter, branchFilter, searchTerm]);

  // الحصول على الفروع والطرق الفريدة
  const branches = [...new Set(egyptianPaymentRecords.map(r => r.branch))];
  const methods = [...new Set(egyptianPaymentRecords.map(r => r.method))];

  // تصدير إلى Excel
  const exportToExcel = () => {
    setExporting(true);
    
    try {
      // تحضير البيانات للتصدير
      const exportData = filteredRecords.map(record => ({
        'رقم العملية': record.id,
        'التاريخ': format(new Date(record.date), 'dd/MM/yyyy', { locale: ar }),
        'المبلغ (ج.م)': record.amount,
        'النوع': record.type === 'collection' ? 'تحصيل' : record.type === 'payment' ? 'دفع' : 'إرجاع',
        'طريقة الدفع': record.method,
        'الحالة': 
          record.status === 'completed' ? 'مكتمل' :
          record.status === 'pending' ? 'معلق' :
          record.status === 'failed' ? 'فشل' : 'مرتجع',
        'اسم العميل': record.customer_name,
        'تليفون العميل': record.customer_phone,
        'رقم الشحنة': record.shipment_id,
        'المندوب/المحصل': record.collected_by,
        'الفرع': record.branch,
        'الفئة': record.category,
        'الملاحظات': record.notes || '-'
      }));

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير المدفوعات");
      
      // إضافة ملخص في ورقة منفصلة
      const summaryData = [
        ['تقرير المدفوعات - ملخص'],
        [],
        ['إجمالي التحصيلات', `${totalCollections.toLocaleString()} ج.م`],
        ['إجمالي المدفوعات', `${totalPayments.toLocaleString()} ج.م`],
        ['الرصيد الصافي', `${netBalance.toLocaleString()} ج.م`],
        ['المبلغ المعلق', `${pendingAmount.toLocaleString()} ج.م`],
        ['المبلغ الفاشل', `${failedAmount.toLocaleString()} ج.م`],
        [],
        ['عدد السجلات', filteredRecords.length.toString()],
        ['تاريخ التصدير', format(new Date(), 'dd/MM/yyyy', { locale: ar })]
      ];
      
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "الملخص");
      
      // تنزيل الملف
      XLSX.writeFile(workbook, `تقرير_المدفوعات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${filteredRecords.length} سجل إلى ملف Excel`
      });
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // تصدير إلى PDF
  const exportToPDF = () => {
    setExporting(true);
    
    try {
      const doc = new jsPDF();
      
      // العنوان
      doc.setFontSize(20);
      doc.text("تقرير المدفوعات", 105, 20, { align: 'center' });
      
      // الملخص
      doc.setFontSize(12);
      doc.text(`الفترة: ${dateFrom ? format(new Date(dateFrom), 'dd/MM/yyyy', { locale: ar }) : 'من البداية'} - ${dateTo ? format(new Date(dateTo), 'dd/MM/yyyy', { locale: ar }) : 'حتى الآن'}`, 105, 30, { align: 'center' });
      
      // جدول الملخص
      autoTable(doc, {
        startY: 40,
        head: [['الإجمالي', 'القيمة']],
        body: [
          ['إجمالي التحصيلات', `${totalCollections.toLocaleString()} ج.م`],
          ['إجمالي المدفوعات', `${totalPayments.toLocaleString()} ج.م`],
          ['الرصيد الصافي', `${netBalance.toLocaleString()} ج.م`],
          ['المبلغ المعلق', `${pendingAmount.toLocaleString()} ج.م`],
          ['المبلغ الفاشل', `${failedAmount.toLocaleString()} ج.م`],
          ['عدد السجلات', filteredRecords.length.toString()]
        ],
        theme: 'grid',
        styles: { 
          font: 'normal',
          fontSize: 10,
          halign: 'center'
        },
        headStyles: { 
          fillColor: [30, 64, 175],
          textColor: 255
        }
      });
      
      // جدول البيانات
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [
          ['رقم العملية', 'التاريخ', 'المبلغ', 'النوع', 'الحالة', 'العميل', 'المندوب', 'الفرع']
        ],
        body: filteredRecords.map(record => [
          record.id,
          format(new Date(record.date), 'dd/MM/yyyy', { locale: ar }),
          `${record.amount.toLocaleString()} ج.م`,
          record.type === 'collection' ? 'تحصيل' : record.type === 'payment' ? 'دفع' : 'إرجاع',
          record.status === 'completed' ? 'مكتمل' : record.status === 'pending' ? 'معلق' : record.status === 'failed' ? 'فشل' : 'مرتجع',
          record.customer_name,
          record.collected_by,
          record.branch
        ]),
        theme: 'striped',
        styles: { 
          font: 'normal',
          fontSize: 8,
          halign: 'center'
        },
        headStyles: { 
          fillColor: [30, 64, 175],
          textColor: 255
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: 30 },
          6: { cellWidth: 25 },
          7: { cellWidth: 25 }
        }
      });
      
      // حفظ الملف
      doc.save(`تقرير_المدفوعات_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${filteredRecords.length} سجل إلى ملف PDF`
      });
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // طباعة التقرير
  const handlePrint = () => {
    window.print();
  };

  // تحديث البيانات
  const handleRefresh = () => {
    setLoading(true);
    toast({
      title: "جاري التحديث",
      description: "يتم تحديث تقرير المدفوعات...",
    });
    
    // محاكاة التحديث
    setTimeout(() => {
      setFilteredRecords([...egyptianPaymentRecords]);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث تقرير المدفوعات",
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/20 py-6 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* رأس الصفحة */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-2xl mb-6 border-4 border-white">
            <FileText className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-primary mb-4">
            تقرير المدفوعات
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            عرض وتحليل جميع عمليات التحصيل والدفع في النظام مع إمكانية التصدير والطباعة
          </p>
        </motion.div>

        {/* ملخص التقرير */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">إجمالي التحصيلات</CardTitle>
                  <ArrowDownCircle className="h-6 w-6 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-green-700 mb-2">
                    {totalCollections.toLocaleString()} <span className="text-xl">ج.م</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    من {filteredRecords.filter(r => r.type === 'collection' && r.status === 'completed').length} عملية
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">إجمالي المدفوعات</CardTitle>
                  <ArrowUpCircle className="h-6 w-6 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-red-700 mb-2">
                    {totalPayments.toLocaleString()} <span className="text-xl">ج.م</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    من {filteredRecords.filter(r => r.type === 'payment' && r.status === 'completed').length} عملية
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">الرصيد الصافي</CardTitle>
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className={cn(
                    "text-4xl md:text-5xl font-bold mb-2",
                    netBalance >= 0 ? "text-blue-700" : "text-red-700"
                  )}>
                    {netBalance.toLocaleString()} <span className="text-xl">ج.م</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {netBalance >= 0 ? 'صافي أرباح' : 'صافي خسائر'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">المبلغ المعلق</CardTitle>
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-amber-700 mb-2">
                    {pendingAmount.toLocaleString()} <span className="text-xl">ج.م</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    من {filteredRecords.filter(r => r.status === 'pending').length} عملية
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* أدوات التحكم والفلاتر */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-5 border-b-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Filter className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold">فلاتر التقرير</CardTitle>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="gap-2 bg-white text-blue-700 hover:bg-blue-50"
                  >
                    {loading ? (
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    تحديث البيانات
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={exportToExcel}
                    disabled={exporting || filteredRecords.length === 0}
                    className="gap-2 bg-white text-green-700 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4" />
                    تصدير Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={exportToPDF}
                    disabled={exporting || filteredRecords.length === 0}
                    className="gap-2 bg-white text-red-700 hover:bg-red-50"
                  >
                    <FileText className="h-4 w-4" />
                    تصدير PDF
                  </Button>
                  <Button 
                    onClick={handlePrint}
                    disabled={filteredRecords.length === 0}
                    className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg"
                  >
                    <Printer className="h-4 w-4" />
                    طباعة التقرير
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-sm font-medium text-gray-700 mb-1 block">من تاريخ</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-sm font-medium text-gray-700 mb-1 block">إلى تاريخ</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border border-gray-300"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="كل الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    <SelectItem value="collection">تحصيل</SelectItem>
                    <SelectItem value="payment">دفع</SelectItem>
                    <SelectItem value="refund">إرجاع</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="كل الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="failed">فشل</SelectItem>
                    <SelectItem value="refunded">مرتجع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="كل طرق الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل طرق الدفع</SelectItem>
                    {methods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="كل الفروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفروع</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث بالعميل أو الرقم أو الملاحظات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-4 pr-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* جدول التقرير */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50/80 p-5 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">تفاصيل تقرير المدفوعات</CardTitle>
                  <CardDescription className="mt-1 text-gray-600">
                    عرض {filteredRecords.length} سجل من إجمالي {egyptianPaymentRecords.length} سجل
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-100 text-green-800 border border-green-200">
                    التحصيلات: {filteredRecords.filter(r => r.type === 'collection').length}
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 border border-red-200">
                    المدفوعات: {filteredRecords.filter(r => r.type === 'payment').length}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                    المكتملة: {filteredRecords.filter(r => r.status === 'completed').length}
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                    المعلقة: {filteredRecords.filter(r => r.status === 'pending').length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-2xl font-medium mb-2">مفيش سجلات</p>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || methodFilter !== 'all' || branchFilter !== 'all' || dateFrom || dateTo
                      ? 'مفيش سجلات تطابق معايير البحث والفلاتر الحالية. جرب غير المعايير أو امسح الفلاتر.'
                      : 'مفيش سجلات مدفوعات مسجلة في الفترة المحددة. جرب توسيع نطاق التاريخ أو تغيير الفلاتر.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="text-right w-28 font-medium text-gray-700">رقم العملية</TableHead>
                        <TableHead className="text-right w-32 font-medium text-gray-700">التاريخ</TableHead>
                        <TableHead className="text-right w-32 font-medium text-gray-700">المبلغ</TableHead>
                        <TableHead className="text-right w-24 font-medium text-gray-700">النوع</TableHead>
                        <TableHead className="text-right w-24 font-medium text-gray-700">الحالة</TableHead>
                        <TableHead className="text-right min-w-[150px] font-medium text-gray-700">العميل</TableHead>
                        <TableHead className="text-right w-32 font-medium text-gray-700">المندوب</TableHead>
                        <TableHead className="text-right w-36 font-medium text-gray-700">الفرع</TableHead>
                        <TableHead className="text-right min-w-[180px] font-medium text-gray-700">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record, index) => (
                        <motion.tr 
                          key={record.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className={cn(
                            "border-b border-gray-100 hover:bg-gray-50/70 transition-colors",
                            record.status === 'failed' && 'bg-red-50/30',
                            record.status === 'refunded' && 'bg-amber-50/30'
                          )}
                        >
                          <TableCell className="font-medium text-primary">{record.id}</TableCell>
                          <TableCell className="text-gray-700">
                            {format(new Date(record.date), 'dd/MM/yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell className={cn(
                            "font-bold text-lg",
                            record.type === "collection" ? "text-green-700" : "text-red-700"
                          )}>
                            {record.amount.toLocaleString()} <span className="text-base">ج.م</span>
                          </TableCell>
                          <TableCell>
                            {record.type === "collection" && (
                              <Badge className="bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                  <ArrowDownCircle className="h-3 w-3" />
                                  تحصيل
                                </span>
                              </Badge>
                            )}
                            {record.type === "payment" && (
                              <Badge className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                  <ArrowUpCircle className="h-3 w-3" />
                                  دفع
                                </span>
                              </Badge>
                            )}
                            {record.type === "refund" && (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  إرجاع
                                </span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.status === "completed" && (
                              <Badge className="bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  مكتمل
                                </span>
                              </Badge>
                            )}
                            {record.status === "pending" && (
                              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  معلق
                                </span>
                              </Badge>
                            )}
                            {record.status === "failed" && (
                              <Badge className="bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  فشل
                                </span>
                              </Badge>
                            )}
                            {record.status === "refunded" && (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  مرتجع
                                </span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-gray-800">{record.customer_name}</TableCell>
                          <TableCell className="text-gray-700">{record.collected_by}</TableCell>
                          <TableCell className="text-gray-700">{record.branch}</TableCell>
                          <TableCell className="text-gray-600 max-w-[250px] truncate" title={record.notes}>
                            {record.notes || '-'}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* نصائح وإرشادات */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50/30 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium text-lg mb-2">نصائح لتحليل تقرير المدفوعات:</p>
                  <ul className="list-disc pr-5 space-y-2">
                    <li><span className="font-medium">التحصيلات مقابل المدفوعات:</span> راقب الفرق بين إجمالي التحصيلات والمدفوعات لتحديد الربحية.</li>
                    <li><span className="font-medium">المبالغ المعلقة:</span> تابع المبالغ المعلقة بشكل دوري لتحصيلها في أقرب وقت ممكن.</li>
                    <li><span className="font-medium">تحليل الفروع:</span> قارن أداء الفروع المختلفة لتحديد الأفضل في التحصيل.</li>
                    <li><span className="font-medium">التصدير الدوري:</span> صدر التقارير بشكل دوري (يومي، أسبوعي، شهري) لتحليل الاتجاهات.</li>
                    <li><span className="font-medium">التحقق من الفشل:</span> راجع عمليات التحصيل الفاشلة لتحديد أسبابها وتجنبها مستقبلاً.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentReportPage;