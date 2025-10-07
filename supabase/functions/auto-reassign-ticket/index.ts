import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  ticketId: string;
  transferReason: string;
  currentAssigneeId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { ticketId, transferReason, currentAssigneeId }: RequestBody = await req.json();

    console.log('Processing transfer request for ticket:', ticketId);

    // Get ticket details including category
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, assigned_to, category')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      throw ticketError;
    }

    console.log('Ticket category:', ticket.category);

    // Find all IT helpdesk users with matching specialization
    const { data: helpDeskUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, specialization')
      .eq('role', 'it_helpdesk')
      .eq('specialization', ticket.category)
      .neq('id', currentAssigneeId); // Exclude current assignee

    if (usersError) {
      console.error('Error fetching helpdesk users:', usersError);
      throw usersError;
    }

    console.log(`Found ${helpDeskUsers?.length || 0} available helpdesk users with ${ticket.category} specialization`);

    // If we found available users with matching specialization
    if (helpDeskUsers && helpDeskUsers.length > 0) {
      // Get ticket counts for each user to find the least busy one
      const userWorkload = await Promise.all(
        helpDeskUsers.map(async (user) => {
          const { count } = await supabase
            .from('tickets')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .in('status', ['open', 'in_progress']);

          return { ...user, ticketCount: count || 0 };
        })
      );

      // Sort by ticket count and pick the one with least tickets
      userWorkload.sort((a, b) => a.ticketCount - b.ticketCount);
      const newAssignee = userWorkload[0];

      console.log(`Auto-assigning to ${newAssignee.full_name} who has ${newAssignee.ticketCount} active tickets`);

      // Update ticket with new assignee
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          assigned_to: newAssignee.id,
          transfer_requested: false,
          transfer_reason: null,
          status: 'in_progress'
        })
        .eq('id', ticketId);

      if (updateError) {
        console.error('Error updating ticket:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          autoAssigned: true,
          assignedTo: newAssignee.full_name,
          message: `Ticket automatically reassigned to ${newAssignee.full_name}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      // No available users with matching specialization, mark for admin review
      console.log('No available helpdesk users found, marking for admin review');

      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          transfer_requested: true,
          transfer_reason: transferReason
        })
        .eq('id', ticketId);

      if (updateError) {
        console.error('Error updating ticket:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          autoAssigned: false,
          message: 'No available IT helpdesk found. Transfer request sent to admin for manual review.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error: any) {
    console.error('Error in auto-reassign-ticket function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});