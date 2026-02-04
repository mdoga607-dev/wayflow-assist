/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Reports.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Printer,
  Package,
  Truck,
  Download,
  AlertCircle,
  CheckCircle,
  RefreshCcw
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportStats {
  totalRevenue: number;
  totalCommissions: number;
  totalShipments: number;
  deliveredCount: number;
  pendingCount: number;
  delayedCount: number;
  returnedCount: number;
  transitCount: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  commissions: number;
  shipments: number;
}

interface DelegateReport {
  id: string;
  name: string;
  totalDelivered: number;
  totalDelayed: number;
  totalReturned: number;
  successRate: number;
  commissionDue: number;
}

function ReportsPage() {
    const navigate = useNavigate();
    const { role, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [stats, setStats] = useState<ReportStats>({
        totalRevenue: 0,
        totalCommissions: 0,
        totalShipments: 0,
        deliveredCount: 0,
        pendingCount: 0,
        delayedCount: 0,
        returnedCount: 0,
        transitCount: 0
    });
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [delegateReports, setDelegateReports] = useState<DelegateReport[]>([]);
    const [filteredDelegates, setFilteredDelegates] = useState<DelegateReport[]>([]);

    // التحقق من الصلاحيات
    useEffect(() => {
        if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
            toast({
                title: "غير مصرح",
                description: "ليس لديك الصلاحية لعرض التقارير",
                variant: "destructive"
            });
            navigate('/unauthorized');
        }
    }, [authLoading, role, navigate]);

    // جلب البيانات من قاعدة البيانات
    const fetchData = async () => {
        try {
            setLoading(true);

            // جلب الإحصائيات العامة
            const { data: statsData, error: statsError } = await supabase
                .rpc('get_reports_stats', {
                    date_from: dateFrom || null,
                    date_to: dateTo || null
                });

            if (statsError) throw statsError;

            setStats({
                totalRevenue: statsData?.total_revenue || 0,
                totalCommissions: statsData?.total_commissions || 0,
                totalShipments: statsData?.total_shipments || 0,
                deliveredCount: statsData?.delivered_count || 0,
                pendingCount: statsData?.pending_count || 0,
                delayedCount: statsData?.delayed_count || 0,
                returnedCount: statsData?.returned_count || 0,
                transitCount: statsData?.transit_count || 0
            });

            // جلب البيانات الشهرية
            const { data: monthlyData, error: monthlyError } = await supabase
                .rpc('get_monthly_reports', {
                    date_from: dateFrom || null,
                    date_to: dateTo || null
                });

            if (monthlyError) throw monthlyError;

            setMonthlyData((monthlyData || []).map((item: any) => ({
                month: format(new Date(item.month_year), 'MMM yyyy', { locale: ar }),
                revenue: item.total_revenue || 0,
                commissions: item.total_commissions || 0,
                shipments: item.total_shipments || 0
            })));

            // جلب تقارير المناديب
            const { data: delegateData, error: delegateError } = await supabase
                .rpc('get_delegate_reports', {
                    date_from: dateFrom || null,
                    date_to: dateTo || null
                });

            if (delegateError) throw delegateError;

            const reports = (delegateData || []).map((item: any) => ({
                id: item.delegate_id,
                name: item.delegate_name,
                totalDelivered: item.total_delivered || 0,
                totalDelayed: item.total_delayed || 0,
                totalReturned: item.total_returned || 0,
                successRate: item.success_rate ? Math.round(item.success_rate * 100) : 0,
                commissionDue: item.commission_due || 0
            }));

            setDelegateReports(reports);
            setFilteredDelegates(reports);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast({
                title: "فشل التحميل",
                description: "حدث خطأ أثناء تحميل التقارير. يرجى المحاولة مرة أخرى.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // الجلب الأولي للبيانات
    useEffect(() => {
        if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
            fetchData();
        }
    }, [authLoading, role, dateFrom, dateTo]);

    // تصدير إلى Excel
    const exportToExcel = () => {
        setExporting(true);
        try {
            // تحضير البيانات
            const worksheetData = [
                ['تقرير أداء المناديب'],
                ['من تاريخ:', dateFrom || 'غير محدد', 'إلى تاريخ:', dateTo || 'غير محدد'],
                [],
                ['اسم المندوب', 'تم التسليم', 'متأخر', 'مرتجع', 'نسبة النجاح', 'العمولة المستحقة (ر.س)'],
                ...filteredDelegates.map(delegate => [
                    delegate.name,
                    delegate.totalDelivered,
                    delegate.totalDelayed,
                    delegate.totalReturned,
                    `${delegate.successRate}%`,
                    delegate.commissionDue
                ]),
                [],
                ['الإجماليات'],
                ['إجمالي الإيرادات', 'إجمالي العمولات', 'إجمالي الشحنات', 'نسبة التسليم'],
                [
                    stats.totalRevenue.toLocaleString(),
                    stats.totalCommissions.toLocaleString(),
                    stats.totalShipments,
                    stats.totalShipments > 0 ? Math.round((stats.deliveredCount / stats.totalShipments) * 100) : 0
                ]
            ];

            // إنشاء ملف Excel
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير المناديب");

            // تنزيل الملف
            XLSX.writeFile(workbook, `تقرير_المناديب_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

            toast({
                title: "تم التصدير بنجاح",
                description: "تم تصدير تقرير المناديب إلى ملف Excel"
            });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast({
                title: "فشل التصدير",
                description: "حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.",
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
            // إنشاء مستند PDF جديد
            const doc = new jsPDF();

            // العنوان
            doc.setFontSize(20);
            doc.text('تقرير أداء المناديب', 105, 20, { align: 'center' });

            // الفترة الزمنية
            doc.setFontSize(12);
            doc.text(`من تاريخ: ${dateFrom || 'غير محدد'} إلى تاريخ: ${dateTo || 'غير محدد'}`, 105, 30, { align: 'center' });

            // جدول البيانات
            const tableData = filteredDelegates.map(delegate => [
                delegate.name,
                delegate.totalDelivered.toString(),
                delegate.totalDelayed.toString(),
                delegate.totalReturned.toString(),
                `${delegate.successRate}%`,
                delegate.commissionDue.toLocaleString()
            ]);

            // إضافة الجدول
            (doc as any).autoTable({
                head: [['اسم المندوب', 'تم التسليم', 'متأخر', 'مرتجع', 'نسبة النجاح', 'العمولة (ر.س)']],
                body: tableData,
                startY: 40,
                theme: 'grid',
                styles: {
                    font: 'normal',
                    fontSize: 10,
                    cellPadding: 3
                },
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: 255
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                }
            });

            // الإجماليات
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(14);
            doc.text('الإجماليات', 105, finalY, { align: 'center' });

            (doc as any).autoTable({
                body: [
                    ['إجمالي الإيرادات', stats.totalRevenue.toLocaleString() + ' ر.س'],
                    ['إجمالي العمولات', stats.totalCommissions.toLocaleString() + ' ر.س'],
                    ['إجمالي الشحنات', stats.totalShipments.toString()],
                    ['نسبة التسليم', `${stats.totalShipments > 0 ? Math.round((stats.deliveredCount / stats.totalShipments) * 100) : 0}%`]
                ],
                startY: finalY + 10,
                theme: 'grid',
                styles: {
                    font: 'bold',
                    fontSize: 11,
                    cellPadding: 4
                },
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: 255
                }
            });

            // حفظ الملف
            doc.save(`تقرير_المناديب_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

            toast({
                title: "تم التصدير بنجاح",
                description: "تم تصدير تقرير المناديب إلى ملف PDF"
            });
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast({
                title: "فشل التصدير",
                description: "حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.",
                variant: "destructive"
            });
        } finally {
            setExporting(false);
        }
    };

    // طباعة الصفحة
    const handlePrint = () => {
        window.print();
    };

    // ألوان حالات الشحنات
    const statusColors = {
        delivered: "#10b981",
        pending: "#f59e0b",
        transit: "#3b82f6",
        delayed: "#ef4444",
        returned: "#8b5cf6",
    };

    // بيانات توزيع الحالات
    const statusData = [
        { name: "تم التسليم", value: stats.deliveredCount, color: statusColors.delivered },
        { name: "في الانتظار", value: stats.pendingCount, color: statusColors.pending },
        { name: "قيد التوصيل", value: stats.transitCount, color: statusColors.transit },
        { name: "متأخر", value: stats.delayedCount, color: statusColors.delayed },
        { name: "مرتجع", value: stats.returnedCount, color: statusColors.returned },
    ].filter(s => s.value > 0);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">جاري تحميل التقارير...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-6 space-y-6" dir="rtl">
            {/* رأس الصفحة */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        التقارير والإحصائيات
                    </h1>
                    <p className="text-gray-600 mt-1">
                        تقارير شاملة للإيرادات والعمولات وأداء المناديب
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                        className="gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        طباعة
                    </Button>
                    <Button
                        onClick={exportToExcel}
                        disabled={exporting}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
                    </Button>
                    <Button
                        onClick={exportToPDF}
                        disabled={exporting}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
                    </Button>
                </div>
            </div>

            {/* فلترة التاريخ */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg text-gray-800">تحديد الفترة الزمنية</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateFrom">من تاريخ</Label>
                            <Input
                                id="dateFrom"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                max={dateTo || new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateTo">إلى تاريخ</Label>
                            <Input
                                id="dateTo"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                min={dateFrom} />
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDateFrom('');
                                    setDateTo('');
                                    fetchData();
                                } }
                                className="w-full"
                            >
                                <RefreshCcw className="h-4 w-4 ml-2" />
                                إعادة تعيين
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center md:text-right">
                        <AlertCircle className="h-3 w-3 inline-block ml-1" />
                        عند عدم تحديد فترة زمنية، سيتم عرض جميع البيانات
                    </p>
                </CardContent>
            </Card>

            {/* ملخص الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                                <p className="text-2xl font-bold mt-1 text-green-600">
                                    {stats.totalRevenue.toLocaleString()} ر.س
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">إجمالي العمولات</p>
                                <p className="text-2xl font-bold mt-1 text-purple-600">
                                    {stats.totalCommissions.toLocaleString()} ر.س
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">إجمالي الشحنات</p>
                                <p className="text-2xl font-bold mt-1 text-blue-600">
                                    {stats.totalShipments.toLocaleString()}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">نسبة التسليم</p>
                                <p className="text-2xl font-bold mt-1 text-orange-600">
                                    {stats.totalShipments > 0
                                        ? Math.round((stats.deliveredCount / stats.totalShipments) * 100)
                                        : 0}%
                                </p>
                            </div>
                            <Truck className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* الرسوم البيانية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* مخطط الإيرادات الشهرية */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-gray-800">الإيرادات والعمولات الشهرية</CardTitle>
                        <CardDescription>
                            مقارنة الإيرادات والعمولات خلال الأشهر الأخيرة
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#6b7280"
                                        tick={{ fill: '#6b7280' }} />
                                    <YAxis
                                        stroke="#6b7280"
                                        tick={{ fill: '#6b7280' }}
                                        tickFormatter={(value) => `${value.toLocaleString()} ر.س`} />
                                    <Tooltip
                                        formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'القيمة']}
                                        labelFormatter={(label) => `الشهر: ${label}`}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '4px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="الإيرادات"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ fill: '#10b981' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="commissions"
                                        name="العمولات"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        dot={{ fill: '#8b5cf6' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* مخطط توزيع الحالات */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-gray-800">توزيع حالات الشحنات</CardTitle>
                        <CardDescription>
                            نسب حالات الشحنات المختلفة
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [`${value.toLocaleString()}`, 'العدد']}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '4px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => (
                                            <span className="text-sm text-gray-700 mr-2">{value}</span>
                                        )} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* جدول أداء المناديب */}
            <Card>
                <CardHeader className="border-b">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                                <Users className="h-5 w-5 text-gray-700" />
                                أداء المناديب والعمولات
                            </CardTitle>
                            <CardDescription className="mt-1">
                                تقرير مفصل بأداء كل مندوب ومستحقاته من العمولات
                            </CardDescription>
                        </div>
                        <div className="text-sm text-gray-500">
                            <span className="font-medium">عدد المناديب:</span> {filteredDelegates.length} مندوب
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="text-right font-medium text-gray-700">اسم المندوب</TableHead>
                                    <TableHead className="text-right font-medium text-gray-700">تم التسليم</TableHead>
                                    <TableHead className="text-right font-medium text-gray-700">متأخر</TableHead>
                                    <TableHead className="text-right font-medium text-gray-700">مرتجع</TableHead>
                                    <TableHead className="text-right font-medium text-gray-700">نسبة النجاح</TableHead>
                                    <TableHead className="text-right font-medium text-gray-700">العمولة المستحقة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDelegates.map((delegate) => (
                                    <TableRow
                                        key={delegate.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <TableCell className="font-medium text-gray-900">{delegate.name}</TableCell>
                                        <TableCell className="text-green-600 font-semibold">{delegate.totalDelivered}</TableCell>
                                        <TableCell className="text-yellow-600">{delegate.totalDelayed}</TableCell>
                                        <TableCell className="text-red-600">{delegate.totalReturned}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={delegate.successRate >= 80
                                                    ? "bg-green-100 text-green-800"
                                                    : delegate.successRate >= 60
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-red-100 text-red-800"}
                                            >
                                                {delegate.successRate}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-blue-600">
                                            {delegate.commissionDue.toLocaleString()} ر.س
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t mt-4 gap-3">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">إجمالي العمولات:</span> {stats.totalCommissions.toLocaleString()} ر.س
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportToExcel}
                                disabled={exporting}
                                className="gap-1"
                            >
                                <FileSpreadsheet className="h-3 w-3" />
                                Excel
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportToPDF}
                                disabled={exporting}
                                className="gap-1"
                            >
                                <FileText className="h-3 w-3" />
                                PDF
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="gap-1"
                            >
                                <Printer className="h-3 w-3" />
                                طباعة
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* مخطط عدد الشحنات الشهرية */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-gray-800">عدد الشحنات الشهرية</CardTitle>
                    <CardDescription>
                        تطور عدد الشحنات خلال الأشهر الأخيرة
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#6b7280"
                                    tick={{ fill: '#6b7280' }} />
                                <YAxis
                                    stroke="#6b7280"
                                    tick={{ fill: '#6b7280' }} />
                                <Tooltip
                                    formatter={(value: number) => [`${value.toLocaleString()}`, 'العدد']}
                                    labelFormatter={(label) => `الشهر: ${label}`}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '4px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }} />
                                <Legend />
                                <Bar
                                    dataKey="shipments"
                                    name="عدد الشحنات"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* ملاحظات هامة */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-gray-700" />
                        ملاحظات هامة
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
                            1
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">التحديث التلقائي</p>
                            <p className="text-sm text-gray-600 mt-1">
                                يتم تحديث البيانات تلقائياً عند تغيير الفترة الزمنية أو عند الضغط على زر "إعادة تعيين".
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
                            2
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">تصدير التقارير</p>
                            <p className="text-sm text-gray-600 mt-1">
                                يمكنك تصدير تقرير المناديب إلى Excel أو PDF بالنقر على الأزرار المخصصة لذلك.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
                            3
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">نسبة النجاح</p>
                            <p className="text-sm text-gray-600 mt-1">
                                تُحسب نسبة النجاح بقسمة عدد الشحنات المُسلمة على إجمالي الشحنات المُسندة للمندوب.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex-shrink-0">
                            4
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">البيانات الحقيقية</p>
                            <p className="text-sm text-gray-600 mt-1">
                                جميع البيانات المعروضة يتم جلبها مباشرة من قاعدة البيانات في الوقت الفعلي.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ReportsPage;