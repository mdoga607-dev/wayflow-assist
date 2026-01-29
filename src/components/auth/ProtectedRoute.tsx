import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type AppRole = 'head_manager' | 'manager' | 'courier' | 'shipper' | 'user' | 'guest';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectPath?: string; // مسار التحويل عند عدم الصلاحية
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  redirectPath = "/unauthorized" 
}: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  // مراقبة حالة التحميل
  useEffect(() => {
    if (!loading) {
      setChecked(true);
    }
  }, [loading]);

  // حالة التحميل
  if (loading || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#d24b60] mx-auto mb-4" />
          <p className="text-white/60 font-medium">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجل دخول
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // معالجة المستخدم الضيف (لا يملك أي صلاحيات)
  if (role === 'guest') {
    // الضيف يرى فقط الصفحة الرئيسية أو صفحة محددة
    if (location.pathname !== '/' && location.pathname !== '/guest') {
      return <Navigate to="/guest" replace />;
    }
    return <>{children}</>;
  }

  // التحقق من الصلاحيات للمستخدمين الآخرين
  if (allowedRoles && allowedRoles.length > 0) {
    // المدير العام له صلاحيات كاملة
    if (role === 'head_manager') {
      return <>{children}</>;
    }

    // التحقق من الرتبة
    const isAllowed = role && allowedRoles.includes(role as AppRole);
    
    if (!isAllowed) {
      // تحديد مسار التحويل حسب نوع المستخدم
      let fallbackPath = redirectPath;
      
      if (role === 'shipper') {
        fallbackPath = '/shipper-dashboard'; // لوحة تحكم التاجر
      } else if (role === 'courier') {
        fallbackPath = '/courier-dashboard'; // لوحة تحكم المندوب
      } else if (role === 'user') {
        fallbackPath = '/user-dashboard'; // لوحة المستخدم العادي
      }
      
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;