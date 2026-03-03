import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!ticketId) {
      throw new Error('ticketId is required');
    }

    // Fetch ticket with messages
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, title, description, category, status, created_at')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket not found');
    }

    // Fetch conversation messages
    const { data: messages } = await supabase
      .rpc('get_ticket_messages', { ticket_id_param: ticketId });

    const conversationText = messages?.map(
      (m: any) => `[${m.sender_role}] ${m.sender_full_name}: ${m.message}`
    ).join('\n') || 'No messages yet.';

    const prompt = `Analyze this IT support ticket and provide:
1. A concise summary (2-3 sentences max) of the issue and current status.
2. Sentiment analysis of the employee - classify as one of: positive, neutral, frustrated, urgent.
3. A sentiment score from 0.00 (very negative/urgent) to 1.00 (very positive).

Ticket Title: ${ticket.title}
Category: ${ticket.category}
Status: ${ticket.status}
Description: ${ticket.description}

Conversation:
${conversationText}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an IT ticket analysis assistant. Respond ONLY by calling the provided tool.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_ticket",
            description: "Return structured ticket analysis",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "2-3 sentence summary of the ticket" },
                sentiment: { type: "string", enum: ["positive", "neutral", "frustrated", "urgent"], description: "Employee sentiment" },
                sentiment_score: { type: "number", description: "Score from 0.00 to 1.00" }
              },
              required: ["summary", "sentiment", "sentiment_score"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_ticket" } },
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.statusText}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Update ticket with AI analysis
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        ai_summary: analysis.summary,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        ai_analyzed_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      throw new Error('Failed to save analysis');
    }

    return new Response(JSON.stringify({ 
      success: true,
      analysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analyze ticket error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
