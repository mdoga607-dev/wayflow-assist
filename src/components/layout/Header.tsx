import { 
  Menu, Search, Bell, MessageSquare, User, LogOut, 
  ChevronDown, Smartphone, QrCode, Download, Loader2, Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import { toast } from "sonner"; // تأكد من وجود مكتبة التنبيهات أو استبدلها بـ alert

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- وظيفة تسجيل الخروج ---
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // --- وظيفة معالجة ملف الإكسيل ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // هنا يمكنك إرسال المصفوفة 'data' إلى قاعدة البيانات مباشرة
        console.log("البيانات الجاهزة للرفع:", data);
        
        toast.success(`تم قراءة ${data.length} صف بنجاح جاري المعالجة...`);
        
        // مثال: await supabase.from('shipments').insert(data);
        
      } catch (err) {
        toast.error("خطأ في صيغة ملف الإكسيل");
        console.error(err);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; // تصفير الإدخال
      }
    };

    reader.readAsBinaryString(file);
  };

  const getRoleName = (role: string | null) => {
    switch (role) {
      case 'head_manager': return 'مدير عام';
      case 'manager': return 'مدير فرع';
      case 'courier': return 'مندوب توصيل';
      case 'shipper': return 'تاجر';
      default: return 'مستخدم';
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'head_manager': return 'bg-[#1a7061] text-white';
      case 'manager': return 'bg-[#317896] text-white';
      case 'courier': return 'bg-[#d24b60] text-white';
      case 'shipper': return 'bg-[#6a5acd] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'مستخدم';

  return (
    <header 
      className="h-16 text-white flex items-center justify-between px-6 shadow-lg z-50 fixed top-0 w-full"
      style={{ background: 'linear-gradient(90deg, #1a7061 0%, #317896 100%)' }}
    >
      {/* القسم الأيمن: القائمة واللوجو */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-[#000000] font-bold text-xl">ع</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-none">العلماية للشحن</h1>
            <p className="text-[10px] text-white/70">نظام الإدارة المتكامل</p>
          </div>
        </div>
      </div>

      {/* القسم الأوسط: البحث */}
      <div className="flex-1 max-w-xl mx-4 hidden lg:block">
        <div className="relative group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 group-focus-within:text-white transition-colors" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم البوليصة أو الموبايل..."
            className="pr-10 pl-4 bg-white/10 border-white/20 text-white placeholder:text-white/50 
                      focus:bg-white/20 focus:ring-1 focus:ring-white/30 h-10 text-xs text-right transition-all"
            dir="rtl"
          />
        </div>
      </div>

      {/* القسم الأيسر: الأزرار والبروفايل */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* زر رفع إكسيل المبرمج */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-white hover:bg-white/10 gap-2 h-10 px-3 transition-all">
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              <span className="hidden md:inline text-sm font-medium">رفع إكسيل</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="text-right">
            <DialogHeader>
              <DialogTitle className="text-right">استيراد شحنات من ملف Excel</DialogTitle>
            </DialogHeader>
            <div 
              className="mt-4 p-10 border-2 border-dashed rounded-2xl text-center bg-gray-50 hover:bg-gray-100 hover:border-[#1a7061] cursor-pointer transition-all group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Download className="h-12 w-12 mx-auto text-gray-400 group-hover:text-[#1a7061] mb-4 transition-colors" />
              <p className="text-sm font-bold text-gray-700">اضغط هنا أو اسحب الملف لرفعه</p>
              <p className="text-xs text-gray-500 mt-2">صيغ الملفات المدعومة: .xlsx, .xls</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleExcelUpload} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* زر إضافة شحنة */}
        <Button 
          variant="secondary" 
          className="bg-white/10 text-white hover:bg-white/20 border-none gap-2 h-10 px-4 hidden sm:flex"
          onClick={() => navigate('/add-shipment')}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">إضافة شحنة</span>
        </Button>

        {/* أيقونات التنبيهات */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full border border-[#1a7061]" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hidden md:flex">
            <Smartphone className="h-5 w-5 text-green-400" />
          </Button>
        </div>

        {/* قائمة المستخدم */}
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-white hover:bg-white/10 gap-3 h-12 pr-2">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold leading-none mb-1">{displayName}</span>
                <Badge className={`text-[9px] px-1 py-0 h-4 border-none ${getRoleBadgeColor(role)}`}>
                  {getRoleName(role)}
                </Badge>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/30 shadow-sm">
                <User className="h-5 w-5" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 mt-2">
            <div className="p-3 text-right bg-muted/50 rounded-t-md border-b">
              <p className="font-bold text-sm">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem className="cursor-pointer flex justify-between p-2.5">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>الملف الشخصي</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer flex justify-between p-2.5">
              <span className="text-green-600 font-bold">1,250.00 ر.س</span>
              <span>رصيد المحفظة</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 cursor-pointer flex justify-between p-2.5 font-medium hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;