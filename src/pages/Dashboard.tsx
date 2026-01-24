import { Package, Truck, Clock, CheckCircle, Users, Wallet } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ShipmentChart from "@/components/dashboard/ShipmentChart";
import RecentShipments from "@/components/dashboard/RecentShipments";
import DelegatePerformance from "@/components/dashboard/DelegatePerformance";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بك، إليك نظرة عامة على النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="إجمالي الشحنات"
          value="850"
          icon={Package}
          trend={{ value: 12, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title="تم التسليم"
          value="540"
          icon={CheckCircle}
          trend={{ value: 8, isPositive: true }}
          variant="accent"
        />
        <StatCard
          title="قيد التوصيل"
          value="180"
          icon={Truck}
          variant="default"
        />
        <StatCard
          title="متأخرة"
          value="85"
          icon={Clock}
          trend={{ value: 5, isPositive: false }}
          variant="danger"
        />
        <StatCard
          title="المناديب"
          value="24"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="الرصيد"
          value="12,500"
          icon={Wallet}
          variant="warning"
        />
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
