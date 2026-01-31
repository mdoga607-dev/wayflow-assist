/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Search, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && role && !['head_manager', 'manager'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTemplates([
        { 
          id: '1', 
          name: 'تأكيد الطلب', 
          category: 'مبيعات', 
          usageCount: 1245, 
          lastUsed: '2026-01-29',
          content: 'مرحباً {name}، تم استلام طلبك #{order} وسيتم توصيله خلال 24 ساعة. المبلغ: {amount} ر.س'
        },
        { 
          id: '2', 
          name: 'تذكير بالدفع', 
          category: 'تحصيل', 
          usageCount: 876, 
          lastUsed: '2026-01-28',
          content: 'عزيزي {name}، نود تذكيرك بسداد مبلغ {amount} ر.س لطلبك #{order}. يرجى السداد خلال 48 ساعة لتجنب التأخير'
        },
        { 
          id: '3', 
          name: 'استبيان رضا', 
          category: 'خدمة عملاء', 
          usageCount: 320, 
          lastUsed: '2026-01-27',
          content: 'مرحباً {name}، نود معرفة رأيك في خدمتنا. هل أنت راضٍ عن تجربتك معنا؟ الرد برقم: 1-ممتاز، 2-جيد، 3-متوسط، 4-ضعيف'
        },
      ]);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast({ title: "تم النسخ", description: "تم نسخ النص إلى الحافظة" });
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

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
            <FileText className="h-7 w-7 text-primary" />
            نصوص الواتس المحفوظة
          </h1>
          <p className="text-muted-foreground mt-1">إدارة القوالب النصية الجاهزة للاستخدام في حملات الواتساب</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء قالب جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>قائمة القوالب</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم القالب أو الفئة..."
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
                  <TableHead>اسم القالب</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>عدد الاستخدامات</TableHead>
                  <TableHead>آخر استخدام</TableHead>
                  <TableHead>النص المختصر</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {template.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{template.usageCount.toLocaleString()}</TableCell>
                    <TableCell>{template.lastUsed}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-sm">
                      {template.content.substring(0, 50)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCopy(template.content, template.id)}
                        >
                          {copiedId === template.id ? (
                            <Check className="h-3 w-3 mr-1 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          {copiedId === template.id ? 'تم النسخ' : 'نسخ'}
                        </Button>
                        <Button variant="outline" size="sm">تعديل</Button>
                        <Button variant="outline" size="sm">استخدام</Button>
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

export default TemplatesPage;