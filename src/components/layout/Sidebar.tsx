// src/components/layout/Sidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import { 
  Package, Truck, Clock, FileText, Users, MessageSquare, 
  Bell, MapPin, Home, Wallet, LayoutDashboard, Settings,
  ChevronDown, ChevronUp, Plus, ScanLine, RefreshCcw, BarChart3, Receipt, Shield,
  UserCheck, Printer, UserCircle, Archive, Building2, Layers, AlertCircle,
  ListChecks, Database, MessageCircle, Bot, AlertTriangle, Info, FileSpreadsheet, Search, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  roles: string[];
  count?: number;
  children?: MenuItem[];
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "الرئيسية",
    path: "/app/dashboard",
    roles: ["head_manager", "manager", "courier", "shipper", "user"],
  },
  {
    icon: UserCircle,
    label: "الملف الشخصي",
    roles: ["head_manager", "manager", "courier", "shipper", "user"],
    children: [
      { icon: UserCircle, label: "الملف الشخصي", path: "/app/profile", roles: ["head_manager", "manager", "courier", "shipper", "user"] },
      { icon: Wallet, label: "رصيد المحفظة", path: "/app/profile/wallet", roles: ["head_manager", "manager", "courier", "shipper", "user"] },
      { icon: Settings, label: "تغيير كلمة المرور", path: "/app/profile/change-password", roles: ["head_manager", "manager", "courier", "shipper", "user"] },
      { icon: AlertCircle, label: "حذف الحساب", path: "/app/profile/delete-account", roles: ["head_manager", "manager", "courier", "shipper", "user"] },
    ]
  },
  {
    icon: Package,
    label: "الشحنات",
    roles: ["head_manager", "manager", "courier"],
    children: [
      { icon: Package, label: "كافة الشحنات", path: "/app/shipments", roles: ["head_manager", "manager", "courier"] },
      { icon: Plus, label: "إضافة شحنة", path: "/app/add-shipment", roles: ["head_manager", "manager"] },
      { icon: ScanLine, label: "فحص الشحنات بالباركود", path: "/app/check-shipments", roles: ["head_manager", "manager"] },
      { icon: ScanLine, label: "قراءة الباركود", path: "/app/scan", roles: ["head_manager", "manager"] },
      { icon: Truck, label: "طلبات البيك أب", path: "/app/pickup-requests", roles: ["head_manager", "manager"] },
      { icon: Plus, label: "إضافة طلب بيك أب", path: "/app/pickup-requests/add", roles: ["head_manager", "manager"] },
      { icon: Truck, label: "شحنات المناديب", path: "/app/courier-shipments", roles: ["head_manager", "manager"] },
      { icon: Clock, label: "الشحنات المتأخرة", path: "/app/delayed-shipments", roles: ["head_manager", "manager"] },
      { icon: RefreshCcw, label: "المرتجعات", path: "/app/returns", roles: ["head_manager", "manager"] },
      { icon: AlertCircle, label: "شحنات بدون مناطق", path: "/app/shipments-without-areas", roles: ["head_manager", "manager"] },
      { icon: Package, label: "إدارة الشحنات", path: "/app/shipments-management", roles: ["head_manager", "manager", "courier"] },
      { icon: FileSpreadsheet, label: "رفع Excel", path: "/app/excel-upload", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "تصدير الشحنات", path: "/app/export-shipments", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: FileText,
    label: "شيتات الشحنات",
    roles: ["head_manager", "manager"],
    children: [
      { icon: FileText, label: "شيتات المناديب", path: "/app/sheets?sheet_type=courier", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "شيتات البيك أب", path: "/app/sheets/pickup", roles: ["head_manager", "manager"] },
      { icon: Plus, label: "إنشاء شيت بيك أب", path: "/app/sheets/create-pickup", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "شيتات المرتجعات", path: "/app/sheets?sheet_type=returned", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "شيتات السفر", path: "/app/sheets?sheet_type=travel", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "شيتات المرتجعات (سفر)", path: "/app/sheets?sheet_type=returned_travel", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Wallet,
    label: "الحسابات",
    roles: ["head_manager", "manager"],
    children: [
      { icon: Wallet, label: "كافة العمليات المالية", path: "/app/balance", roles: ["head_manager", "manager"] },
      { icon: Receipt, label: "إضافة عملية مالية", path: "/app/balance/add", roles: ["head_manager", "manager"] },
      { icon: BarChart3, label: "تقارير التوريدات", path: "/app/balance/payment-report", roles: ["head_manager", "manager"] },
      { icon: BarChart3, label: "تقارير التحصيلات", path: "/app/balance/collection-report", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "شيتات التوريد النقدي", path: "/app/payments", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Users,
    label: "الأعضاء",
    roles: ["head_manager", "manager"],
    children: [
      { icon: UserCheck, label: "كافة المناديب", path: "/app/delegates", roles: ["head_manager", "manager"] },
      { icon: Plus, label: "إضافة مندوب جديد", path: "/app/delegates/add", roles: ["head_manager", "manager"] },
      { icon: Shield, label: "كافة التجار", path: "/app/shippers", roles: ["head_manager", "manager"] },
      { icon: Plus, label: "إضافة تاجر جديد", path: "/app/shippers/add", roles: ["head_manager", "manager"] },
      { icon: Users, label: "إدارة المستخدمين", path: "/app/admin-users", roles: ["head_manager"] },
      { icon: BarChart3, label: "مؤشرات أداء المناديب", path: "/app/delegates/kpis", roles: ["head_manager", "manager"] },
      { icon: BarChart3, label: "إحصائيات المناديب", path: "/app/delegates/shipments", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: AlertTriangle,
    label: "الشكاوى",
    roles: ["head_manager", "manager"],
    children: [
      { icon: MessageSquare, label: "كافة الشكاوى", path: "/app/complaints", roles: ["head_manager", "manager"] },
      { icon: Archive, label: "أرشيف الشكاوى", path: "/app/complaints/archive", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: MapPin,
    label: "المناطق",
    roles: ["head_manager", "manager"],
    children: [
      { icon: Layers, label: "المحافظات", path: "/app/areas/governorates", roles: ["head_manager", "manager"] },
      { icon: MapPin, label: "المناطق", path: "/app/areas", roles: ["head_manager", "manager"] },
      { icon: Plus, label: "تقسيم المناطق", path: "/app/areas/divide", roles: ["head_manager", "manager"] },
      { icon: Search, label: "الكلمات الدلالية للمناطق", path: "/app/areas/keywords", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Building2,
    label: "المتاجر",
    roles: ["head_manager", "manager"],
    children: [
      { icon: Building2, label: "عرض المتاجر", path: "/app/stores", roles: ["head_manager", "manager"] },
      { icon: Plus, label: "إضافة متجر", path: "/app/stores/add", roles: ["head_manager", "manager"] },
      { icon: Database, label: "جرد الشحنات", path: "/app/inventory", roles: ["head_manager", "manager"] },
      { icon: ListChecks, label: "عمليات جرد الشحنات", path: "/app/inventory/log", roles: ["head_manager", "manager"] },
      { icon: BarChart3, label: "داش بورد المتاجر", path: "/app/stores/dashboard", roles: ["head_manager", "manager"] },
      { icon: Clock, label: "أوقات عمل المتاجر", path: "/app/stores/timings", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: MessageCircle,
    label: "حملات الواتساب",
    roles: ["head_manager", "manager"],
    children: [
      { icon: MessageCircle, label: "كافة حملات الواتساب", path: "/app/whatsapp/campaigns", roles: ["head_manager", "manager"] },
      { icon: MessageCircle, label: "حملات الواتس اب (الخاصة بي)", path: "/app/whatsapp/my-campaigns", roles: ["head_manager", "manager"] },
      { icon: Plus, label: "اضافة حملة جديدة", path: "/app/whatsapp/add-campaign", roles: ["head_manager", "manager"] },
      { icon: Bot, label: "عرض ال Chat Bots", path: "/app/whatsapp/bots", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "نصوص الواتس المحفوظة", path: "/app/whatsapp/templates", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: ListChecks,
    label: "المهام",
    roles: ["head_manager", "manager"],
    children: [
      { icon: ListChecks, label: "كافة المهام", path: "/app/tasks", roles: ["head_manager", "manager"] },
      { icon: Plus, label: "اضافة مهمة", path: "/app/tasks/add", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: BarChart3,
    label: "التقارير",
    path: "/app/reports",
    roles: ["head_manager", "manager"],
  },
  {
    icon: MapPin,
    label: "تتبع المناديب",
    path: "/app/track-delegates",
    roles: ["head_manager", "manager"],
  },
  {
    icon: Settings,
    label: "الإعدادات",
    roles: ["head_manager"],
    children: [
      { icon: Settings, label: "إعدادات عامة", path: "/app/settings/general", roles: ["head_manager"] },
      { icon: Shield, label: "صلاحيات المستخدمين", path: "/app/settings/roles", roles: ["head_manager"] },
    ]
  },
];

const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const location = useLocation();
  const { role, loading } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const hasAccess = useMemo(() => {
    return (roles: string[]) => {
      if (!role) return false;
      return roles.includes(role);
    };
  }, [role]);

  const isActivePath = (path?: string) => {
    if (!path) return false;
    
    const [basePath] = path.split('?');
    
    if (location.pathname === basePath) return true;
    if (location.pathname.startsWith(`${basePath}/`)) return true;
    
    if (basePath === '/app/sheets' && location.pathname === '/app/sheets') {
      const currentParams = new URLSearchParams(location.search);
      const targetParams = new URLSearchParams(path.split('?')[1] || '');
      return currentParams.get('sheet_type') === targetParams.get('sheet_type');
    }
    
    return false;
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  if (loading) return null;

  return (
    <aside 
      className={cn(
        "fixed top-16 right-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-[#19026d] to-[#040127] z-40 shadow-2xl border-l border-[#b43f52] transition-all duration-300",
        isOpen ? "w-72 translate-x-0" : "w-72 translate-x-full lg:w-0 lg:translate-x-0"
      )}
      dir="rtl"
    >
      {/* Logo and Close Button */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-[#19026d] font-bold text-xl">ع</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">العلماية للشحن</h2>
            <p className="text-white/60 text-xs">نظام الإدارة المتكامل</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-5rem)]">
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            if (!hasAccess(item.roles)) return null;
            if (!item.path && (!item.children || item.children.length === 0)) return null;
            
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openGroups[item.label] ?? false;
            const isActive = hasChildren 
              ? item.children?.some(child => child.path && isActivePath(child.path)) 
              : isActivePath(item.path);

            return (
              <div key={item.label} className="mb-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 rounded-xl text-right transition-all",
                      isActive ? "bg-white/20 text-white shadow-lg font-bold" : "text-white/90 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.count && !isOpen && (
                        <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-white" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-white/70" />
                    )}
                  </button>
                ) : item.path ? (
                  <NavLink
                    to={item.path}
                    end
                    className={({ isActive: navActive }) => cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      (navActive || isActivePath(item.path)) 
                        ? "bg-white text-[#d24b60] shadow-xl font-bold" 
                        : "text-white/90 hover:bg-white/10"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.count && (
                      <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full ms-auto">
                        {item.count}
                      </span>
                    )}
                  </NavLink>
                ) : null}

                {hasChildren && isOpen && (
                  <div className="mt-1 space-y-1 pr-2 animate-in slide-in-from-top-2 duration-200">
                    {item.children?.map((child) => {
                      if (!hasAccess(child.roles) || !child.path) return null;
                      const isChildActive = isActivePath(child.path);
                      
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          end
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-2.5 text-xs rounded-lg transition-all",
                            isChildActive
                              ? "bg-white/30 text-white font-bold"
                              : "text-white/80 hover:bg-white/10"
                          )}
                        >
                          <child.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{child.label}</span>
                          {child.count && (
                            <span className="bg-white text-[#d24b60] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              {child.count}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;