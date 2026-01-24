import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent" | "warning" | "danger";
}

const variantStyles = {
  default: "bg-card",
  primary: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
  accent: "bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20",
  warning: "bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20",
  danger: "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20",
};

const iconStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  warning: "bg-yellow-500 text-white",
  danger: "bg-destructive text-destructive-foreground",
};

const StatCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) => {
  return (
    <div className={cn("stat-card", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-sm mt-2 flex items-center gap-1",
                trend.isPositive ? "text-accent" : "text-destructive"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">من الأمس</span>
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
