import { NavLink, useLocation } from "react-router-dom";
import {
  Package,
  Truck,
  Clock,
  Download,
  ScanLine,
  Settings,
  PlusCircle,
  Users,
  BarChart3,
  Wallet,
  FileText,
  Home,
  UserCheck,
  Receipt,
  RefreshCcw,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
}

const menuItems = [
  { icon: Home, label: "لوحة التحكم", path: "/", roles: ["head_manager", "user"] },
  { icon: Package, label: "قائمة الشحنات", path: "/shipments", roles: ["head_manager", "user"] },
  { icon: Truck, label: "شحنات المناديب", path: "/delegate-shipments", roles: ["head_manager", "user"] },
  { icon: Clock, label: "الشحنات المتأخرة", path: "/delayed-shipments", roles: ["head_manager", "user"] },
  { icon: RefreshCcw, label: "تتبع الراجع", path: "/returns", roles: ["head_manager", "user"] },
  { icon: PlusCircle, label: "إضافة شحنة", path: "/add-shipment", roles: ["head_manager", "user"] },
  { icon: ScanLine, label: "مسح الشحنات", path: "/scan", roles: ["head_manager", "user"] },
  { icon: Download, label: "تصدير", path: "/export", roles: ["head_manager"] },
  { icon: BarChart3, label: "إحصائيات المناديب", path: "/delegate-stats", roles: ["head_manager"] },
  { icon: Wallet, label: "إدارة الرصيد", path: "/balance", roles: ["head_manager", "user"] },
  { icon: Users, label: "إدارة الشيبرز", path: "/shippers", roles: ["head_manager"] },
  { icon: UserCheck, label: "إدارة المناديب", path: "/delegates", roles: ["head_manager"] },
  { icon: Receipt, label: "أوراق الدفعات", path: "/payments", roles: ["head_manager"] },
  { icon: FileText, label: "التقارير", path: "/reports", roles: ["head_manager", "user"] },
  { icon: Shield, label: "إدارة المستخدمين", path: "/users", roles: ["head_manager"] },
  { icon: Settings, label: "الإعدادات", path: "/settings", roles: ["head_manager", "user"] },
];

const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const { role } = useAuth();

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) => {
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <aside
      className={cn(
        "fixed top-16 right-0 h-[calc(100vh-4rem)] gradient-sidebar transition-all duration-300 z-40 shadow-xl",
        isOpen ? "w-64" : "w-0 overflow-hidden"
      )}
    >
      <ScrollArea className="h-full py-4">
        <nav className="px-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "sidebar-link",
                  isActive && "active"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
