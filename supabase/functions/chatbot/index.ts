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
    const { message, role, userId, conversationHistory = [] } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
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
          description: "Get the user's tickets with status, category, and assignment info. Use when user asks about their tickets, ticket status, or wants an overview.",
          parameters: {
            type: "object",
            properties: {
              status_filter: { type: "string", enum: ["all", "open", "in_progress", "resolved", "closed"], description: "Filter tickets by status. Use 'all' to get everything." },
              limit: { type: "number", description: "Max number of tickets to return. Default 10." }
            },
            required: ["status_filter"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_ticket_details",
          description: "Get detailed information about a specific ticket including messages, AI analysis, sentiment, and assignment. Use when user asks about a specific ticket.",
          parameters: {
            type: "object",
            properties: {
              ticket_id: { type: "string", description: "The UUID of the ticket to look up" },
              ticket_title_search: { type: "string", description: "Search for ticket by title keyword if ID is not known" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_ticket_analytics",
          description: "Get analytics and statistics about tickets - counts by status, category, average resolution time, sentiment distribution. Use when user asks for reports, stats, or analysis.",
          parameters: {
            type: "object",
            properties: {
              scope: { type: "string", enum: ["my_tickets", "all_tickets", "team_tickets"], description: "Scope of analytics. Employees can only see 'my_tickets'. Admins can see 'all_tickets'." },
              time_period: { type: "string", enum: ["today", "this_week", "this_month", "all_time"], description: "Time period for analytics" }
            },
            required: ["scope", "time_period"]
          }
        }
      }
    ];

    const employeeTools = [
      ...commonTools,
      {
        type: "function",
        function: {
          name: "reset_password",
          description: "Reset a user's password. Use this when user requests password reset or forgot password.",
          parameters: {
            type: "object",
            properties: {
              reason: { type: "string", description: "Reason for password reset" }
            },
            required: ["reason"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "vpn_access_guide",
          description: "Provide VPN access setup and troubleshooting instructions.",
          parameters: {
            type: "object",
            properties: {
              issue_type: { type: "string", enum: ["setup", "connection_failed", "slow_speed", "credentials"], description: "Type of VPN issue" }
            },
            required: ["issue_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "troubleshooting_guide",
          description: "Provide step-by-step troubleshooting for common IT issues.",
          parameters: {
            type: "object",
            properties: {
              issue_category: { type: "string", enum: ["email", "wifi", "printer", "software_crash", "slow_computer"], description: "Category of the issue" }
            },
            required: ["issue_category"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_ticket",
          description: "Create a support ticket in the system and auto-assign it to available helpdesk staff.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short title for the ticket" },
              description: { type: "string", description: "Detailed description of the issue" },
              category: { type: "string", enum: ["hardware", "software", "network", "access", "other"], description: "Category of the issue" }
            },
            required: ["title", "description", "category"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_account_details",
          description: "Update the user's account details like full name. Use when user wants to change their profile information.",
          parameters: {
            type: "object",
            properties: {
              full_name: { type: "string", description: "New full name for the user" }
            },
            required: ["full_name"]
          }
        }
      }
    ];

    const adminTools = [
      ...commonTools,
      {
        type: "function",
        function: {
          name: "lookup_user",
          description: "Look up a user's profile and their ticket history. Use when admin asks about a specific user.",
          parameters: {
            type: "object",
            properties: {
              search: { type: "string", description: "Search by name or email" }
            },
            required: ["search"]
          }
        }
      }
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

      // Get final response with tool result
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

// ============ Tool Execution ============

async function executeToolCall(functionName: string, args: any, userId: string, role: string): Promise<string> {
  try {
    switch (functionName) {
      case 'reset_password':
        return await handlePasswordReset(userId);
      case 'vpn_access_guide':
        return getVPNGuide(args.issue_type);
      case 'troubleshooting_guide':
        return getTroubleshootingGuide(args.issue_category);
      case 'create_ticket':
        return await handleCreateTicket(userId, args.title, args.description, args.category);
      case 'get_my_tickets':
        return await handleGetMyTickets(userId, role, args.status_filter, args.limit || 10);
      case 'get_ticket_details':
        return await handleGetTicketDetails(userId, role, args.ticket_id, args.ticket_title_search);
      case 'get_ticket_analytics':
        return await handleGetTicketAnalytics(userId, role, args.scope, args.time_period);
      case 'update_account_details':
        return await handleUpdateAccountDetails(userId, args.full_name);
      case 'lookup_user':
        return await handleLookupUser(args.search);
      default:
        return `Unknown tool: ${functionName}`;
    }
  } catch (error) {
    console.error(`Tool ${functionName} error:`, error);
    return `Error executing ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// ============ Database Query Tools ============

async function handleGetMyTickets(userId: string, role: string, statusFilter: string, limit: number): Promise<string> {
  const { data: profile } = await supabase.from('profiles').select('id, role').eq('user_id', userId).single();
  if (!profile) return 'User profile not found.';

  let query = supabase.from('tickets').select(`
    id, title, status, category, created_at, updated_at, sentiment, ai_summary,
    assigned_to, employee_id
  `).order('created_at', { ascending: false }).limit(limit);

  // Scope based on role
  if (role === 'employee') {
    query = query.eq('employee_id', profile.id);
  } else if (role === 'it_helpdesk') {
    query = query.eq('assigned_to', profile.id);
  }
  // admin sees all

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: tickets, error } = await query;
  if (error) return `Error fetching tickets: ${error.message}`;
  if (!tickets || tickets.length === 0) return 'No tickets found matching your criteria.';

  const ticketList = tickets.map((t, i) => 
    `${i + 1}. **${t.title}** [${t.status.toUpperCase()}]\n   Category: ${t.category} | Created: ${new Date(t.created_at).toLocaleDateString()}\n   Sentiment: ${t.sentiment || 'Not analyzed'} | ID: ${t.id.slice(0, 8)}...`
  ).join('\n\n');

  return `Found ${tickets.length} ticket(s):\n\n${ticketList}`;
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
  } else {
    return 'Please provide a ticket ID or search term.';
  }

  if (!ticket) return 'Ticket not found.';

  // Access control
  if (role === 'employee' && ticket.employee_id !== profile.id) return 'You do not have access to this ticket.';
  if (role === 'it_helpdesk' && ticket.assigned_to !== profile.id) return 'This ticket is not assigned to you.';

  // Get messages count
  const { count: messageCount } = await supabase.from('ticket_messages').select('*', { count: 'exact', head: true }).eq('ticket_id', ticket.id);

  // Get assigned person name
  let assignedName = 'Unassigned';
  if (ticket.assigned_to) {
    const { data: assignee } = await supabase.from('profiles').select('full_name').eq('id', ticket.assigned_to).single();
    assignedName = assignee?.full_name || 'Unknown';
  }

  // Get employee name
  const { data: employee } = await supabase.from('profiles').select('full_name').eq('id', ticket.employee_id).single();

  return `📋 **Ticket Details**
- **Title**: ${ticket.title}
- **ID**: ${ticket.id}
- **Status**: ${ticket.status.toUpperCase()}
- **Category**: ${ticket.category}
- **Created by**: ${employee?.full_name || 'Unknown'}
- **Assigned to**: ${assignedName}
- **Created**: ${new Date(ticket.created_at).toLocaleString()}
- **Last Updated**: ${new Date(ticket.updated_at).toLocaleString()}
- **Messages**: ${messageCount || 0}
- **Description**: ${ticket.description}

🤖 **AI Analysis**:
- Summary: ${ticket.ai_summary || 'Not yet analyzed'}
- Sentiment: ${ticket.sentiment || 'Not analyzed'} (Score: ${ticket.sentiment_score ?? 'N/A'})
- Analyzed at: ${ticket.ai_analyzed_at ? new Date(ticket.ai_analyzed_at).toLocaleString() : 'Not yet'}

${ticket.resolution_notes ? `✅ **Resolution**: ${ticket.resolution_notes}` : ''}`;
}

async function handleGetTicketAnalytics(userId: string, role: string, scope: string, timePeriod: string): Promise<string> {
  const { data: profile } = await supabase.from('profiles').select('id, role').eq('user_id', userId).single();
  if (!profile) return 'User profile not found.';

  // Enforce scope restrictions
  if (role === 'employee' && scope !== 'my_tickets') scope = 'my_tickets';

  let query = supabase.from('tickets').select('status, category, sentiment, created_at, updated_at, resolution_notes');

  if (scope === 'my_tickets') {
    query = role === 'it_helpdesk' ? query.eq('assigned_to', profile.id) : query.eq('employee_id', profile.id);
  } else if (scope === 'team_tickets' && role === 'it_helpdesk') {
    query = query.eq('assigned_to', profile.id);
  }

  // Time filter
  const now = new Date();
  if (timePeriod === 'today') {
    query = query.gte('created_at', new Date(now.setHours(0, 0, 0, 0)).toISOString());
  } else if (timePeriod === 'this_week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    query = query.gte('created_at', weekAgo.toISOString());
  } else if (timePeriod === 'this_month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    query = query.gte('created_at', monthAgo.toISOString());
  }

  const { data: tickets, error } = await query;
  if (error) return `Error fetching analytics: ${error.message}`;
  if (!tickets || tickets.length === 0) return 'No ticket data found for the selected period.';

  // Compute stats
  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const sentimentCounts: Record<string, number> = {};
  let resolvedCount = 0;

  tickets.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    if (t.sentiment) sentimentCounts[t.sentiment] = (sentimentCounts[t.sentiment] || 0) + 1;
    if (t.status === 'resolved' || t.status === 'closed') resolvedCount++;
  });

  const resolutionRate = tickets.length > 0 ? ((resolvedCount / tickets.length) * 100).toFixed(1) : '0';

  const statusStr = Object.entries(statusCounts).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  const categoryStr = Object.entries(categoryCounts).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  const sentimentStr = Object.entries(sentimentCounts).map(([k, v]) => `  ${k}: ${v}`).join('\n') || '  No sentiment data';

  return `📊 **Ticket Analytics** (${timePeriod.replace('_', ' ')})

**Total Tickets**: ${tickets.length}
**Resolution Rate**: ${resolutionRate}%

**By Status**:
${statusStr}

**By Category**:
${categoryStr}

**By Sentiment**:
${sentimentStr}`;
}

async function handleUpdateAccountDetails(userId: string, fullName: string): Promise<string> {
  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userId).single();
  if (!profile) return 'Profile not found.';

  const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
  if (error) return `Failed to update: ${error.message}`;

  await logChatbotResolution(userId, 'account_update', 'account_update', true, `Updated name to ${fullName}`);
  return `✅ Account updated successfully! Your name has been changed to: ${fullName}`;
}

async function handleLookupUser(search: string): Promise<string> {
  const { data: users } = await supabase.from('profiles')
    .select('id, full_name, email, role, specialization, created_at')
    .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    .limit(5);

  if (!users || users.length === 0) return `No users found matching "${search}".`;

  const results = [];
  for (const user of users) {
    const { count: ticketCount } = await supabase.from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', user.id);

    const { data: recentTickets } = await supabase.from('tickets')
      .select('title, status, sentiment, created_at')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    const recentStr = recentTickets?.map(t => `    - ${t.title} [${t.status}] ${t.sentiment ? `(${t.sentiment})` : ''}`).join('\n') || '    None';

    results.push(`👤 **${user.full_name}** (${user.email})
  Role: ${user.role} | Specialization: ${user.specialization || 'N/A'}
  Joined: ${new Date(user.created_at).toLocaleDateString()}
  Total Tickets: ${ticketCount || 0}
  Recent Tickets:\n${recentStr}`);
  }

  return results.join('\n\n');
}

// ============ Self-Service Tools ============

async function handlePasswordReset(userId: string): Promise<string> {
  if (!userId) return '⚠️ User not identified.';
  try {
    const tempPassword = generateTempPassword();
    const { error } = await supabase.functions.invoke('admin-update-password', {
      body: { userId, newPassword: tempPassword }
    });
    if (error) {
      await createAndAssignTicket(userId, 'Password Reset Request', 'Automated reset failed', 'access');
      await logChatbotResolution(userId, 'password_reset', 'ticket_created', false, 'Password reset failed');
      return `⚠️ Password reset failed: ${error.message}. A ticket has been created for manual assistance.`;
    }
    await logChatbotResolution(userId, 'password_reset', 'password_reset', true, 'Password reset successful');
    return `✅ Password reset successful! Your new temporary password is: ${tempPassword}\n\nPlease change this password after your first login.`;
  } catch (error) {
    return `⚠️ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function handleCreateTicket(userId: string, title: string, description: string, category: string): Promise<string> {
  if (!userId) return '⚠️ Unable to create ticket: User not identified.';
  const result = await createAndAssignTicket(userId, title, description, category);
  if (result.success) {
    await logChatbotResolution(userId, category, 'ticket_created', false, title);
    return `✅ Ticket created successfully!\n- Ticket ID: ${result.ticketId}\n- Assigned to: ${result.assignedTo}\n- Category: ${category}\n- Status: ${result.assignedTo !== 'Available Specialist' ? 'In Progress' : 'Open'}`;
  }
  return `⚠️ Failed to create ticket: ${result.error}. Please try manually.`;
}

// ============ Helpers ============

async function logChatbotResolution(userId: string, issueType: string, resolutionMethod: string, wasResolvedByAI: boolean, message: string) {
  try {
    await supabase.from('chatbot_resolutions').insert({
      user_id: userId, issue_type: issueType, resolution_method: resolutionMethod,
      was_resolved_by_ai: wasResolvedByAI, message
    });
  } catch (error) {
    console.error('Error logging resolution:', error);
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
}

function getVPNGuide(issueType: string): string {
  const guides: Record<string, string> = {
    setup: `📡 VPN Setup Guide:\n1. Download Cisco AnyConnect from: https://powergrid.com/vpn-client\n2. Install and launch the application\n3. Enter VPN address: vpn.powergrid.com\n4. Use your company credentials\n5. Click Connect`,
    connection_failed: `🔧 VPN Connection Troubleshooting:\n1. Check your internet connection\n2. Verify credentials\n3. Try disconnecting and reconnecting\n4. Restart the VPN client\n5. Check firewall (ports 443, 10000)\n6. Try mobile hotspot to rule out network issues`,
    slow_speed: `⚡ VPN Speed Optimization:\n1. Connect to nearest server\n2. Close unnecessary apps\n3. Check speed without VPN first\n4. Try different protocols\n5. Restart router/modem`,
    credentials: `🔑 VPN Credentials Help:\n- Username: Your company email\n- Password: Same as email password\n- If recently changed, wait 10 minutes\n- Forgot password? I can reset it for you!`
  };
  return guides[issueType] || 'VPN guidance provided.';
}

function getTroubleshootingGuide(category: string): string {
  const guides: Record<string, string> = {
    email: `📧 Email Troubleshooting:\n1. Check internet\n2. Verify credentials\n3. Clear browser cache\n4. Try incognito mode\n5. Check other devices\n6. Restart email client`,
    wifi: `📶 WiFi Troubleshooting:\n1. Toggle WiFi off/on\n2. Forget and reconnect\n3. Restart device\n4. Check if others have WiFi\n5. Move closer to router\nNetwork: PowerGrid-Corp`,
    printer: `🖨️ Printer Troubleshooting:\n1. Check printer is on with paper\n2. Clear print queue\n3. Restart printer\n4. Remove and re-add\n5. Update drivers\n6. Print test page`,
    software_crash: `💥 Software Crash Solutions:\n1. Force close app\n2. Restart computer\n3. Check for updates\n4. Run as administrator\n5. Reinstall\n6. Check system requirements`,
    slow_computer: `🐌 Slow Computer Fixes:\n1. Restart\n2. Close unnecessary programs\n3. Check Task Manager\n4. Run Disk Cleanup\n5. Check disk space (need 10% free)\n6. Scan for malware`
  };
  return guides[category] || 'Troubleshooting guidance provided.';
}

async function createAndAssignTicket(userId: string, title: string, description: string, category: string) {
  try {
    const { data: employeeProfile } = await supabase.from('profiles').select('id').eq('user_id', userId).single();
    if (!employeeProfile) return { success: false, error: 'Employee profile not found' };

    const { data: helpdeskStaff } = await supabase.from('profiles')
      .select('id, full_name, specialization')
      .eq('role', 'it_helpdesk').eq('specialization', category);

    let assignedTo = null;
    let assignedToName = 'Available Specialist';

    if (helpdeskStaff && helpdeskStaff.length > 0) {
      assignedTo = helpdeskStaff[0].id;
      assignedToName = helpdeskStaff[0].full_name;
    }

    const { data: ticket, error } = await supabase.from('tickets').insert({
      employee_id: employeeProfile.id, title, description, category,
      assigned_to: assignedTo, status: assignedTo ? 'in_progress' : 'open'
    }).select('id').single();

    if (error) return { success: false, error: error.message };
    return { success: true, ticketId: ticket.id, assignedTo: assignedToName };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
