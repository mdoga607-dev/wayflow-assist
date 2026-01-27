import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={() => {}} />
      <Sidebar />
      <main className="pt-16 min-h-screen transition-all duration-300 mr-64">
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
