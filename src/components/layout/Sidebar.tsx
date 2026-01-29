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
      { icon: Printer, label: "طباعة البوليصات", path: "/print-label", roles: ["head_manager", "manager"] },
      { icon: Truck, label: "شحنات المناديب", path: "/delegate-shipments", roles: ["head_manager", "manager"] },
      { icon: Clock, label: "الشحنات المتأخرة", path: "/delayed-shipments", roles: ["head_manager", "manager"] },
      { icon: RefreshCcw, label: "المرتجعات", path: "/returns", roles: ["head_manager", "manager"] },
      { icon: ScanLine, label: "قراءة الباركود", path: "/scan", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: UserCircle,
    label: "لوحة المندوب",
    path: "/delegate-dashboard",
    roles: ["head_manager", "manager", "courier"],
  },
  {
    icon: Wallet,
    label: "الحسابات",
    roles: ["head_manager", "manager"],
    children: [
      { icon: Wallet, label: "إدارة الأرصدة", path: "/balance", roles: ["head_manager", "manager"] },
      { icon: Receipt, label: "المستندات المالية", path: "/payments", roles: ["head_manager", "manager"] },
    ]
  },
  {
    icon: Users,
    label: "الأعضاء",
    roles: ["head_manager", "manager"],
    children: [
      { icon: UserCheck, label: "المناديب", path: "/delegates", roles: ["head_manager", "manager"] },
      { icon: Shield, label: "التجار", path: "/shippers", roles: ["head_manager", "manager"] },
      { icon: Users, label: "إدارة المستخدمين", path: "/admin-users", roles: ["head_manager"] },
    ]
  },
  {
    icon: BarChart3,
    label: "التقارير",
    path: "/reports",
    roles: ["head_manager", "manager"],
  },
  {
    icon: MapPin,
    label: "تتبع المناديب",
    path: "/track-delegates",
    roles: ["head_manager", "manager"],
  },
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