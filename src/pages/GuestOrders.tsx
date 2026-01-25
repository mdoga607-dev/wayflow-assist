import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Search, ShoppingCart, Phone, MapPin, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

// Demo orders data
const demoOrders = [
  {
    id: "ORD-001",
    trackingNumber: "TRK-2024-001",
    customerName: "أحمد محمد",
    phone: "01012345678",
    city: "القاهرة",
    address: "شارع التحرير، الدقي",
    status: "قيد التوصيل",
    amount: 450,
    date: "2024-01-20",
  },
  {
    id: "ORD-002",
    trackingNumber: "TRK-2024-002",
    customerName: "سارة أحمد",
    phone: "01098765432",
    city: "الإسكندرية",
    address: "شارع السلام، سموحة",
    status: "تم التسليم",
    amount: 320,
    date: "2024-01-19",
  },
  {
    id: "ORD-003",
    trackingNumber: "TRK-2024-003",
    customerName: "محمد علي",
    phone: "01123456789",
    city: "الجيزة",
    address: "شارع الهرم، فيصل",
    status: "في الطريق",
    amount: 580,
    date: "2024-01-18",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "تم التسليم":
      return "bg-green-500";
    case "قيد التوصيل":
      return "bg-blue-500";
    case "في الطريق":
      return "bg-yellow-500";
    case "متأخر":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const GuestOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);

  const filteredOrders = demoOrders.filter(
    (order) =>
      order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.includes(searchQuery) ||
      order.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">نظام إدارة الشحنات</h1>
              <p className="text-xs text-muted-foreground">صفحة الزوار</p>
            </div>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 ml-2" />
              تسجيل الدخول
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">تتبع شحنتك</h2>
          <p className="text-muted-foreground">أدخل رقم التتبع للبحث عن شحنتك أو طلب شحنة جديدة</p>
        </div>

        {/* Search */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث برقم التتبع أو اسم العميل أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button>
                <Search className="w-4 h-4 ml-2" />
                بحث
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={showRequestForm ? "default" : "outline"}
            onClick={() => setShowRequestForm(!showRequestForm)}
          >
            <ShoppingCart className="w-4 h-4 ml-2" />
            طلب شحنة جديدة
          </Button>
        </div>

        {/* Request Form */}
        {showRequestForm && (
          <Card className="max-w-2xl mx-auto mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                طلب شحنة جديدة
              </CardTitle>
              <CardDescription>أدخل بياناتك لطلب شحنة من شركتنا</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">الاسم الكامل</label>
                  <Input placeholder="أدخل اسمك" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">رقم الهاتف</label>
                  <Input placeholder="01xxxxxxxxx" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المدينة</label>
                  <Input placeholder="المدينة" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">العنوان التفصيلي</label>
                  <Input placeholder="العنوان بالتفصيل" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات إضافية</label>
                <Input placeholder="أي ملاحظات أو تفاصيل إضافية" />
              </div>
              <Button className="w-full">
                إرسال الطلب
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">الشحنات المتاحة</h3>
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{order.trackingNumber}</span>
                          <Badge className={`${getStatusColor(order.status)} text-white`}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.city}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-bold text-lg text-primary">{order.amount} ج.م</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GuestOrders;
