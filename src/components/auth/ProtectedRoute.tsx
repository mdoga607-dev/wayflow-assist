import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// 1. تحديث الأنواع لتشمل كل الرتب التي أضفناها سابقاً
type AppRole = 'head_manager' | 'manager' | 'courier' | 'shipper' | 'user' | 'guest';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // 2. حالة التحميل: مهمة جداً لانتظار رد Supabase بشأن الرتبة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#d24b60] mx-auto mb-4" />
          <p className="text-white/60 font-medium">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // 3. إذا لم يكن المستخدم مسجل دخول، حوله لصفحة الـ Auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 4. التحقق من الصلاحيات الأدوار
  if (allowedRoles && allowedRoles.length > 0) {
    // المدير العام (head_manager) له حق الوصول لكل شيء دائماً
    if (role === 'head_manager') {
      return <>{children}</>;
    }

    // التحقق إذا كانت رتبة المستخدم الحالية ضمن الأدوار المسموح لها بدخول هذه الصفحة
    const isAllowed = role && allowedRoles.includes(role as AppRole);

    if (!isAllowed) {
      // إذا لم يكن لديه صلاحية، حوله لصفحة "غير مصرح لك"
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;