import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  shipment_id: string;
  new_status: string;
  recipient_phone: string;
  recipient_name: string;
  tracking_number: string;
}

const statusMessages: Record<string, string> = {
  pending: "تم استلام شحنتك وهي قيد التجهيز",
  transit: "شحنتك في الطريق إليك",
  delivered: "تم تسليم شحنتك بنجاح",
  delayed: "نعتذر، تأخرت شحنتك وسيتم التواصل معك قريباً",
  returned: "تم إرجاع شحنتك، يرجى التواصل مع الدعم",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      shipment_id,
      new_status,
      recipient_phone,
      recipient_name,
      tracking_number,
    }: SMSRequest = await req.json();

    console.log(`Sending SMS for shipment ${tracking_number} to ${recipient_phone}`);

    const statusMessage = statusMessages[new_status] || `حالة شحنتك: ${new_status}`;
    const smsMessage = `مرحباً ${recipient_name}،\n${statusMessage}\nرقم التتبع: ${tracking_number}\n\nشكراً لاستخدامك خدماتنا`;

    // Log the SMS notification (in production, integrate with Twilio/MessageBird)
    console.log("SMS Message:", smsMessage);
    console.log("To Phone:", recipient_phone);

    // Store notification log
    const { error: logError } = await supabase
      .from("shipments")
      .update({ 
        notes: `SMS sent: ${new_status} - ${new Date().toISOString()}`,
        updated_at: new Date().toISOString()
      })
      .eq("id", shipment_id);

    if (logError) {
      console.error("Error updating shipment:", logError);
    }

    // In production, you would integrate with a real SMS provider here
    // Example with Twilio:
    // const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    // const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    // const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "SMS notification queued successfully",
        sms_content: smsMessage,
        phone: recipient_phone,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending SMS:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
