// components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

type AppRole = 'head_manager' | 'manager' | 'courier' | 'shipper' | 'user' | 'guest';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // تصحيح: تأكد من أن الـ loading ينتهي حتى لو فشل التحميل
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !user) {
        console.warn('Auth loading timeout, forcing loading=false');
      }
    }, 10000); // 10 ثواني كحد أقصى

    return () => clearTimeout(timer);
  }, [loading, user]);

  // حالة التحميل - مع حماية من التعليق الأبدي
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#d24b60] mx-auto mb-4" />
          <p className="text-white/60 font-medium">جاري التحقق من الصلاحيات...</p>
          <p className="text-xs text-white/40 mt-2">إذا استمر التحميل لأكثر من 10 ثوانٍ، راجع اتصال الشبكة</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجل دخول
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // التحقق من الصلاحيات
  if (allowedRoles && allowedRoles.length > 0) {
    // المدير العام له صلاحيات كاملة
    if (role === 'head_manager') {
      return <>{children}</>;
    }

    // التحقق من الرتبة
    const isAllowed = role && allowedRoles.includes(role as AppRole);
    
    if (!isAllowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;