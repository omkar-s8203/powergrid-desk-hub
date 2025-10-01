import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Triggering daily ticket summary workflow');

    // Call n8n webhook to trigger the daily summary workflow
    const webhookResponse = await fetch(
      'https://omkar7588.app.n8n.cloud/webhook-test/04a42f23-3421-4bc3-962c-7b874f87c733',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger_time: new Date().toISOString(),
          summary_date: new Date().toISOString().split('T')[0],
        }),
      }
    );

    if (!webhookResponse.ok) {
      console.error('Webhook call failed:', await webhookResponse.text());
      throw new Error('Failed to trigger daily summary workflow');
    }

    console.log('Daily summary workflow triggered successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Daily summary triggered' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in daily-ticket-summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
