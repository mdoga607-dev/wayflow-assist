import { NavLink, useLocation } from "react-router-dom";
import React from "react";
import {
  Package, Truck, Clock, Download, ScanLine, Settings, PlusCircle,
  Users, BarChart3, Wallet, FileText, Home, UserCheck, Receipt,
  RefreshCcw, Shield, ChevronLeft, LayoutDashboard, Bell, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles: string[];
  count?: number;
}

interface MenuGroup {
  groupLabel: string;
  roles: string[];
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    groupLabel: "الرئيسية",
    roles: ["head_manager", "user"],
    items: [
      { icon: LayoutDashboard, label: "لوحة التحكم", path: "/", roles: ["head_manager", "user"] },
    ]
  },
  {
    groupLabel: "إدارة العمليات",
    roles: ["head_manager", "user"],
    items: [
      { icon: Package, label: "قائمة الشحنات", path: "/shipments", roles: ["head_manager", "user"] },
      { icon: PlusCircle, label: "إضافة شحنة", path: "/add-shipment", roles: ["head_manager", "user"] },
      { icon: Truck, label: "شحنات المناديب", path: "/delegate-shipments", roles: ["head_manager", "user"] },
      { icon: Clock, label: "الشحنات المتأخرة", path: "/delayed-shipments", roles: ["head_manager", "user"], count: 10 },
      { icon: RefreshCcw, label: "تتبع الراجع", path: "/returns", roles: ["head_manager", "user"] },
      { icon: ScanLine, label: "مسح الباركود", path: "/scan", roles: ["head_manager", "user"] },
      { icon: MapPin, label: "تتبع المناديب", path: "/track-delegates", roles: ["head_manager", "user"] },
      { icon: Bell, label: "تذكيرات المتأخرة", path: "/delayed-reminders", roles: ["head_manager", "user"] },
      { icon: Truck, label: "طلبات الاستلام", path: "/pickup-requests", roles: ["head_manager", "user"] },
    ]
  },
  {
    groupLabel: "الإدارة المالية",
    roles: ["head_manager", "user"],
    items: [
      { icon: Wallet, label: "إدارة الرصيد", path: "/balance", roles: ["head_manager", "user"], count: 15 },
      { icon: Receipt, label: "أوراق الدفعات", path: "/payments", roles: ["head_manager"] },
      { icon: BarChart3, label: "إحصائيات المناديب", path: "/delegate-stats", roles: ["head_manager"] },
      { icon: FileText, label: "التقارير", path: "/reports", roles: ["head_manager", "user"] },
    ]
  },
  {
    groupLabel: "الإعدادات والأمان",
    roles: ["head_manager"],
    items: [
      { icon: Users, label: "إدارة التجار", path: "/shippers", roles: ["head_manager"] },
      { icon: UserCheck, label: "إدارة المناديب", path: "/delegates", roles: ["head_manager"] },
      { icon: Shield, label: "المستخدمين والصلاحيات", path: "/users", roles: ["head_manager"] },
      { icon: Settings, label: "إعدادات النظام", path: "/settings", roles: ["head_manager", "user"] },
    ]
  }
];

const Sidebar = () => {
  const location = useLocation();
  const { role } = useAuth();

  return (
    <aside
      className="fixed top-16 right-0 h-[calc(100vh-4rem)] bg-black border-l border-red-700 z-40 shadow-2xl w-64"
    >
      <ScrollArea className="h-full">
        <nav className="p-4 space-y-4">
          {menuGroups.map((group, groupIdx) => {
            const hasGroupAccess = group.roles.includes(role || '');
            if (!hasGroupAccess) return null;

            return (
              <Accordion key={groupIdx} type="single" collapsible defaultValue={`group-${groupIdx}`}>
                <AccordionItem value={`group-${groupIdx}`} className="border-none">
                  <AccordionTrigger className="py-1 text-[10px] font-bold text-white/60 px-3 uppercase tracking-[2px] hover:no-underline">
                    {group.groupLabel}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-1">
                    {group.items.map((item) => {
                      if (!item.roles.includes(role || '')) return null;

                      const isActive = location.pathname === item.path;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] group",
                            isActive 
                              ? "bg-white text-black-600 shadow-[0_4px_12px_rgba(255,255,255,0.3)] font-semibold" 
                              : "text-white/80 hover:bg-red-700 hover:text-white"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5 group-hover:scale-110",
                            isActive ? "text-black-600" : "text-white/70"
                          )} />
                          <span className="truncate">{item.label}</span>
                          {item.count && (
                            <span 
                              className={cn(
                                "ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white",
                                item.count >= 15 ? "bg-green-500" : "bg-red-500"
                              )}
                            >
                              {item.count}
                            </span>
                          )}
                          {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_red]" />}
                        </NavLink>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;