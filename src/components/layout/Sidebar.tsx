// src/components/layout/Sidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import { 
  Package, Truck, Clock, FileText, Users, MessageSquare, 
  Bell, MapPin, Home, Wallet, LayoutDashboard, Settings,
  ChevronDown, ChevronUp, Plus, ScanLine, RefreshCcw, BarChart3, Receipt, Shield,
  UserCheck, Printer, UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  roles: string[];
  count?: number;
  children?: MenuItem[];
}

// ✅ التصحيح الكامل: جميع المسارات تبدأ بـ /app حسب هيكل App.tsx
const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "الرئيسية",
    path: "/app/dashboard",
    roles: ["head_manager", "manager", "courier", "shipper", "user"],
  },
  {
    icon: Package,
    label: "الشحنات",
    roles: ["head_manager", "manager", "courier"],
    children: [
      { icon: Package, label: "كافة الشحنات", path: "/app/shipments", roles: ["head_manager", "manager", "courier"] },
      { icon: Plus, label: "إضافة شحنة", path: "/app/add-shipment", roles: ["head_manager", "manager"] },
      { icon: Printer, label: "طباعة البوليصات", path: "/app/print-labels", roles: ["head_manager", "manager"] },
      { icon: Truck, label: "شحنات المناديب", path: "/app/courier-shipments", roles: ["head_manager", "manager"] },
      { icon: Clock, label: "الشحنات المتأخرة", path: "/app/delayed-shipments", roles: ["head_manager", "manager"] },
      { icon: RefreshCcw, label: "المرتجعات", path: "/app/returns", roles: ["head_manager", "manager"] },
      { icon: ScanLine, label: "المسح الضوئي", path: "/app/scan", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: UserCircle,
    label: "لوحة المندوب",
    path: "/app/delegate-dashboard",
    roles: ["head_manager", "manager", "courier"],
  },
  {
    icon: FileText,
    label: "شيتات الشحنات",
    roles: ["head_manager", "manager"],
    children: [
      { icon: FileText, label: "شيتات البيك أب", path: "/app/sheets?sheet_type=pickup", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "شيتات المرتجعات", path: "/app/sheets?sheet_type=returned", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "شيتات المناديب", path: "/app/sheets?sheet_type=courier", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Wallet,
    label: "الحسابات",
    roles: ["head_manager", "manager"],
    children: [
      { icon: Wallet, label: "كافة العمليات المالية", path: "/app/balance", roles: ["head_manager", "manager"] },
      { icon: Receipt, label: "إضافة عملية مالية", path: "/app/balance/add", roles: ["head_manager", "manager"] },
      { icon: BarChart3, label: "تقارير التحصيلات", path: "/app/balance/collection-report", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Users,
    label: "الأعضاء",
    roles: ["head_manager", "manager"],
    children: [
      { icon: UserCheck, label: "المناديب", path: "/app/delegates", roles: ["head_manager", "manager"] },
      { icon: Shield, label: "التجار", path: "/app/shippers", roles: ["head_manager", "manager"] },
      { icon: Users, label: "إدارة المستخدمين", path: "/app/admin-users", roles: ["head_manager"] },
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
];

const Sidebar = () => {
  const location = useLocation();
  const { role, loading } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // تحسين أداء التحقق من الصلاحيات
  const hasAccess = useMemo(() => {
    return (roles: string[]) => {
      if (!role) return false;
      return roles.includes(role);
    };
  }, [role]);

  // ✅ التصحيح: دالة ذكية لتحديد العنصر النشط (تدعم المسارات والبارامترات)
  const isActivePath = (path?: string) => {
    if (!path) return false;
    
    // تقسيم المسار إلى جزء المسار وجزء الاستعلام
    const [basePath] = path.split('?');
    
    // التحقق من تطابق المسار الأساسي
    if (location.pathname === basePath) return true;
    
    // التحقق من المسارات الفرعية (مثل /app/balance/add)
    if (location.pathname.startsWith(`${basePath}/`)) return true;
    
    // التحقق الخاص لشيتات الشحنات (نفس المسار مع بارامترات مختلفة)
    if (basePath === '/app/sheets' && location.pathname === '/app/sheets') {
      // استخراج sheet_type من الـ URL الحالي
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
      className="fixed top-16 right-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-[#d24b60] to-[#a53a4b] z-40 shadow-2xl w-72 border-l border-[#b43f52]" 
      dir="rtl"
    >
      <ScrollArea className="h-full">
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
                          className={({ isActive: navActive }) => cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs transition-all",
                            (navActive || isChildActive) 
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