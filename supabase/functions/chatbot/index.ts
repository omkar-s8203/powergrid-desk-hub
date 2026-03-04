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
    const { message, role, userId, sessionId, conversationHistory = [] } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Save user message to database
    if (userId && sessionId) {
      await saveMessage(userId, sessionId, 'user', message);
    }

    let systemPrompt = role === 'admin' 
      ? `You are PowerGrid's intelligent IT admin assistant with full database access. You can:
- Help with system administration and user management
- Query and analyze ticket data, show statistics and trends
- Look up any user's tickets and provide detailed analysis
- Provide insights on team performance and workload
Keep responses professional, data-driven, and actionable.`
      : role === 'it_helpdesk'
      ? `You are PowerGrid's IT helpdesk assistant with database access. You can:
- Help with technical troubleshooting and ticket resolution
- Look up ticket details and history for assigned tickets
- Provide solutions to common IT problems
- Check ticket analytics and your workload
Be helpful, solution-oriented, and proactive.`
      : `You are PowerGrid's intelligent employee support assistant with self-service capabilities and database access.
PRIORITY: Always try to resolve issues automatically first using available tools.
- For password resets: Use reset_password tool
- For VPN access: Use vpn_access_guide tool  
- For common issues: Use troubleshooting_guide tool
- For checking ticket status: Use get_my_tickets tool
- For specific ticket details: Use get_ticket_details tool
- For updating account info: Use update_account_details tool
- If the user explicitly asks to create/raise a ticket, or if you cannot resolve the issue yourself, use the create_ticket tool
IMPORTANT: When creating tickets, you MUST call the create_ticket tool. Do NOT just say you will create a ticket without calling the tool.
When showing ticket data, format it nicely with relevant details. Be friendly and proactive.`;

    // Define tools based on role
    const commonTools = [
      {
        type: "function",
        function: {
          name: "get_my_tickets",
          description: "Get the user's tickets with status, category, and assignment info.",
          parameters: {
            type: "object",
            properties: {
              status_filter: { type: "string", enum: ["all", "open", "in_progress", "resolved", "closed"] },
              limit: { type: "number", description: "Max tickets to return. Default 10." }
            },
            required: ["status_filter"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_ticket_details",
          description: "Get detailed info about a specific ticket including messages, AI analysis, sentiment.",
          parameters: {
            type: "object",
            properties: {
              ticket_id: { type: "string" },
              ticket_title_search: { type: "string", description: "Search by title keyword if ID unknown" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_ticket_analytics",
          description: "Get ticket analytics - counts by status, category, sentiment distribution.",
          parameters: {
            type: "object",
            properties: {
              scope: { type: "string", enum: ["my_tickets", "all_tickets", "team_tickets"] },
              time_period: { type: "string", enum: ["today", "this_week", "this_month", "all_time"] }
            },
            required: ["scope", "time_period"]
          }
        }
      }
    ];

    const employeeTools = [
      ...commonTools,
      { type: "function", function: { name: "reset_password", description: "Reset user's password.", parameters: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] } } },
      { type: "function", function: { name: "vpn_access_guide", description: "VPN setup/troubleshooting.", parameters: { type: "object", properties: { issue_type: { type: "string", enum: ["setup", "connection_failed", "slow_speed", "credentials"] } }, required: ["issue_type"] } } },
      { type: "function", function: { name: "troubleshooting_guide", description: "Step-by-step troubleshooting for common IT issues.", parameters: { type: "object", properties: { issue_category: { type: "string", enum: ["email", "wifi", "printer", "software_crash", "slow_computer"] } }, required: ["issue_category"] } } },
      { type: "function", function: { name: "create_ticket", description: "Create a support ticket and auto-assign.", parameters: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, category: { type: "string", enum: ["hardware", "software", "network", "access", "other"] } }, required: ["title", "description", "category"] } } },
      { type: "function", function: { name: "update_account_details", description: "Update user's account details like full name.", parameters: { type: "object", properties: { full_name: { type: "string" } }, required: ["full_name"] } } }
    ];

    const adminTools = [
      ...commonTools,
      { type: "function", function: { name: "lookup_user", description: "Look up a user's profile and ticket history.", parameters: { type: "object", properties: { search: { type: "string" } }, required: ["search"] } } }
    ];

    const tools = role === 'admin' ? adminTools : role === 'it_helpdesk' ? commonTools : employeeTools;

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-20),
      { role: 'user', content: message }
    ];

    const requestBody: any = {
      model: 'google/gemini-3-flash-preview',
      messages: aiMessages,
      max_tokens: 800,
      temperature: 0.7,
    };

    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = "auto";
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    const choice = data.choices[0];
    let botResponse = choice.message.content;

    // Handle tool calls
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log('Tool call:', functionName, functionArgs);

      const toolResult = await executeToolCall(functionName, functionArgs, userId, role);

      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10),
            { role: 'user', content: message },
            { role: 'assistant', content: null, tool_calls: choice.message.tool_calls },
            { role: 'tool', tool_call_id: toolCall.id, content: toolResult }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      const followUpData = await followUpResponse.json();
      botResponse = followUpData.choices[0].message.content;
    }

    // Save bot response to database
    if (userId && sessionId) {
      await saveMessage(userId, sessionId, 'assistant', botResponse);

      // Every 5 messages, analyze conversation tone
      const { count } = await supabase.from('chat_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('role', 'user');
      
      if (count && count % 5 === 0) {
        // Fire and forget tone analysis
        analyzeConversationTone(userId, sessionId, lovableApiKey).catch(e => console.error('Tone analysis error:', e));
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

// ============ Save & Analyze ============

async function saveMessage(userId: string, sessionId: string, role: string, message: string) {
  try {
    await supabase.from('chat_conversations').insert({
      user_id: userId,
      session_id: sessionId,
      role,
      message
    });
  } catch (error) {
    console.error('Error saving message:', error);
  }
}

async function analyzeConversationTone(userId: string, sessionId: string, apiKey: string) {
  const { data: messages } = await supabase.from('chat_conversations')
    .select('role, message')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (!messages || messages.length === 0) return;

  const userMessages = messages.filter(m => m.role === 'user').map(m => m.message).join('\n');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'You are a conversation tone analyzer. Analyze the user messages and determine the overall tone.' },
        { role: 'user', content: `Analyze the tone of these user messages from a chatbot conversation:\n\n${userMessages}` }
      ],
      tools: [{
        type: "function",
        function: {
          name: "report_tone",
          description: "Report the conversation tone analysis",
          parameters: {
            type: "object",
            properties: {
              tone: { type: "string", enum: ["polite", "neutral", "impatient", "frustrated", "rude", "aggressive"], description: "Overall tone" },
              tone_score: { type: "number", description: "Score from 0 (very negative) to 1 (very positive)" },
              summary: { type: "string", description: "Brief summary of how the user communicated" }
            },
            required: ["tone", "tone_score", "summary"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "report_tone" } }
    }),
  });

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return;

  const result = JSON.parse(toolCall.function.arguments);

  // Upsert session analysis
  await supabase.from('chat_session_analysis').upsert({
    session_id: sessionId,
    user_id: userId,
    tone: result.tone,
    tone_score: result.tone_score,
    summary: result.summary,
    message_count: messages.filter(m => m.role === 'user').length,
    analyzed_at: new Date().toISOString()
  }, { onConflict: 'session_id' }).catch(() => {
    // If upsert fails (no unique constraint), just insert
    supabase.from('chat_session_analysis').insert({
      session_id: sessionId,
      user_id: userId,
      tone: result.tone,
      tone_score: result.tone_score,
      summary: result.summary,
      message_count: messages.filter(m => m.role === 'user').length,
    });
  });
}

