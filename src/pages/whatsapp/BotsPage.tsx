/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Plus, Search, Play, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const BotsPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBots([
        { 
          id: '1', 
          name: 'روبوت خدمة العملاء', 
          status: 'نشط', 
          conversations: 1245, 
          responseRate: '98%', 
          lastActive: '2026-01-29 14:30'
        },
        { 
          id: '2', 
          name: 'روبوت المبيعات', 
          status: 'نشط', 
          conversations: 876, 
          responseRate: '95%', 
          lastActive: '2026-01-29 13:15'
        },
        { 
          id: '3', 
          name: 'روبوت المتابعة', 
          status: 'متوقف', 
          conversations: 320, 
          responseRate: '89%', 
          lastActive: '2026-01-28 09:45'
        },
      ]);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            Chat Bots للواتساب
          </h1>
          <p className="text-muted-foreground mt-1">إدارة روبوتات المحادثة التلقائية للواتساب</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء روبوت جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة الروبوتات</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم الروبوت..."
                className="pl-4 pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الروبوت</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>عدد المحادثات</TableHead>
                  <TableHead>معدل الاستجابة</TableHead>
                  <TableHead>آخر تفاعل</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bots.map((bot) => (
                  <TableRow key={bot.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{bot.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bot.status === 'نشط' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bot.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{bot.conversations.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        parseInt(bot.responseRate) >= 95
                          ? 'bg-green-100 text-green-800'
                          : parseInt(bot.responseRate) >= 90
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bot.responseRate}
                      </span>
                    </TableCell>
                    <TableCell>{bot.lastActive}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Play className="h-3 w-3 mr-1" />
                          تشغيل
                        </Button>
                        <Button variant="outline" size="sm">
                          <Square className="h-3 w-3 mr-1" />
                          إيقاف
                        </Button>
                        <Button variant="outline" size="sm">تعديل</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotsPage;