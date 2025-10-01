import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { message, role, userId } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check if this is an issue submission from an employee
    const isIssueSubmission = role === 'employee' && 
      (message.toLowerCase().includes('issue') || 
       message.toLowerCase().includes('problem') || 
       message.toLowerCase().includes('help') ||
       message.toLowerCase().includes('not working') ||
       message.toLowerCase().includes('error') ||
       message.toLowerCase().includes('broken'));

    let systemPrompt = role === 'admin' 
      ? "You are PowerGrid's IT admin assistant. Help with system administration, user management, ticket oversight, and technical decisions. Keep responses professional and focused on admin tasks."
      : role === 'it_helpdesk'
      ? "You are PowerGrid's IT helpdesk assistant. Help with technical troubleshooting, ticket resolution, and providing solutions to common IT problems. Be helpful and solution-oriented."
      : "You are PowerGrid's employee support assistant. Help with general IT questions, guide through ticket creation, and provide basic troubleshooting steps. Be friendly and helpful.";

    // If it's an issue submission, enhance the system prompt for validation
    if (isIssueSubmission) {
      systemPrompt = `You are PowerGrid's IT issue validator and router. Analyze employee IT issues and:
1. Determine if this is a valid IT issue that requires helpdesk assistance
2. If valid, categorize it into: hardware, software, network, access, or other
3. Respond ONLY with a valid JSON object, no markdown formatting or code blocks
4. JSON format: {"isValid": boolean, "category": "hardware|software|network|access|other|null", "summary": "brief issue summary", "response": "helpful response to user"}
5. If not valid, still be helpful but mark as not requiring ticket creation`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let botResponse = data.choices[0].message.content;

    // Handle issue validation and ticket creation for employees
    if (isIssueSubmission && userId) {
      try {
        // Clean the response - remove markdown code blocks if present
        let cleanedResponse = botResponse.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Try to parse JSON response for issue validation
        const issueAnalysis = JSON.parse(cleanedResponse);
        console.log('Parsed issue analysis:', issueAnalysis);
        
        if (issueAnalysis.isValid && issueAnalysis.category) {
          // Create ticket and assign to appropriate helpdesk staff
          const ticketResult = await createAndAssignTicket(
            userId, 
            issueAnalysis.summary || message, 
            message, 
            issueAnalysis.category
          );
          
          console.log('Ticket creation result:', ticketResult);
          
          if (ticketResult.success) {
            botResponse = `${issueAnalysis.response}\n\n✅ I've created a ticket for your issue (Ticket #${ticketResult.ticketId}) and assigned it to our ${issueAnalysis.category} specialist: ${ticketResult.assignedTo}. They will contact you shortly to resolve this issue.`;
          } else {
            botResponse = `${issueAnalysis.response}\n\n⚠️ I've validated your issue but couldn't automatically assign it right now. Please create a manual ticket through the system. Error: ${ticketResult.error}`;
          }
        } else {
          botResponse = issueAnalysis.response || botResponse;
        }
      } catch (parseError) {
        // If JSON parsing fails, treat as regular response
        console.error('Failed to parse issue analysis:', parseError);
        console.log('Raw response:', botResponse);
      }
    }

    return new Response(JSON.stringify({ response: botResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createAndAssignTicket(userId: string, title: string, description: string, category: string) {
  try {
    // Get employee profile
    const { data: employeeProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!employeeProfile) {
      return { success: false, error: 'Employee profile not found' };
    }

    // Find available helpdesk staff with matching specialization
    const { data: helpdeskStaff } = await supabase
      .from('profiles')
      .select('id, full_name, specialization')
      .eq('role', 'it_helpdesk')
      .eq('specialization', category);

    let assignedTo = null;
    let assignedToName = 'Available Specialist';

    if (helpdeskStaff && helpdeskStaff.length > 0) {
      // Assign to first available specialist (could be enhanced with workload balancing)
      assignedTo = helpdeskStaff[0].id;
      assignedToName = helpdeskStaff[0].full_name;
    }

    // Create the ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        employee_id: employeeProfile.id,
        title: title,
        description: description,
        category: category,
        assigned_to: assignedTo,
        status: assignedTo ? 'in_progress' : 'open'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      ticketId: ticket.id,
      assignedTo: assignedToName
    };
  } catch (error) {
    console.error('Error in createAndAssignTicket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}