// ============ Tool Execution ============

async function executeToolCall(functionName: string, args: any, userId: string, role: string): Promise<string> {
  try {
    switch (functionName) {
      case 'reset_password': return await handlePasswordReset(userId);
      case 'vpn_access_guide': return getVPNGuide(args.issue_type);
      case 'troubleshooting_guide': return getTroubleshootingGuide(args.issue_category);
      case 'create_ticket': return await handleCreateTicket(userId, args.title, args.description, args.category);
      case 'get_my_tickets': return await handleGetMyTickets(userId, role, args.status_filter, args.limit || 10);
      case 'get_ticket_details': return await handleGetTicketDetails(userId, role, args.ticket_id, args.ticket_title_search);
      case 'get_ticket_analytics': return await handleGetTicketAnalytics(userId, role, args.scope, args.time_period);
      case 'update_account_details': return await handleUpdateAccountDetails(userId, args.full_name);
      case 'lookup_user': return await handleLookupUser(args.search);
      default: return `Unknown tool: ${functionName}`;
    }
  } catch (error) {
    console.error(`Tool ${functionName} error:`, error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// ============ Database Query Tools ============

async function handleGetMyTickets(userId: string, role: string, statusFilter: string, limit: number): Promise<string> {
  const { data: profile } = await supabase.from('profiles').select('id, role').eq('user_id', userId).single();
  if (!profile) return 'User profile not found.';

  let query = supabase.from('tickets').select('id, title, status, category, created_at, updated_at, sentiment, ai_summary, assigned_to, employee_id')
    .order('created_at', { ascending: false }).limit(limit);

  if (role === 'employee') query = query.eq('employee_id', profile.id);
  else if (role === 'it_helpdesk') query = query.eq('assigned_to', profile.id);

  if (statusFilter !== 'all') query = query.eq('status', statusFilter);

  const { data: tickets, error } = await query;
  if (error) return `Error: ${error.message}`;
  if (!tickets?.length) return 'No tickets found.';

  return `Found ${tickets.length} ticket(s):\n\n` + tickets.map((t, i) => 
    `${i + 1}. **${t.title}** [${t.status.toUpperCase()}]\n   Category: ${t.category} | Created: ${new Date(t.created_at).toLocaleDateString()}\n   Sentiment: ${t.sentiment || 'Not analyzed'} | ID: ${t.id.slice(0, 8)}...`
  ).join('\n\n');
}

async function handleGetTicketDetails(userId: string, role: string, ticketId?: string, titleSearch?: string): Promise<string> {
  const { data: profile } = await supabase.from('profiles').select('id, role').eq('user_id', userId).single();
  if (!profile) return 'User profile not found.';

  let ticket;
  if (ticketId) {
    const { data } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
    ticket = data;
  } else if (titleSearch) {
    const { data } = await supabase.from('tickets').select('*').ilike('title', `%${titleSearch}%`).limit(1).single();
    ticket = data;
  } else return 'Please provide a ticket ID or search term.';

  if (!ticket) return 'Ticket not found.';
  if (role === 'employee' && ticket.employee_id !== profile.id) return 'Access denied.';
  if (role === 'it_helpdesk' && ticket.assigned_to !== profile.id) return 'Not assigned to you.';

  const { count: messageCount } = await supabase.from('ticket_messages').select('*', { count: 'exact', head: true }).eq('ticket_id', ticket.id);
  let assignedName = 'Unassigned';
  if (ticket.assigned_to) {
    const { data: a } = await supabase.from('profiles').select('full_name').eq('id', ticket.assigned_to).single();
    assignedName = a?.full_name || 'Unknown';
  }
  const { data: emp } = await supabase.from('profiles').select('full_name').eq('id', ticket.employee_id).single();

  return `📋 **Ticket Details**\n- **Title**: ${ticket.title}\n- **Status**: ${ticket.status.toUpperCase()}\n- **Category**: ${ticket.category}\n- **Created by**: ${emp?.full_name || 'Unknown'}\n- **Assigned to**: ${assignedName}\n- **Created**: ${new Date(ticket.created_at).toLocaleString()}\n- **Messages**: ${messageCount || 0}\n- **Description**: ${ticket.description}\n\n🤖 **AI Analysis**:\n- Summary: ${ticket.ai_summary || 'Not analyzed'}\n- Sentiment: ${ticket.sentiment || 'N/A'} (Score: ${ticket.sentiment_score ?? 'N/A'})`;
}

async function handleGetTicketAnalytics(userId: string, role: string, scope: string, timePeriod: string): Promise<string> {
  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userId).single();
  if (!profile) return 'Profile not found.';
  if (role === 'employee' && scope !== 'my_tickets') scope = 'my_tickets';

  let query = supabase.from('tickets').select('status, category, sentiment, created_at, resolution_notes');
  if (scope === 'my_tickets') query = role === 'it_helpdesk' ? query.eq('assigned_to', profile.id) : query.eq('employee_id', profile.id);

  const now = new Date();
  if (timePeriod === 'today') query = query.gte('created_at', new Date(now.setHours(0, 0, 0, 0)).toISOString());
  else if (timePeriod === 'this_week') query = query.gte('created_at', new Date(now.getTime() - 7 * 86400000).toISOString());
  else if (timePeriod === 'this_month') query = query.gte('created_at', new Date(now.getTime() - 30 * 86400000).toISOString());

  const { data: tickets } = await query;
  if (!tickets?.length) return 'No data found.';

  const stats: Record<string, Record<string, number>> = { status: {}, category: {}, sentiment: {} };
  let resolved = 0;
  tickets.forEach(t => {
    stats.status[t.status] = (stats.status[t.status] || 0) + 1;
    stats.category[t.category] = (stats.category[t.category] || 0) + 1;
    if (t.sentiment) stats.sentiment[t.sentiment] = (stats.sentiment[t.sentiment] || 0) + 1;
    if (['resolved', 'closed'].includes(t.status)) resolved++;
  });

  const fmt = (obj: Record<string, number>) => Object.entries(obj).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  return `📊 **Analytics** (${timePeriod.replace('_', ' ')})\n\n**Total**: ${tickets.length} | **Resolution Rate**: ${((resolved / tickets.length) * 100).toFixed(1)}%\n\n**By Status**:\n${fmt(stats.status)}\n\n**By Category**:\n${fmt(stats.category)}\n\n**By Sentiment**:\n${fmt(stats.sentiment) || '  No data'}`;
}

async function handleUpdateAccountDetails(userId: string, fullName: string): Promise<string> {
  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userId).single();
  if (!profile) return 'Profile not found.';
  const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
  if (error) return `Failed: ${error.message}`;
  await logChatbotResolution(userId, 'account_update', 'account_update', true, `Updated name to ${fullName}`);
  return `✅ Name updated to: ${fullName}`;
}

async function handleLookupUser(search: string): Promise<string> {
  const { data: users } = await supabase.from('profiles')
    .select('id, full_name, email, role, specialization, created_at')
    .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`).limit(5);
  if (!users?.length) return `No users found for "${search}".`;

  const results = [];
  for (const user of users) {
    const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('employee_id', user.id);
    results.push(`👤 **${user.full_name}** (${user.email})\n  Role: ${user.role} | Tickets: ${count || 0}`);
  }
  return results.join('\n\n');
}

// ============ Self-Service Tools ============

async function handlePasswordReset(userId: string): Promise<string> {
  if (!userId) return '⚠️ User not identified.';
  try {
    const tempPassword = generateTempPassword();
    const { error } = await supabase.functions.invoke('admin-update-password', { body: { userId, newPassword: tempPassword } });
    if (error) {
      await createAndAssignTicket(userId, 'Password Reset Request', 'Automated reset failed', 'access');
      await logChatbotResolution(userId, 'password_reset', 'ticket_created', false, 'Reset failed');
      return `⚠️ Reset failed. Ticket created for manual assistance.`;
    }
    await logChatbotResolution(userId, 'password_reset', 'password_reset', true, 'Success');
    return `✅ Password reset! Temporary password: ${tempPassword}\n\nPlease change it after login.`;
  } catch (error) {
    return `⚠️ Error: ${error instanceof Error ? error.message : 'Unknown'}`;
  }
}

async function handleCreateTicket(userId: string, title: string, description: string, category: string): Promise<string> {
  if (!userId) return '⚠️ User not identified.';
  const result = await createAndAssignTicket(userId, title, description, category);
  if (result.success) {
    await logChatbotResolution(userId, category, 'ticket_created', false, title);
    return `✅ Ticket created!\n- ID: ${result.ticketId}\n- Assigned to: ${result.assignedTo}\n- Category: ${category}`;
  }
  return `⚠️ Failed: ${result.error}`;
}

// ============ Helpers ============

async function logChatbotResolution(userId: string, issueType: string, resolutionMethod: string, wasResolvedByAI: boolean, message: string) {
  try {
    await supabase.from('chatbot_resolutions').insert({ user_id: userId, issue_type: issueType, resolution_method: resolutionMethod, was_resolved_by_ai: wasResolvedByAI, message });
  } catch (error) { console.error('Log error:', error); }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let p = '';
  for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
  return p;
}

function getVPNGuide(issueType: string): string {
  const guides: Record<string, string> = {
    setup: '📡 VPN Setup:\n1. Download Cisco AnyConnect\n2. Enter: vpn.powergrid.com\n3. Use company credentials\n4. Click Connect',
    connection_failed: '🔧 VPN Fix:\n1. Check internet\n2. Verify credentials\n3. Reconnect\n4. Restart client\n5. Check firewall (ports 443, 10000)',
    slow_speed: '⚡ VPN Speed:\n1. Nearest server\n2. Close apps\n3. Check speed without VPN\n4. Try different protocols',
    credentials: '🔑 VPN Credentials:\n- Username: company email\n- Password: email password\n- Wait 10 min after change'
  };
  return guides[issueType] || 'VPN guidance provided.';
}

function getTroubleshootingGuide(category: string): string {
  const guides: Record<string, string> = {
    email: '📧 Email Fix:\n1. Check internet\n2. Verify credentials\n3. Clear cache\n4. Try incognito\n5. Restart client',
    wifi: '📶 WiFi Fix:\n1. Toggle WiFi\n2. Forget & reconnect\n3. Restart device\n4. Network: PowerGrid-Corp',
    printer: '🖨️ Printer Fix:\n1. Check power/paper\n2. Clear queue\n3. Restart printer\n4. Re-add printer',
    software_crash: '💥 Software Fix:\n1. Force close\n2. Restart PC\n3. Check updates\n4. Run as admin\n5. Reinstall',
    slow_computer: '🐌 Speed Fix:\n1. Restart\n2. Close apps\n3. Task Manager\n4. Disk Cleanup\n5. Need 10% free space'
  };
  return guides[category] || 'Troubleshooting provided.';
}

async function createAndAssignTicket(userId: string, title: string, description: string, category: string) {
  try {
    const { data: emp } = await supabase.from('profiles').select('id').eq('user_id', userId).single();
    if (!emp) return { success: false, error: 'Profile not found' };

    const { data: staff } = await supabase.from('profiles').select('id, full_name')
      .eq('role', 'it_helpdesk').eq('specialization', category);

    const assignedTo = staff?.[0]?.id || null;
    const assignedToName = staff?.[0]?.full_name || 'Available Specialist';

    const { data: ticket, error } = await supabase.from('tickets').insert({
      employee_id: emp.id, title, description, category,
      assigned_to: assignedTo, status: assignedTo ? 'in_progress' : 'open'
    }).select('id').single();

    if (error) return { success: false, error: error.message };
    return { success: true, ticketId: ticket.id, assignedTo: assignedToName };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown' };
  }
}
