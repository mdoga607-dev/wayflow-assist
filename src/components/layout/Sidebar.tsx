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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  isOpen: boolean;
}

const menuItems = [
  { icon: Home, label: "لوحة التحكم", path: "/" },
  { icon: Package, label: "قائمة الشحنات", path: "/shipments" },
  { icon: Truck, label: "شحنات المناديب", path: "/delegate-shipments" },
  { icon: Clock, label: "الشحنات المتأخرة", path: "/delayed-shipments" },
  { icon: RefreshCcw, label: "تتبع الراجع", path: "/returns" },
  { icon: PlusCircle, label: "إضافة شحنة", path: "/add-shipment" },
  { icon: ScanLine, label: "مسح الشحنات", path: "/scan" },
  { icon: Download, label: "تصدير", path: "/export" },
  { icon: BarChart3, label: "إحصائيات المناديب", path: "/delegate-stats" },
  { icon: Wallet, label: "إدارة الرصيد", path: "/balance" },
  { icon: Users, label: "إدارة الشيبرز", path: "/shippers" },
  { icon: UserCheck, label: "إدارة المناديب", path: "/delegates" },
  { icon: Receipt, label: "أوراق الدفعات", path: "/payments" },
  { icon: FileText, label: "التقارير", path: "/reports" },
  { icon: Settings, label: "الإعدادات", path: "/settings" },
];

const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed top-16 right-0 h-[calc(100vh-4rem)] gradient-sidebar transition-all duration-300 z-40 shadow-xl",
        isOpen ? "w-64" : "w-0 overflow-hidden"
      )}
    >
      <ScrollArea className="h-full py-4">
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
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
