import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  return (
    // أضفنا dir="rtl" لضمان تنسيق العناصر من اليمين لليسار
    <div className="min-h-screen bg-background" dir="rtl">
      {/* الهيدر ثابت في الأعلى بارتفاع 16 (4rem) */}
      <Header onToggleSidebar={() => {}} />
      
      <div className="flex">
        {/* السايدبار ثابت على اليمين بعرض w-72 */}
        <Sidebar />
        
        {/* المحتوى الرئيسي:
            1. pt-16 لتعويض ارتفاع الهيدر
            2. mr-72 لتعويض عرض السايدبار (يجب أن يطابق و-72 في ملف السايدبار)
            3. flex-1 ليأخذ باقي مساحة الشاشة
        */}
        <main className="flex-1 pt-16 min-h-screen transition-all duration-300 mr-72">
          <div className="p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;