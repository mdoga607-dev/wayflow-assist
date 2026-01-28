import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  shipment_id: string;
  new_status: string;
  recipient_phone: string;
  recipient_name: string;
  tracking_number: string;
}

serve(async (req) => {
  // التعامل مع طلبات CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: SMSRequest = await req.json();
    const { shipment_id, new_status, recipient_phone, recipient_name, tracking_number } = body;

    const statusMessages: Record<string, string> = {
      pending: "تم استلام شحنتك وهي قيد التجهيز",
      transit: "شحنتك في الطريق إليك",
      delivered: "تم تسليم شحنتك بنجاح",
      delayed: "نعتذر، تأخرت شحنتك وسيتم التواصل معك قريباً",
      returned: "تم إرجاع شحنتك، يرجى التواصل مع الدعم",
    };

    const statusMessage = statusMessages[new_status] || `حالة شحنتك هي: ${new_status}`;
    const smsMessage = `مرحباً ${recipient_name}،\n${statusMessage}\nرقم التتبع: ${tracking_number}\nشكراً لاستخدامك خدماتنا.`;

    // تسجيل العملية في قاعدة البيانات
    const { error: logError } = await supabase
      .from("shipments")
      .update({ 
        notes: `SMS sent: ${new_status} - ${new Date().toISOString()}`,
        updated_at: new Date().toISOString()
      })
      .eq("id", shipment_id);

    if (logError) throw logError;

    // هنا تضع كود الربط مع مزود الخدمة مثل Twilio أو Unifonic مستقبلاً
    console.log(`Sending to ${recipient_phone}: ${smsMessage}`);

    return new Response(JSON.stringify({ success: true, message: "تمت المعالجة" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});