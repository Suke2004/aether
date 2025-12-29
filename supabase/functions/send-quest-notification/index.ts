import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuestNotificationRequest {
  childId: string;
  childName: string;
  questName: string;
  questType: string;
  tokens: number;
  status: 'pending' | 'approved' | 'rejected';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { childId, childName, questName, questType, tokens, status }: QuestNotificationRequest = await req.json();

    console.log(`Processing notification for child ${childId}, quest ${questName}, status ${status}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get parent's email from family_links
    const { data: familyLink, error: linkError } = await supabase
      .from('family_links')
      .select('parent_id, parent_email, email_notifications_enabled')
      .eq('child_id', childId)
      .eq('status', 'active')
      .maybeSingle();

    if (linkError) {
      console.error('Error fetching family link:', linkError);
      throw linkError;
    }

    if (!familyLink) {
      console.log('No active family link found for child');
      return new Response(JSON.stringify({ message: 'No parent linked' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!familyLink.email_notifications_enabled) {
      console.log('Email notifications disabled for this family link');
      return new Response(JSON.stringify({ message: 'Notifications disabled' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!familyLink.parent_email) {
      console.log('No parent email configured');
      return new Response(JSON.stringify({ message: 'No parent email configured' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate email content based on status
    let subject: string;
    let htmlContent: string;

    if (status === 'pending') {
      subject = `🎯 ${childName} completed a quest and needs your review!`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">🎯 Quest Submitted!</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">Awaiting your review</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-top: 20px;">
            <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px;">Quest Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Child</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600; text-align: right;">${childName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Quest</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600; text-align: right;">${questName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #64748b;">Coins to Award</td>
                <td style="padding: 12px 0; color: #6366f1; font-weight: 700; text-align: right; font-size: 18px;">+${tokens} 🪙</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #64748b; font-size: 14px;">
              Log in to your Project Aether dashboard to review this quest submission.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Project Aether - Earn, Learn & Play!
            </p>
          </div>
        </div>
      `;
    } else if (status === 'approved') {
      subject = `✅ ${childName}'s quest was approved! (+${tokens} coins)`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">✅ Quest Approved!</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">${childName} earned ${tokens} coins!</p>
          </div>
          
          <div style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; color: #166534; font-size: 16px;">
              Great job approving <strong>${questName}</strong>!
            </p>
          </div>
        </div>
      `;
    } else {
      subject = `❌ ${childName}'s quest was not approved`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">Quest Not Approved</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">${questName} needs another try</p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Project Aether <onboarding@resend.dev>",
      to: [familyLink.parent_email],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-quest-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
