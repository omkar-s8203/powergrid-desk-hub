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
      ? "You are PowerGrid's IT admin assistant. Help with system administration, user management, ticket oversight, and technical decisions. Keep responses professional and focused on admin tasks."
      : role === 'it_helpdesk'
      ? "You are PowerGrid's IT helpdesk assistant. Help with technical troubleshooting, ticket resolution, and providing solutions to common IT problems. Be helpful and solution-oriented."
      : `You are PowerGrid's employee support assistant with self-service capabilities. 
PRIORITY: Always try to resolve issues automatically first using available tools.
- For password resets: Use reset_password tool
- For VPN access: Use vpn_access_guide tool  
- For common issues: Use troubleshooting_guide tool
Only create tickets if you cannot resolve the issue yourself. Be friendly and proactive.`;

    // Define tools for self-service resolution
    const tools = role === 'employee' ? [
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
              issue_type: { 
                type: "string", 
                enum: ["setup", "connection_failed", "slow_speed", "credentials"],
                description: "Type of VPN issue" 
              }
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
              issue_category: { 
                type: "string",
                enum: ["email", "wifi", "printer", "software_crash", "slow_computer"],
                description: "Category of the issue"
              }
            },
            required: ["issue_category"]
          }
        }
      }
    ] : [];

    const requestBody: any = {
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
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

    // Handle tool calls for self-service resolution
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log('Tool call:', functionName, functionArgs);

      let toolResult = '';

      switch (functionName) {
        case 'reset_password':
          if (userId) {
            const resetResult = await handlePasswordReset(userId);
            toolResult = resetResult.success 
              ? `✅ Password reset successful! Your new temporary password is: ${resetResult.newPassword}\n\nPlease change this password after your first login for security.`
              : `⚠️ Password reset failed: ${resetResult.error}. Creating a ticket for manual assistance.`;
            
            if (resetResult.success) {
              // Log successful AI resolution
              await logChatbotResolution(userId, 'password_reset', 'password_reset', true, message);
            } else {
              await createAndAssignTicket(userId, 'Password Reset Request', message, 'access');
              await logChatbotResolution(userId, 'password_reset', 'ticket_created', false, message);
            }
          }
          break;

        case 'vpn_access_guide':
          toolResult = getVPNGuide(functionArgs.issue_type);
          if (userId) {
            await logChatbotResolution(userId, `vpn_${functionArgs.issue_type}`, 'vpn_guide', true, message);
          }
          break;

        case 'troubleshooting_guide':
          toolResult = getTroubleshootingGuide(functionArgs.issue_category);
          if (userId) {
            await logChatbotResolution(userId, functionArgs.issue_category, 'troubleshooting', true, message);
          }
          break;
      }

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
            { role: 'user', content: message },
            { role: 'assistant', content: null, tool_calls: choice.message.tool_calls },
            { role: 'tool', tool_call_id: toolCall.id, content: toolResult }
          ],
          max_tokens: 500,
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

async function logChatbotResolution(
  userId: string, 
  issueType: string, 
  resolutionMethod: string, 
  wasResolvedByAI: boolean, 
  message: string
) {
  try {
    await supabase.from('chatbot_resolutions').insert({
      user_id: userId,
      issue_type: issueType,
      resolution_method: resolutionMethod,
      was_resolved_by_ai: wasResolvedByAI,
      message: message
    });
  } catch (error) {
    console.error('Error logging chatbot resolution:', error);
  }
}

async function handlePasswordReset(userId: string) {
  try {
    // Generate random temporary password
    const tempPassword = generateTempPassword();
    
    // Call the admin-update-password function
    const { data, error } = await supabase.functions.invoke('admin-update-password', {
      body: { userId, newPassword: tempPassword }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, newPassword: tempPassword };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getVPNGuide(issueType: string): string {
  const guides: Record<string, string> = {
    setup: `📡 VPN Setup Guide:
1. Download Cisco AnyConnect from: https://powergrid.com/vpn-client
2. Install and launch the application
3. Enter VPN address: vpn.powergrid.com
4. Use your company credentials (same as email login)
5. Click Connect

Need help? The connection usually takes 10-15 seconds.`,
    
    connection_failed: `🔧 VPN Connection Troubleshooting:
1. Check your internet connection
2. Verify credentials (same as email)
3. Try disconnecting and reconnecting
4. Restart the VPN client
5. Check if firewall is blocking (ports 443, 10000)
6. Try using mobile hotspot to rule out network issues

Still having issues? I can create a ticket for the network team.`,
    
    slow_speed: `⚡ VPN Speed Optimization:
1. Connect to nearest server location
2. Close unnecessary applications
3. Check your internet speed without VPN first
4. Try different protocols in VPN settings
5. Restart your router/modem

VPN typically reduces speed by 10-20%. If it's slower, let me know.`,
    
    credentials: `🔑 VPN Credentials Help:
- Username: Your company email
- Password: Same as your email password
- If recently changed, wait 10 minutes for sync
- Forgot password? I can reset it for you right now!

Should I reset your password?`
  };

  return guides[issueType] || 'VPN guidance provided.';
}

function getTroubleshootingGuide(category: string): string {
  const guides: Record<string, string> = {
    email: `📧 Email Troubleshooting:
1. Check internet connection
2. Verify email credentials
3. Clear browser cache (Ctrl+Shift+Del)
4. Try incognito/private mode
5. Check if other devices work
6. Restart Outlook/email client

✅ Fixed? Great! Still stuck? I'll create a ticket.`,
    
    wifi: `📶 WiFi Troubleshooting:
1. Turn WiFi off and on
2. Forget network and reconnect
3. Restart your device
4. Check if others have WiFi
5. Move closer to router
6. Try different WiFi network

Network name: PowerGrid-Corp
Password: Contact IT if needed`,
    
    printer: `🖨️ Printer Troubleshooting:
1. Check printer is on and has paper
2. Check printer queue (delete stuck jobs)
3. Restart printer
4. Remove and re-add printer
5. Update printer drivers
6. Try printing test page

Printer not in list? I can help add it.`,
    
    software_crash: `💥 Software Crash Solutions:
1. Force close the application
2. Restart your computer
3. Check for software updates
4. Run as administrator
5. Reinstall the application
6. Check system requirements

Which software is crashing? I'll provide specific steps.`,
    
    slow_computer: `🐌 Slow Computer Fixes:
1. Restart your computer
2. Close unnecessary programs
3. Check Task Manager (Ctrl+Shift+Esc)
4. Clear temp files (Disk Cleanup)
5. Check available disk space (need 10% free)
6. Scan for malware

How long has it been slow? Recent change?`
  };

  return guides[category] || 'Troubleshooting guidance provided.';
}

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