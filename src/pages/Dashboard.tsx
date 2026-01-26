import { Package, Truck, Clock, CheckCircle, Users, Wallet } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ShipmentChart from "@/components/dashboard/ShipmentChart";
import RecentShipments from "@/components/dashboard/RecentShipments";
import DelegatePerformance from "@/components/dashboard/DelegatePerformance";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بك، إليك نظرة عامة على النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="إجمالي الشحنات"
              value={stats?.totalShipments.toString() || "0"}
              icon={Package}
              trend={{ value: 12, isPositive: true }}
              variant="primary"
            />
            <StatCard
              title="تم التسليم"
              value={stats?.delivered.toString() || "0"}
              icon={CheckCircle}
              trend={{ value: 8, isPositive: true }}
              variant="accent"
            />
            <StatCard
              title="قيد التوصيل"
              value={stats?.inTransit.toString() || "0"}
              icon={Truck}
              variant="default"
            />
            <StatCard
              title="متأخرة"
              value={stats?.delayed.toString() || "0"}
              icon={Clock}
              trend={{ value: 5, isPositive: false }}
              variant="danger"
            />
            <StatCard
              title="المناديب"
              value={stats?.totalDelegates.toString() || "0"}
              icon={Users}
              variant="default"
            />
            <StatCard
              title="الرصيد"
              value={stats?.totalBalance.toLocaleString() || "0"}
              icon={Wallet}
              variant="warning"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShipmentChart />
        <DelegatePerformance />
      </div>

      <RecentShipments />
    </div>
  );
};

export default Dashboard;
