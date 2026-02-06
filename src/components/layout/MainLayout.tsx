import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const MainLayout = () => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Close sidebar on mobile by default
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Main Content */}
        <main 
          className={cn(
            "flex-1 pt-16 min-h-screen transition-all duration-300",
            // Desktop: shift content when sidebar is open
            !isMobile && isSidebarOpen ? "mr-72" : "mr-0"
          )}
        >
          <div className="p-3 sm:p-4 md:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;