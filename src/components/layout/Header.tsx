import { Bell, LogOut, User, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  return (
    <header className="h-16 bg-header text-header-foreground flex items-center justify-between px-6 shadow-lg z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-header-foreground hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">ش</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">نظام الشحنات</h1>
            <p className="text-xs text-header-foreground/60">إدارة متكاملة</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن شحنة، عميل، أو رقم تتبع..."
            className="pr-10 bg-white/10 border-white/20 text-header-foreground placeholder:text-header-foreground/50 focus:bg-white/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-header-foreground hover:bg-white/10 relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-[10px] flex items-center justify-center">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-header-foreground hover:bg-white/10 gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden md:inline">أحمد محمد</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem>
              <User className="ml-2 h-4 w-4" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
