import { Outlet } from "react-router-dom";
import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* الهيدر ثابت في الأعلى */}
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex">
        {/* السايدبار */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* المحتوى الرئيسي */}
        <main 
          className={cn(
            "flex-1 pt-16 min-h-screen transition-all duration-300",
            isSidebarOpen ? "mr-72" : "mr-0"
          )}
        >
          <div className="p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Overlay عند فتح القائمة على الموبايل */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;