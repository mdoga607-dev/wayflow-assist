import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
const data = [{
  name: "أحمد",
  delivered: 45,
  delayed: 5
}, {
  name: "محمد",
  delivered: 38,
  delayed: 8
}, {
  name: "خالد",
  delivered: 52,
  delayed: 3
}, {
  name: "عبدالله",
  delivered: 41,
  delayed: 7
}, {
  name: "سعيد",
  delivered: 35,
  delayed: 10
}];
const DelegatePerformance = () => {
  return <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <h3 className="text-lg font-semibold mb-4">أداء المناديب</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" className="">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={60} tick={{
            fontSize: 12
          }} />
            <Tooltip contentStyle={{
            backgroundColor: "hsl(0, 0%, 100%)",
            border: "1px solid hsl(220, 13%, 88%)",
            borderRadius: "8px",
            direction: "rtl"
          }} />
            <Bar dataKey="delivered" name="تم التسليم" fill="hsl(145, 65%, 42%)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="delayed" name="متأخر" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>;
};
export default DelegatePerformance;