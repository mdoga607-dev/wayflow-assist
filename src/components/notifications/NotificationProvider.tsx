import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "shipment_update" | "new_order" | "system";
  read: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
  returned: "مرتجع",
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Subscribe to shipment status changes via Supabase Realtime
    // This is a placeholder that will work once we have a shipments table
    const channel = supabase
      .channel("shipment-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shipments",
        },
        (payload) => {
          const oldStatus = payload.old?.status;
          const newStatus = payload.new?.status;
          const shipmentId = payload.new?.id;

          if (oldStatus !== newStatus && shipmentId) {
            const notification: Notification = {
              id: `notif-${Date.now()}`,
              title: "تحديث حالة الشحنة",
              message: `تم تغيير حالة الشحنة ${shipmentId} من "${statusLabels[oldStatus] || oldStatus}" إلى "${statusLabels[newStatus] || newStatus}"`,
              type: "shipment_update",
              read: false,
              createdAt: new Date(),
            };

            setNotifications((prev) => [notification, ...prev]);

            toast({
              title: notification.title,
              description: notification.message,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shipments",
        },
        (payload) => {
          const notification: Notification = {
            id: `notif-${Date.now()}`,
            title: "طلب شحنة جديد",
            message: `تم استلام طلب شحنة جديد برقم ${payload.new?.id}`,
            type: "new_order",
            read: false,
            createdAt: new Date(),
          };

          setNotifications((prev) => [notification, ...prev]);

          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
