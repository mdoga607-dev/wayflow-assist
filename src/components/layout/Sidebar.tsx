import { NavLink, useLocation } from "react-router-dom";
import { 
  Package, Truck, Clock, FileText, Users, MessageSquare, 
  Bell, MapPin, Home, Wallet, LayoutDashboard, Settings,
  ChevronDown, ChevronUp, Plus, ScanLine, RefreshCcw, BarChart3, Receipt, Shield,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  roles: string[];
  count?: number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "الرئيسية",
    path: "/dashboard",
    roles: ["head_manager", "manager", "courier", "shipper", "user"],
  },
  {
    icon: Package,
    label: "الشحنات",
    roles: ["head_manager", "manager", "courier"],
    children: [
      { icon: Package, label: "كافة الشحنات", path: "/shipments", roles: ["head_manager", "manager", "courier"] },
      { icon: Plus, label: "إضافة شحنة", path: "/add-shipment", roles: ["head_manager", "manager"] },
      { icon: Truck, label: "شحنات المناديب", path: "/courier-shipments", roles: ["head_manager", "manager"] },
      { icon: Clock, label: "الشحنات المتأخرة", path: "/late-shipments", roles: ["head_manager", "manager"], count: 10 },
      { icon: RefreshCcw, label: "متابعة المرتجعات", path: "/returned-tracking", roles: ["head_manager", "manager"] },
      { icon: ScanLine, label: "قراءة الباركود", path: "/scan-shipments", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: FileText,
    label: "شيتات الشحنات",
    roles: ["head_manager", "manager"],
    children: [
      { icon: FileText, label: "شيتات البيك أب", path: "/sheets/pickup", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "شيتات المرتجعات", path: "/sheets/returned", roles: ["head_manager", "manager"] },
      { icon: FileText, label: "شيتات المناديب", path: "/sheets/courier", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Wallet,
    label: "الحسابات",
    roles: ["head_manager", "manager"],
    children: [
      { icon: Wallet, label: "كافة العمليات المالية", path: "/balance", roles: ["head_manager", "manager"] },
      { icon: Receipt, label: "إضافة عملية مالية", path: "/balance/add", roles: ["head_manager", "manager"] },
      { icon: BarChart3, label: "تقارير التحصيلات", path: "/balance/collection-report", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Users,
    label: "الأعضاء",
    roles: ["head_manager", "manager"],
    children: [
      { icon: Users, label: "كافة الأعضاء", path: "/users/members", roles: ["head_manager", "manager"] },
      { icon: UserCheck, label: "مناديب التوصيل", path: "/users/couriers", roles: ["head_manager", "manager"] },
      { icon: Shield, label: "الراسلين (التجار)", path: "/users/shippers", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Bell,
    label: "الملاحظات والشكاوى",
    roles: ["head_manager", "manager"],
    count: 17,
    children: [
      { icon: MessageSquare, label: "طلبات العملاء", path: "/requests", roles: ["head_manager", "manager"], count: 15 },
      { icon: Bell, label: "الشكاوى", path: "/complaints", roles: ["head_manager", "manager"], count: 2 },
    ]
  },
  {
    icon: MapPin,
    label: "المناطق والفروع",
    roles: ["head_manager", "manager"],
    children: [
      { icon: MapPin, label: "المحافظات والمدن", path: "/places", roles: ["head_manager", "manager"] },
      { icon: Home, label: "عرض الفروع", path: "/stores", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Settings,
    label: "إعدادات النظام",
    path: "/settings",
    roles: ["head_manager"],
  }
];

const Sidebar = () => {
  const location = useLocation();
  const { role, loading } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  if (loading) return null;

  const hasAccess = (roles: string[]) => {
    return role ? roles.includes(role) : false;
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="fixed top-16 right-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-[#d24b60] to-[#a53a4b] z-40 shadow-2xl w-72 border-l border-[#b43f52]" dir="rtl">
      <ScrollArea className="h-full">
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            if (!hasAccess(item.roles)) return null;
            
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openGroups[item.label] ?? false;
            
            // تحقق إذا كان المسار الحالي يطابق العنصر أو أحد أبنائه
            const isActive = hasChildren 
              ? item.children?.some(child => child.path && location.pathname === child.path)
              : item.path && location.pathname === item.path;

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
                      <span className="text-sm">{item.label}</span>
                      {item.count && !isOpen && (
                        <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                ) : (
                  <NavLink
                    to={item.path || "#"}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      isActive ? "bg-white text-[#d24b60] shadow-xl font-bold" : "text-white/90 hover:bg-white/10"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{item.label}</span>
                  </NavLink>
                )}

                {hasChildren && isOpen && (
                  <div className="mt-1 space-y-1 pr-2 animate-in slide-in-from-top-2 duration-200">
                    {item.children?.map((child) => {
                      if (!hasAccess(child.roles)) return null;
                      const isChildActive = location.pathname === child.path;
                      
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path || "#"}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs transition-all",
                            isChildActive ? "bg-white/30 text-white font-bold" : "text-white/80 hover:bg-white/10"
                          )}
                        >
                          <child.icon className="h-4 w-4" />
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