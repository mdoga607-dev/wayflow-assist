/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/BalanceManagement.tsx
import { useState, useEffect } from "react";
import { 
  Plus, Download, Upload, Wallet, ArrowUpCircle, ArrowDownCircle, 
  Filter, Search, RefreshCcw, AlertCircle, CheckCircle, Clock, 
  FileText, TrendingUp, TrendingDown, Calendar, User, Info, Eye, Edit2, Trash2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// واجهة المعاملة المالية
interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "credit" | "debit";
  method: string;
  notes: string;
  user_name: string;
  status: "completed" | "pending" | "cancelled";
  receipt_url?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const BalanceManagement = () => {
  const { role, loading: authLoading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      toast({
        title: "غير مصرح",
        description: "ماعندكش الصلاحية تدير الحسابات",
        variant: "destructive",
      });
      // Redirect or handle unauthorized access
    }
  }, [authLoading, role]);

  // جلب البيانات من Supabase
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      setFilteredTransactions(data || []);
      
      toast({
        title: "تم التحميل",
        description: `تم تحميل ${data?.length || 0} معاملة مالية بنجاح`,
      });
    } catch (err: any) {
      console.error('خطأ في جلب المعاملات:', err);
      toast({
        title: "فشل التحميل",
        description: err.message || "حصل خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // جلب البيانات عند التحميل
  useEffect(() => {
    if (!authLoading && ['head_manager', 'manager'].includes(role || '')) {
      fetchTransactions();
    }
  }, [authLoading, role]);

  // تطبيق الفلاتر
  useEffect(() => {
    let filtered = [...transactions];
    
    // فلتر النوع
    if (typeFilter !== "all") {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    // فلتر الحالة
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    // فلتر الفئة
    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    // فلتر التاريخ
    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(dateTo));
    }
    
    // فلتر البحث
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(searchLower) ||
        t.user_name.toLowerCase().includes(searchLower) ||
        t.notes.toLowerCase().includes(searchLower) ||
        t.method.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredTransactions(filtered);
  }, [typeFilter, statusFilter, categoryFilter, dateFrom, dateTo, searchTerm, transactions]);

  // حساب الإحصائيات
  const totalCredits = filteredTransactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = filteredTransactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalCredits - totalDebits;

  // معالجة إضافة معاملة جديدة
  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const newTransaction = {
        date: formData.get('date') as string,
        amount: parseFloat(formData.get('amount') as string),
        type: formData.get('type') as "credit" | "debit",
        method: formData.get('method') as string,
        notes: formData.get('notes') as string,
        user_name: formData.get('user') as string,
        status: formData.get('status') as "completed" | "pending" | "cancelled",
        category: formData.get('category') as string,
        receipt_url: formData.get('receipt_url') as string || null,
      };

      const { error } = await supabase
        .from('transactions')
        .insert([newTransaction]);

      if (error) throw error;

      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة معاملة مالية جديدة بقيمة ${newTransaction.amount.toLocaleString()} ج.م`,
      });
      
      // إعادة تعيين النموذج وإغلاق النافذة
      e.currentTarget.reset();
      setIsAddDialogOpen(false);
      
      // إعادة تحميل البيانات
      await fetchTransactions();
    } catch (err: any) {
      console.error('خطأ في إضافة المعاملة:', err);
      toast({
        title: "فشل الإضافة",
        description: err.message || "حصل خطأ أثناء إضافة المعاملة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // معالجة تعديل معاملة
  const handleEditTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (!currentTransaction) throw new Error("لا توجد معاملة محددة للتعديل");
      
      const formData = new FormData(e.currentTarget);
      
      const updatedTransaction = {
        date: formData.get('date') as string,
        amount: parseFloat(formData.get('amount') as string),
        type: formData.get('type') as "credit" | "debit",
        method: formData.get('method') as string,
        notes: formData.get('notes') as string,
        user_name: formData.get('user') as string,
        status: formData.get('status') as "completed" | "pending" | "cancelled",
        category: formData.get('category') as string,
        receipt_url: formData.get('receipt_url') as string || null,
      };

      const { error } = await supabase
        .from('transactions')
        .update(updatedTransaction)
        .eq('id', currentTransaction.id);

      if (error) throw error;

      toast({
        title: "تم التعديل بنجاح",
        description: `تم تعديل المعاملة رقم ${currentTransaction.id} بنجاح`,
      });
      
      // إغلاق النافذة
      setIsEditDialogOpen(false);
      setCurrentTransaction(null);
      
      // إعادة تحميل البيانات
      await fetchTransactions();
    } catch (err: any) {
      console.error('خطأ في تعديل المعاملة:', err);
      toast({
        title: "فشل التعديل",
        description: err.message || "حصل خطأ أثناء تعديل المعاملة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // معالجة حذف معاملة
  const handleDeleteTransaction = async () => {
    if (!currentTransaction) return;
    
    setDeleting(true);
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', currentTransaction.id);

      if (error) throw error;

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف المعاملة رقم ${currentTransaction.id} بنجاح`,
      });
      
      // إغلاق النافذة
      setIsViewDialogOpen(false);
      setCurrentTransaction(null);
      
      // إعادة تحميل البيانات
      await fetchTransactions();
    } catch (err: any) {
      console.error('خطأ في حذف المعاملة:', err);
      toast({
        title: "فشل الحذف",
        description: err.message || "حصل خطأ أثناء حذف المعاملة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // تصدير البيانات
  const handleExport = () => {
    toast({
      title: "جاري التصدير",
      description: "سيتم تنزيل ملف Excel خلال لحظات",
    });
    
    // محاكاة التصدير
    setTimeout(() => {
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير البيانات إلى ملف Excel",
      });
    }, 1500);
  };

  // تحديث القائمة
  const handleRefresh = () => {
    fetchTransactions();
  };

  // الحصول على الفئات الفريدة
  const categories = [...new Set(transactions.map(t => t.category))];

  // حالة التحميل الأولي
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/20">
        <Card className="w-full max-w-md border-2 border-dashed border-primary/20">
          <CardContent className="pt-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري تحميل البيانات المالية...</h2>
            <p className="text-muted-foreground">برجاء الانتظار</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Wallet className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-primary mb-4">
            إدارة الرصيد المالي
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            تتبع جميع المعاملات المالية والإيرادات والمصروفات في نظامك بسهولة وأمان
          </p>
        </motion.div>

        {/* ملخص الرصيد */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">الرصيد الحالي</CardTitle>
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-green-700 mb-2">
                    {currentBalance.toLocaleString()} <span className="text-xl">ج.م</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentBalance >= 0 ? 'رصيد إيجابي' : 'رصيد سلبي'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">إجمالي الإيرادات</CardTitle>
                  <ArrowDownCircle className="h-6 w-6 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-blue-700 mb-2">
                    {totalCredits.toLocaleString()} <span className="text-xl">ج.م</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    من {filteredTransactions.filter(t => t.type === 'credit').length} معاملة
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">إجمالي المصروفات</CardTitle>
                  <ArrowUpCircle className="h-6 w-6 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-red-700 mb-2">
                    {totalDebits.toLocaleString()} <span className="text-xl">ج.م</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    من {filteredTransactions.filter(t => t.type === 'debit').length} معاملة
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
                  <CardTitle className="text-xl font-bold">فلاتر البحث والتصفية</CardTitle>
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
                    تحديث القائمة
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleExport}
                    className="gap-2 bg-white text-green-700 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4" />
                    تصدير Excel
                  </Button>
                  <Button 
                    onClick={() => {
                      setCurrentTransaction(null);
                      setIsAddDialogOpen(true);
                    }}
                    className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة معاملة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث بالرقم أو الاسم أو الملاحظات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-4 pr-10"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="كل الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    <SelectItem value="credit">إيداع (زيادة رصيد)</SelectItem>
                    <SelectItem value="debit">سحب (تقليل رصيد)</SelectItem>
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
                    <SelectItem value="cancelled">ملغى</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="كل الفئات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفئات</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* جدول المعاملات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50/80 p-5 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">قائمة المعاملات المالية</CardTitle>
                  <CardDescription className="mt-1 text-gray-600">
                    عرض {filteredTransactions.length} معاملة من إجمالي {transactions.length} معاملة
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                    الإيرادات: {filteredTransactions.filter(t => t.type === 'credit').length}
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 border border-red-200">
                    المصروفات: {filteredTransactions.filter(t => t.type === 'debit').length}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 border border-green-200">
                    مكتملة: {filteredTransactions.filter(t => t.status === 'completed').length}
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                    معلقة: {filteredTransactions.filter(t => t.status === 'pending').length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-2xl font-medium mb-2">مفيش معاملات</p>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo
                      ? 'مفيش معاملات تطابق معايير البحث والفلاتر الحالية. جرب غير المعايير أو امسح الفلاتر.'
                      : 'مفيش معاملات مالية مسجلة في النظام دلوقتي. اضغط على "إضافة معاملة" عشان تبدأ في تسجيل المعاملات.'}
                  </p>
                  <div className="mt-8">
                    <Button 
                      onClick={() => {
                        setCurrentTransaction(null);
                        setIsAddDialogOpen(true);
                      }}
                      className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white px-8 py-4 text-lg shadow-lg"
                    >
                      <Plus className="h-5 w-5" />
                      إضافة معاملة جديدة
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="text-right w-32 font-medium text-gray-700">رقم المعاملة</TableHead>
                        <TableHead className="text-right w-36 font-medium text-gray-700">التاريخ</TableHead>
                        <TableHead className="text-right w-40 font-medium text-gray-700">المبلغ</TableHead>
                        <TableHead className="text-right w-28 font-medium text-gray-700">النوع</TableHead>
                        <TableHead className="text-right w-32 font-medium text-gray-700">الفئة</TableHead>
                        <TableHead className="text-right w-32 font-medium text-gray-700">طريقة الدفع</TableHead>
                        <TableHead className="text-right min-w-[150px] font-medium text-gray-700">المستخدم/الطرف</TableHead>
                        <TableHead className="text-right min-w-[200px] font-medium text-gray-700">ملاحظات</TableHead>
                        <TableHead className="text-right w-36 font-medium text-gray-700">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction, index) => (
                        <motion.tr 
                          key={transaction.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={cn(
                            "border-b border-gray-100 hover:bg-gray-50/70 transition-colors",
                            transaction.status === 'cancelled' && 'bg-red-50/30'
                          )}
                        >
                          <TableCell className="font-medium text-primary">{transaction.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-gray-700">
                            {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell className={cn(
                            "font-bold text-lg",
                            transaction.type === "credit" ? "text-green-700" : "text-red-700"
                          )}>
                            {transaction.type === "credit" ? "+" : "-"}
                            {transaction.amount.toLocaleString()} <span className="text-base">ج.م</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              transaction.type === "credit" 
                                ? "bg-green-100 text-green-800 border border-green-200" 
                                : "bg-red-100 text-red-800 border border-red-200"
                            )}>
                              {transaction.type === "credit" ? (
                                <span className="flex items-center gap-1">
                                  <ArrowDownCircle className="h-3 w-3" />
                                  إيداع
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <ArrowUpCircle className="h-3 w-3" />
                                  سحب
                                </span>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 text-xs font-medium">
                              {transaction.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">{transaction.method}</TableCell>
                          <TableCell className="font-medium text-gray-800">{transaction.user_name}</TableCell>
                          <TableCell className="text-gray-600 max-w-[250px] truncate" title={transaction.notes}>
                            {transaction.notes}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCurrentTransaction(transaction);
                                  setIsViewDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCurrentTransaction(transaction);
                                  setIsEditDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0 hover:bg-green-50 text-green-700"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                  <p className="font-medium text-lg mb-2">نصائح لإدارة الرصيد المالي:</p>
                  <ul className="list-disc pr-5 space-y-2">
                    <li><span className="font-medium">التوثيق:</span> احرص على رفع صور الإيصالات لكل معاملة مالية لتسهيل المراجعة والتدقيق لاحقاً.</li>
                    <li><span className="font-medium">التصنيف الصحيح:</span> اختر الفئة المناسبة لكل معاملة لتسهيل إنشاء التقارير المالية الدقيقة.</li>
                    <li><span className="font-medium">المراجعة الدورية:</span> راجع قائمة المعاملات المعلقة بشكل دوري وأكملها أو الغها حسب الحاجة.</li>
                    <li><span className="font-medium">التحديث الفوري:</span> سجل كل المعاملات المالية فور حدوثها لضمان دقة البيانات المالية.</li>
                    <li><span className="font-medium">النسخ الاحتياطي:</span> قم بتصدير البيانات بشكل دوري كنسخة احتياطية لحماية المعلومات المالية.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* نافذة إضافة معاملة */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              إضافة معاملة مالية جديدة
            </DialogTitle>
            <DialogDescription className="mt-2 text-gray-600">
              أدخل تفاصيل المعاملة المالية الجديدة لإضافتها إلى النظام
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-5 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-date" className="text-gray-800 font-medium">التاريخ <span className="text-red-500">*</span></Label>
                <Input 
                  id="add-date" 
                  name="date" 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                  className="border border-gray-300 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-type" className="text-gray-800 font-medium">نوع المعاملة <span className="text-red-500">*</span></Label>
                <Select name="type" defaultValue="credit" required>
                  <SelectTrigger id="add-type" className="border border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">إيداع (دائن) - زيادة الرصيد</SelectItem>
                    <SelectItem value="debit">سحب (مدين) - تقليل الرصيد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-amount" className="text-gray-800 font-medium">المبلغ (ج.م) <span className="text-red-500">*</span></Label>
                <Input 
                  id="add-amount" 
                  name="amount" 
                  type="number" 
                  min="1" 
                  step="0.01"
                  placeholder="أدخل المبلغ" 
                  required 
                  className="border border-gray-300 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-method" className="text-gray-800 font-medium">طريقة الدفع <span className="text-red-500">*</span></Label>
                <Select name="method" defaultValue="cash" required>
                  <SelectTrigger id="add-method" className="border border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="online">دفع إلكتروني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-category" className="text-gray-800 font-medium">الفئة <span className="text-red-500">*</span></Label>
                <Select name="category" defaultValue="إيداع رواتب" required>
                  <SelectTrigger id="add-category" className="border border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="إيداع رواتب">إيداع رواتب</SelectItem>
                    <SelectItem value="إيداع تجار">إيداع تجار</SelectItem>
                    <SelectItem value="تحصيل شحنات">تحصيل شحنات</SelectItem>
                    <SelectItem value="رواتب مناديب">رواتب مناديب</SelectItem>
                    <SelectItem value="مصاريف تشغيلية">مصاريف تشغيلية</SelectItem>
                    <SelectItem value="مصاريف ثابتة">مصاريف ثابتة</SelectItem>
                    <SelectItem value="مصاريف صيانة">مصاريف صيانة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-status" className="text-gray-800 font-medium">الحالة <span className="text-red-500">*</span></Label>
                <Select name="status" defaultValue="completed" required>
                  <SelectTrigger id="add-status" className="border border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="cancelled">ملغى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="add-user" className="text-gray-800 font-medium">المستخدم/الطرف <span className="text-red-500">*</span></Label>
                <Input 
                  id="add-user" 
                  name="user" 
                  placeholder="اسم المستخدم أو الطرف" 
                  required 
                  className="border border-gray-300 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="add-notes" className="text-gray-800 font-medium">ملاحظات</Label>
                <Textarea 
                  id="add-notes" 
                  name="notes" 
                  placeholder="أي ملاحظات إضافية حول المعاملة..." 
                  className="min-h-[80px] border border-gray-300 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="add-receipt_url" className="text-gray-800 font-medium">رابط صورة الإيصال (اختياري)</Label>
                <Input 
                  id="add-receipt_url" 
                  name="receipt_url" 
                  type="url" 
                  placeholder="https://example.com/receipt.jpg" 
                  className="border border-gray-300 focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">يمكنك رفع الصورة على أي موقع مشاركة صور ووضع الرابط هنا</p>
              </div>
            </div>
            
            <DialogFooter className="pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1 h-11 text-base"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="flex-1 h-11 text-base bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
              >
                {submitting ? (
                  <>
                    <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 ml-2" />
                    إضافة المعاملة
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل معاملة */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Edit2 className="h-6 w-6 text-primary" />
              تعديل المعاملة المالية
            </DialogTitle>
            <DialogDescription className="mt-2 text-gray-600">
              عدل تفاصيل المعاملة المالية ثم اضغط حفظ التغييرات
            </DialogDescription>
          </DialogHeader>
          {currentTransaction && (
            <form onSubmit={handleEditTransaction} className="space-y-5 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date" className="text-gray-800 font-medium">التاريخ <span className="text-red-500">*</span></Label>
                  <Input 
                    id="edit-date" 
                    name="date" 
                    type="date" 
                    defaultValue={currentTransaction.date}
                    required 
                    className="border border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-type" className="text-gray-800 font-medium">نوع المعاملة <span className="text-red-500">*</span></Label>
                  <Select name="type" defaultValue={currentTransaction.type} required>
                    <SelectTrigger id="edit-type" className="border border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">إيداع (دائن) - زيادة الرصيد</SelectItem>
                      <SelectItem value="debit">سحب (مدين) - تقليل الرصيد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-amount" className="text-gray-800 font-medium">المبلغ (ج.م) <span className="text-red-500">*</span></Label>
                  <Input 
                    id="edit-amount" 
                    name="amount" 
                    type="number" 
                    min="1" 
                    step="0.01"
                    defaultValue={currentTransaction.amount}
                    required 
                    className="border border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-method" className="text-gray-800 font-medium">طريقة الدفع <span className="text-red-500">*</span></Label>
                  <Select name="method" defaultValue={currentTransaction.method} required>
                    <SelectTrigger id="edit-method" className="border border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                      <SelectItem value="check">شيك</SelectItem>
                      <SelectItem value="online">دفع إلكتروني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-category" className="text-gray-800 font-medium">الفئة <span className="text-red-500">*</span></Label>
                  <Select name="category" defaultValue={currentTransaction.category} required>
                    <SelectTrigger id="edit-category" className="border border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="إيداع رواتب">إيداع رواتب</SelectItem>
                      <SelectItem value="إيداع تجار">إيداع تجار</SelectItem>
                      <SelectItem value="تحصيل شحنات">تحصيل شحنات</SelectItem>
                      <SelectItem value="رواتب مناديب">رواتب مناديب</SelectItem>
                      <SelectItem value="مصاريف تشغيلية">مصاريف تشغيلية</SelectItem>
                      <SelectItem value="مصاريف ثابتة">مصاريف ثابتة</SelectItem>
                      <SelectItem value="مصاريف صيانة">مصاريف صيانة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-gray-800 font-medium">الحالة <span className="text-red-500">*</span></Label>
                  <Select name="status" defaultValue={currentTransaction.status} required>
                    <SelectTrigger id="edit-status" className="border border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                      <SelectItem value="cancelled">ملغى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-user" className="text-gray-800 font-medium">المستخدم/الطرف <span className="text-red-500">*</span></Label>
                  <Input 
                    id="edit-user" 
                    name="user" 
                    defaultValue={currentTransaction.user_name}
                    required 
                    className="border border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-notes" className="text-gray-800 font-medium">ملاحظات</Label>
                  <Textarea 
                    id="edit-notes" 
                    name="notes" 
                    defaultValue={currentTransaction.notes}
                    className="min-h-[80px] border border-gray-300 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-receipt_url" className="text-gray-800 font-medium">رابط صورة الإيصال (اختياري)</Label>
                  <Input 
                    id="edit-receipt_url" 
                    name="receipt_url" 
                    type="url" 
                    defaultValue={currentTransaction.receipt_url || ''}
                    placeholder="https://example.com/receipt.jpg" 
                    className="border border-gray-300 focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">يمكنك رفع الصورة على أي موقع مشاركة صور ووضع الرابط هنا</p>
                </div>
              </div>
              
              <DialogFooter className="pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setCurrentTransaction(null);
                  }}
                  className="flex-1 h-11 text-base"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 h-11 text-base bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
                >
                  {submitting ? (
                    <>
                      <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 ml-2" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة عرض تفاصيل المعاملة */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              تفاصيل المعاملة المالية
            </DialogTitle>
            <DialogDescription className="mt-2 text-gray-600">
              عرض تفاصيل المعاملة المالية بالكامل
            </DialogDescription>
          </DialogHeader>
          {currentTransaction && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem label="رقم المعاملة" value={currentTransaction.id} icon={<FileText className="h-4 w-4" />} />
                <DetailItem label="التاريخ" value={format(new Date(currentTransaction.date), 'EEEE، dd MMMM yyyy', { locale: ar })} icon={<Calendar className="h-4 w-4" />} />
                <DetailItem 
                  label="المبلغ" 
                  value={`${currentTransaction.type === 'credit' ? '+' : '-'}${currentTransaction.amount.toLocaleString()} ج.م`} 
                  icon={<Wallet className="h-4 w-4" />}
                  valueClass={currentTransaction.type === 'credit' ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}
                />
                <DetailItem 
                  label="النوع" 
                  value={currentTransaction.type === 'credit' ? 'إيداع' : 'سحب'} 
                  icon={currentTransaction.type === 'credit' ? <ArrowDownCircle className="h-4 w-4 text-green-600" /> : <ArrowUpCircle className="h-4 w-4 text-red-600" />}
                  valueClass={currentTransaction.type === 'credit' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}
                />
                <DetailItem label="الفئة" value={currentTransaction.category} icon={<Tag className="h-4 w-4" />} />
                <DetailItem label="طريقة الدفع" value={currentTransaction.method} icon={<CreditCard className="h-4 w-4" />} />
                <DetailItem label="المستخدم/الطرف" value={currentTransaction.user_name} icon={<User className="h-4 w-4" />} />
                <DetailItem 
                  label="الحالة" 
                  value={
                    currentTransaction.status === 'completed' ? 'مكتمل' : 
                    currentTransaction.status === 'pending' ? 'معلق' : 'ملغى'
                  } 
                  icon={
                    currentTransaction.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    currentTransaction.status === 'pending' ? <Clock className="h-4 w-4 text-yellow-600" /> : <X className="h-4 w-4 text-red-600" />
                  }
                  valueClass={
                    currentTransaction.status === 'completed' ? 'text-green-700 font-medium' : 
                    currentTransaction.status === 'pending' ? 'text-yellow-700 font-medium' : 'text-red-700 font-medium'
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-800 font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  الملاحظات
                </Label>
                <p className="text-gray-700 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                  {currentTransaction.notes || 'لا توجد ملاحظات'}
                </p>
              </div>
              
              {currentTransaction.receipt_url && (
                <div className="space-y-2">
                  <Label className="text-gray-800 font-medium flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" />
                    صورة الإيصال
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <a 
                      href={currentTransaction.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 font-medium flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      عرض صورة الإيصال
                    </a>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-gray-800 font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  معلومات إضافية
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">تاريخ الإنشاء:</span>
                    <p className="font-medium mt-1">{format(new Date(currentTransaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">تاريخ آخر تحديث:</span>
                    <p className="font-medium mt-1">{format(new Date(currentTransaction.updated_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsViewDialogOpen(false);
                setCurrentTransaction(null);
              }}
              className="h-11 text-base"
            >
              إغلاق
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsViewDialogOpen(false);
                setIsEditDialogOpen(true);
              }}
              className="h-11 text-base border-green-500 text-green-700 hover:bg-green-50"
            >
              <Edit2 className="h-4 w-4 ml-2" />
              تعديل
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTransaction}
              disabled={deleting}
              className="h-11 text-base"
            >
              {deleting ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin mr-2" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// مكون لعرض تفاصيل العنصر
const DetailItem = ({ label, value, icon, valueClass = "text-gray-800" }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClass?: string;
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-gray-600 text-sm">
      {icon}
      <span>{label}</span>
    </div>
    <p className={cn("font-medium", valueClass)}>{value}</p>
  </div>
);

// أيقونات مطلوبة
const Tag = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line x1="7" y1="7" x2="7" y2="7"></line>
  </svg>
);

const CreditCard = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
);

const Image = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <path d="M21 15l-5-5L5 21"></path>
  </svg>
);

const ExternalLink = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

export default BalanceManagement;