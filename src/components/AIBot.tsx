// src/components/AIBot.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bot, Send, MessageSquare, X, Loader2, 
  CheckCircle, AlertCircle, HelpCircle, 
  Truck,
  Wallet
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AIBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // إجابات ذكية مسبقة (للتوضيح - في التطبيق الحقيقي ستتصل بـ API)
  const getAIResponse = (message: string) => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('شحن') || lowerMsg.includes('توصيل')) {
      return "يمكنك إرسال شحنة جديدة من خلال صفحة 'إضافة شحنة'. ستحتاج إلى إدخال بيانات المستلم والعنوان والمبلغ. هل تريد مساعدة في خطوات محددة؟";
    }
    if (lowerMsg.includes('تتبع') || lowerMsg.includes('متابعة')) {
      return "لتتبع شحنتك، أدخل رقم التتبع في صفحة 'تتبع الشحنة' أو اضغط على زر التتبع في صفحة الشحنات. يمكنك أيضاً تتبع الشحنة عبر رسالة نصية.";
    }
    if (lowerMsg.includes('محفظة') || lowerMsg.includes('رصيد') || lowerMsg.includes('دفع')) {
      return "لإيداع رصيد في محفظتك الإلكترونية، اذهب إلى صفحة 'المحفظة الإلكترونية' واضغط على 'إيداع رصيد'. يمكنك الإيداع بحد أدنى 100 ر.س عبر الحوالة البنكية.";
    }
    if (lowerMsg.includes('بيك أب') || lowerMsg.includes('استلام')) {
      return "لطلب بيك أب (استلام شحنات)، اذهب إلى صفحة 'طلبات البيك أب' واضغط على 'إضافة طلب بيك أب جديد'. حدد التاجر وعنوان الاستلام والوقت المناسب.";
    }
    if (lowerMsg.includes('مرتجع') || lowerMsg.includes('إرجاع')) {
      return "لإرجاع شحنة، اتصل بمركز الخدمة أو أرسل طلب إرجاع من صفحة تفاصيل الشحنة. سيتم ترتيب استلام الشحنة المرتجعة في أقرب وقت.";
    }
    if (lowerMsg.includes('مساعدة') || lowerMsg.includes('كيف')) {
      return "أنا هنا لمساعدتك! يمكنك طرح أي سؤال عن:\n- إرسال الشحنات\n- تتبع الشحنات\n- طلبات البيك أب\n- المحفظة الإلكترونية\n- الشيتات والمرتجعات\nما الذي تحتاج مساعدة فيه اليوم؟";
    }
    
    return "شكرًا لسؤالك! أنا أبحث عن أفضل إجابة لك. يمكنك طرح أسئلة محددة عن:\n- إرسال وتتبع الشحنات\n- طلبات البيك أب والاستلام\n- المحفظة الإلكترونية والدفع\n- إدارة الشيتات والمرتجعات\nكيف يمكنني مساعدتك اليوم؟";
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setMessages([...messages, { text: userMessage, isUser: true }]);
    setInput('');
    setIsLoading(true);
    
    // محاكاة استجابة الـ AI
    setTimeout(() => {
      const response = getAIResponse(userMessage);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <>
      {/* زر البوت العائم */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-50 rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-primary to-blue-600 text-white p-0"
        >
          <Bot className="h-8 w-8 animate-pulse" />
          <Badge className="absolute top-0 right-0 bg-red-500 text-white text-xs">
            جديد
          </Badge>
        </Button>
      )}

      {/* نافذة الدردشة */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 w-full max-w-md z-50 animate-in slide-in-from-bottom-2">
          <Card className="border-primary/20 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    مساعد أمان للشحن <Badge variant="default" className="text-xs">Beta</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">متصل الآن - يرد خلال ثوانٍ</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <CardContent className="p-4">
              {/* سجل المحادثات */}
              <div className="h-80 overflow-y-auto mb-4 space-y-3 pr-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.isUser
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-muted rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 rounded-bl-none flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جاري الكتابة...</span>
                    </div>
                  </div>
                )}
                
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                    <p className="font-medium mb-1">مرحباً! أنا مساعد أمان للشحن</p>
                    <p className="text-sm">
                      كيف يمكنني مساعدتك اليوم؟
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setInput('كيف أرسل شحنة جديدة؟')}
                      >
                        <Send className="h-3 w-3 ml-1" />
                        إرسال شحنة
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setInput('كيف أتتبع شحنتي؟')}
                      >
                        <MessageSquare className="h-3 w-3 ml-1" />
                        تتبع شحنة
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setInput('كيف أطلب بيك أب؟')}
                      >
                        <Truck className="h-3 w-3 ml-1" />
                        طلب بيك أب
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setInput('كيف أضيف رصيد لمحفظتي؟')}
                      >
                        <Wallet className="h-3 w-3 ml-1" />
                        المحفظة
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* حقل الإدخال */}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اكتب سؤالك هنا... (مثال: كيف أرسل شحنة جديدة؟)"
                  className="min-h-[40px] resize-none"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading}
                  className="px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* نصائح سريعة */}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">نصائح للاستخدام:</p>
                    <ul className="space-y-0.5 list-disc pr-4">
                      <li>اسأل عن إرسال وتتبع الشحنات</li>
                      <li>اطلب مساعدة في طلبات البيك أب</li>
                      <li>استفسر عن المحفظة الإلكترونية</li>
                      <li>اسأل عن إدارة الشيتات والمرتجعات</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default AIBot;