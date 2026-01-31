import { Package, Truck, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function GuestLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            نظام إدارة الشحنات المتكامل
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            حل متكامل لإدارة الشحنات والتتبع والتحصيلات لتجارك وعملائك
          </p>
          <Button 
            onClick={() => navigate('/app/dashboard')}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
    >
         تتبع شحنتي
      </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { icon: Package, title: 'تتبع الشحنات', desc: 'تتبع شحناتك في الوقت الحقيقي' },
            { icon: Truck, title: 'إدارة المناديب', desc: 'تحكم كامل بمناديب التوصيل' },
            { icon: MapPin, title: 'تغطية كاملة', desc: 'جميع محافظات مصر' },
            { icon: Clock, title: 'تقارير فورية', desc: 'تقارير مفصلة عن الأداء' }
          ].map((item, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">{item.title}</h3>
                <p className="text-center text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">لماذا تختار نظامنا؟</h2>
          <div className="space-y-4 text-center">
            <p>✓ واجهة عربية بالكامل</p>
            <p>✓ دعم فني مصري متاح 24/7</p>
            <p>✓ تكامل مع جميع شركات الشحن في مصر</p>
            <p>✓ تقارير مالية دقيقة</p>
            <p>✓ خرائط دقيقة لتغطية جميع المحافظات</p>
          </div>
        </div>
      </div>
    </div>
  );
}