import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketCreatedPayload {
  ticket_id: string;
  title: string;
  status: string;
  assigned_to: string | null;
  submitted_by: string;
  employee_email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: TicketCreatedPayload = await req.json();
    console.log('Ticket created notification:', payload);

    // Send POST request to n8n webhook
    const webhookResponse = await fetch(
      'https://omkar7588.app.n8n.cloud/webhook-test/e206d50e-dc01-4f9e-8b70-af12529e5a36',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: payload.ticket_id,
          title: payload.title,
          status: payload.status,
          assigned_to: payload.assigned_to,
          submitted_by: payload.submitted_by,
          employee_email: payload.employee_email,
        }),
      }
    );

    if (!webhookResponse.ok) {
      console.error('Webhook call failed:', await webhookResponse.text());
    } else {
      console.log('Webhook called successfully');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in notify-ticket-created:', error);
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
