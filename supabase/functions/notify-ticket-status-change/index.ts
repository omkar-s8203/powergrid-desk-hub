import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketStatusChangePayload {
  ticket_id: string;
  status: string;
  assigned_to: string | null;
  assigned_to_email: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: TicketStatusChangePayload = await req.json();
    console.log('Ticket status change notification:', payload);

    // Send POST request to n8n webhook
    const webhookResponse = await fetch(
      'https://omkar7588.app.n8n.cloud/webhook-test/54227e81-4ef9-49b0-995f-d6752c4bacac',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: payload.ticket_id,
          status: payload.status,
          assigned_to: payload.assigned_to,
          assigned_to_email: payload.assigned_to_email,
        }),
      }
    );

    if (!webhookResponse.ok) {
      console.error('Webhook call failed:', await webhookResponse.text());
    } else {
      console.log('Webhook called successfully');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Status change notification sent' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in notify-ticket-status-change:', error);
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
