import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const data = [
  { name: "تم التسليم", value: 540, color: "hsl(145, 65%, 42%)" },
  { name: "قيد التوصيل", value: 180, color: "hsl(210, 90%, 55%)" },
  { name: "متأخرة", value: 85, color: "hsl(0, 84%, 60%)" },
  { name: "راجع", value: 45, color: "hsl(45, 95%, 55%)" },
];

const ShipmentChart = () => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <h3 className="text-lg font-semibold mb-4">توزيع الشحنات</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 13%, 88%)",
                borderRadius: "8px",
                direction: "rtl",
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ direction: "rtl" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ShipmentChart;
