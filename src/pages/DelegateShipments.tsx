import { useState } from "react";
import { User, Package, CheckCircle, Clock, TrendingUp, Phone, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Delegate {
  id: string;
  name: string;
  phone: string;
  city: string;
  avatar: string;
  stats: {
    total: number;
    delivered: number;
    pending: number;
    delayed: number;
  };
  shipments: {
    id: string;
    customer: string;
    city: string;
    status: string;
    amount: number;
  }[];
}

const delegates: Delegate[] = [
  {
    id: "DEL-001",
    name: "أحمد محمد",
    phone: "0512345678",
    city: "الرياض",
    avatar: "أ",
    stats: { total: 85, delivered: 72, pending: 8, delayed: 5 },
    shipments: [
      { id: "SHP-201", customer: "محمد علي", city: "الرياض", status: "delivered", amount: 250 },
      { id: "SHP-202", customer: "فاطمة سعيد", city: "الرياض", status: "transit", amount: 180 },
      { id: "SHP-203", customer: "خالد أحمد", city: "الرياض", status: "delayed", amount: 320 },
    ],
  },
  {
    id: "DEL-002",
    name: "خالد سعيد",
    phone: "0523456789",
    city: "جدة",
    avatar: "خ",
    stats: { total: 72, delivered: 58, pending: 10, delayed: 4 },
    shipments: [
      { id: "SHP-301", customer: "سارة محمد", city: "جدة", status: "delivered", amount: 420 },
      { id: "SHP-302", customer: "نورة خالد", city: "جدة", status: "pending", amount: 150 },
    ],
  },
  {
    id: "DEL-003",
    name: "عمر علي",
    phone: "0534567890",
    city: "الدمام",
    avatar: "ع",
    stats: { total: 65, delivered: 55, pending: 6, delayed: 4 },
    shipments: [
      { id: "SHP-401", customer: "يوسف علي", city: "الدمام", status: "delivered", amount: 280 },
    ],
  },
  {
    id: "DEL-004",
    name: "سعيد خالد",
    phone: "0545678901",
    city: "مكة",
    avatar: "س",
    stats: { total: 58, delivered: 48, pending: 7, delayed: 3 },
    shipments: [],
  },
];

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
};

const DelegateShipments = () => {
  const [selectedDelegate, setSelectedDelegate] = useState<Delegate>(delegates[0]);
  const [cityFilter, setCityFilter] = useState("all");

  const filteredDelegates = delegates.filter((d) => 
    cityFilter === "all" || d.city === cityFilter
  );

  const chartData = [
    { name: "تم التسليم", value: selectedDelegate.stats.delivered, color: "hsl(145, 65%, 42%)" },
    { name: "قيد التوصيل", value: selectedDelegate.stats.pending, color: "hsl(210, 90%, 55%)" },
    { name: "متأخر", value: selectedDelegate.stats.delayed, color: "hsl(0, 84%, 60%)" },
  ];

  const deliveryRate = Math.round((selectedDelegate.stats.delivered / selectedDelegate.stats.total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">شحنات المناديب</h1>
          <p className="text-muted-foreground">عرض وإدارة شحنات كل مندوب</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Delegates List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">المناديب</h3>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="الرياض">الرياض</SelectItem>
                  <SelectItem value="جدة">جدة</SelectItem>
                  <SelectItem value="الدمام">الدمام</SelectItem>
                  <SelectItem value="مكة">مكة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {filteredDelegates.map((delegate) => (
                <button
                  key={delegate.id}
                  onClick={() => setSelectedDelegate(delegate)}
                  className={cn(
                    "w-full p-3 rounded-lg text-right transition-all duration-200 flex items-center gap-3",
                    selectedDelegate.id === delegate.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
                    selectedDelegate.id === delegate.id
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary/10 text-primary"
                  )}>
                    {delegate.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{delegate.name}</p>
                    <p className={cn(
                      "text-sm truncate",
                      selectedDelegate.id === delegate.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}>
                      {delegate.city} • {delegate.stats.total} شحنة
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Delegate Profile & Stats */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Header */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex flex-wrap items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {selectedDelegate.avatar}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{selectedDelegate.name}</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{selectedDelegate.phone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedDelegate.city}
                  </span>
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold text-accent">{deliveryRate}%</span>
                </div>
                <p className="text-sm text-muted-foreground">نسبة التسليم</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-4 shadow-sm border border-border text-center">
              <Package className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{selectedDelegate.stats.total}</p>
              <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-sm border border-border text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold text-accent">{selectedDelegate.stats.delivered}</p>
              <p className="text-sm text-muted-foreground">تم التسليم</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-sm border border-border text-center">
              <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-500">{selectedDelegate.stats.pending}</p>
              <p className="text-sm text-muted-foreground">قيد التوصيل</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-sm border border-border text-center">
              <Clock className="h-8 w-8 mx-auto text-destructive mb-2" />
              <p className="text-2xl font-bold text-destructive">{selectedDelegate.stats.delayed}</p>
              <p className="text-sm text-muted-foreground">متأخرة</p>
            </div>
          </div>

          {/* Chart and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h3 className="font-semibold mb-4">توزيع الشحنات</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h3 className="font-semibold mb-4">الأداء</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>نسبة التسليم</span>
                    <span className="font-medium">{deliveryRate}%</span>
                  </div>
                  <Progress value={deliveryRate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>نسبة التأخير</span>
                    <span className="font-medium text-destructive">
                      {Math.round((selectedDelegate.stats.delayed / selectedDelegate.stats.total) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(selectedDelegate.stats.delayed / selectedDelegate.stats.total) * 100} 
                    className="h-2 [&>div]:bg-destructive" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shipments List */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">قائمة الشحنات</h3>
            </div>
            {selectedDelegate.shipments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>رقم الشحنة</th>
                      <th>العميل</th>
                      <th>المدينة</th>
                      <th>الحالة</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDelegate.shipments.map((shipment) => (
                      <tr key={shipment.id}>
                        <td className="font-medium text-primary">{shipment.id}</td>
                        <td>{shipment.customer}</td>
                        <td>{shipment.city}</td>
                        <td>
                          <span className={cn("status-badge", `status-${shipment.status}`)}>
                            {statusLabels[shipment.status]}
                          </span>
                        </td>
                        <td className="font-semibold">{shipment.amount} ر.س</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                لا توجد شحنات لعرضها
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelegateShipments;
