import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KnowledgeArticle {
  title: string;
  content: string;
  category: string;
  status: string;
}

const articles: KnowledgeArticle[] = [
  {
    title: 'Printer Not Responding or Offline',
    category: 'hardware',
    status: 'published',
    content: `## Problem Description
Your printer appears offline, won't print, or shows as unavailable in the print queue.

## Common Causes
- Printer not properly connected to network
- Outdated or corrupted printer drivers
- Print spooler service issues
- Network connectivity problems

## Step-by-Step Solution

### Step 1: Basic Checks
1. Verify the printer is powered on
2. Check if printer display shows any error messages
3. Ensure printer is connected to the same network as your computer
4. Try printing a test page directly from the printer

### Step 2: Check Printer Connection
1. Open **Settings** > **Devices** > **Printers & scanners**
2. Find your printer in the list
3. Click on it and select **Manage**
4. Click **Set as default** if it's not already
5. If it shows offline, click **Use Printer Offline** to toggle it back online

### Step 3: Restart Print Spooler Service
1. Press **Windows + R** to open Run dialog
2. Type \`services.msc\` and press Enter
3. Scroll down to find **Print Spooler**
4. Right-click and select **Restart**
5. Try printing again

### Step 4: Update Printer Drivers
1. Right-click on **Start** and select **Device Manager**
2. Expand **Print queues** or **Printers**
3. Right-click on your printer
4. Select **Update driver**
5. Choose **Search automatically for updated driver software**
6. Restart your computer after installation

### Step 5: Clear Print Queue
1. Open **Settings** > **Devices** > **Printers & scanners**
2. Select your printer and click **Open queue**
3. Click **Printer** menu > **Cancel All Documents**
4. Confirm the action
5. Try printing again

## Prevention Tips
- Keep printer drivers updated regularly
- Ensure stable network connection
- Regularly check printer firmware updates
- Avoid turning off printer during print jobs

## When to Escalate
If the issue persists after trying all steps, create a ticket with:
- Printer model and serial number
- Error messages or codes displayed
- Screenshots of error dialogs
- Network connection details`
  },
  {
    title: 'Email Not Syncing on Mobile Device',
    category: 'software',
    status: 'published',
    content: `## Problem Description
Your email is not syncing properly on your mobile device, or you're not receiving new emails.

## Common Causes
- Incorrect email account settings
- Poor internet connection
- Device storage full
- Outdated email app
- Server synchronization issues

## Step-by-Step Solution

### Step 1: Check Internet Connection
1. Open a web browser on your device
2. Try visiting a website to confirm connectivity
3. Switch between WiFi and mobile data to test
4. Restart your router if using WiFi

### Step 2: Verify Email Account Settings
**For iOS:**
1. Go to **Settings** > **Mail** > **Accounts**
2. Tap on your email account
3. Verify the email address and password
4. Ensure **Mail** toggle is ON
5. Check **Fetch New Data** settings

**For Android:**
1. Open **Settings** > **Accounts**
2. Select your email account
3. Verify **Account sync** is enabled
4. Tap **Sync now** to force synchronization

### Step 3: Check Storage Space
1. Go to **Settings** > **Storage**
2. Check available space (need at least 500MB free)
3. Delete unnecessary files or apps if storage is low
4. Clear email app cache:
   - Settings > Apps > Email App > Storage > Clear Cache

### Step 4: Update Email App
**iOS:**
1. Open **App Store**
2. Tap your profile icon
3. Scroll to **Available Updates**
4. Update the mail app if available

**Android:**
1. Open **Google Play Store**
2. Tap menu > **My apps & games**
3. Find your email app
4. Tap **Update** if available

### Step 5: Remove and Re-add Account
1. Go to account settings
2. Select your email account
3. Choose **Delete Account** or **Remove**
4. Restart your device
5. Add the account again with correct credentials

## Prevention Tips
- Keep your device updated
- Maintain adequate storage space
- Use strong WiFi connections
- Enable automatic sync
- Regularly update email apps

## When to Escalate
Contact IT support if:
- Error messages persist after all steps
- Multiple devices have the same issue
- Specific error codes appear
- Account credentials don't work on any device`
  },
  {
    title: 'Computer Running Slow - Performance Optimization',
    category: 'hardware',
    status: 'published',
    content: `## Problem Description
Your computer is running slower than usual, applications take time to open, or the system feels sluggish.

## Common Causes
- Too many startup programs
- Insufficient RAM or storage
- Malware or viruses
- Outdated system drivers
- Disk fragmentation
- Background processes consuming resources

## Step-by-Step Solution

### Step 1: Check System Resources
1. Press **Ctrl + Shift + Esc** to open Task Manager
2. Click **Performance** tab
3. Check CPU, Memory, and Disk usage
4. Identify processes using high resources
5. Note any processes consistently above 50%

### Step 2: Disable Startup Programs
1. Open Task Manager (Ctrl + Shift + Esc)
2. Click **Startup** tab
3. Review the list of programs
4. Right-click unnecessary programs
5. Select **Disable**
6. Restart your computer

**Tip:** Only disable programs you recognize and don't need at startup

### Step 3: Free Up Disk Space
1. Open **Settings** > **System** > **Storage**
2. Click **Temporary files**
3. Select items to delete:
   - Downloads folder
   - Recycle Bin
   - Temporary files
   - Windows Update Cleanup
4. Click **Remove files**

**Manual cleanup:**
1. Empty Recycle Bin
2. Clear browser cache and history
3. Uninstall unused programs
4. Move large files to external storage

### Step 4: Run Disk Cleanup
1. Press **Windows + S** and type "Disk Cleanup"
2. Select the drive (usually C:)
3. Click **Clean up system files**
4. Check all boxes
5. Click **OK** and confirm

### Step 5: Check for Malware
1. Open **Windows Security**
2. Click **Virus & threat protection**
3. Click **Quick scan**
4. If issues found, run **Full scan**
5. Follow prompts to remove threats

### Step 6: Update Windows and Drivers
1. Open **Settings** > **Update & Security**
2. Click **Check for updates**
3. Install all available updates
4. Restart your computer

### Step 7: Defragment Hard Drive (HDD only)
**Note:** Skip this step if you have an SSD

1. Press **Windows + S** and type "Defragment"
2. Select **Defragment and Optimize Drives**
3. Select your drive
4. Click **Analyze**
5. If fragmentation > 10%, click **Optimize**

## Quick Performance Checks
- **RAM:** Should not consistently exceed 80%
- **Storage:** Should have at least 15% free space
- **CPU:** Should idle below 20% when not in use

## Prevention Tips
- Regularly restart your computer (weekly)
- Keep Windows and software updated
- Use antivirus software
- Limit browser extensions
- Uninstall unused programs monthly
- Avoid keeping too many files on desktop
- Schedule regular disk cleanup

## When to Escalate
Create a ticket if:
- Performance issues persist after all steps
- Computer crashes or freezes frequently
- Blue screen errors appear
- Strange sounds from the computer
- Need hardware upgrade consultation`
  },
  {
    title: 'Forgot Password - Account Recovery',
    category: 'access',
    status: 'published',
    content: `## Problem Description
You forgot your password and cannot access your account or need to reset it for security reasons.

## Important Security Notes
- Never share your password with anyone
- IT staff will never ask for your password
- Use unique passwords for different accounts
- Change passwords immediately if compromised

## Step-by-Step Password Reset

### Step 1: Self-Service Password Reset
1. Go to the login page
2. Click **Forgot Password?** link
3. Enter your email address
4. Click **Send Reset Link**
5. Check your email (including spam folder)
6. Click the reset link in the email
7. Create a new password following requirements

**Password Requirements:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)
- Cannot be same as previous 5 passwords

### Step 2: If Reset Email Not Received
1. Wait 5-10 minutes for email to arrive
2. Check spam/junk folder
3. Verify you entered correct email address
4. Check if email inbox is full
5. Try reset process again
6. Contact IT if still no email after 15 minutes

### Step 3: Update Password on All Devices
After resetting, update password on:
1. Desktop/laptop computers
2. Mobile phone email apps
3. Tablet devices
4. Any other connected devices

### Step 4: Two-Factor Authentication Setup
1. Go to **Account Settings** > **Security**
2. Click **Enable Two-Factor Authentication**
3. Choose method:
   - SMS to mobile phone (recommended)
   - Authenticator app (most secure)
   - Email backup codes
4. Follow prompts to complete setup
5. Save backup codes in secure location

## Creating Strong Passwords

### Password Strategy:
- Use a passphrase: "Coffee@Morning2024!"
- Combine random words with numbers/symbols
- Avoid personal information (birthdays, names)
- Don't use common words or sequences

### Examples of Strong Passwords:
✅ BlueSky&Mountains42!
✅ Coffee$Sunrise@2024
✅ TravelDream#Summer99

## Account Security Checklist

✓ Use unique password for work account
✓ Enable two-factor authentication
✓ Use password manager
✓ Never share passwords
✓ Change password every 90 days
✓ Don't write passwords down
✓ Use different passwords for personal accounts
✓ Log out on shared computers

## When to Escalate

Contact IT support immediately if:
- Reset email not received after 30 minutes
- Account locked and urgent access needed
- Suspicious activity on your account
- Cannot verify identity
- Reset link expired
- Multiple password reset attempts failed
- Account compromised or hacked`
  },
  {
    title: 'Laptop Won\'t Turn On or Charge',
    category: 'hardware',
    status: 'published',
    content: `## Problem Description
Your laptop doesn't respond when pressing the power button, won't charge, or shows no signs of power.

## Common Causes
- Dead battery or faulty charger
- Loose power connections
- Hardware failure
- System in hibernation/sleep mode
- Power button malfunction

## Step-by-Step Solution

### Step 1: Check Power Source
1. Verify power outlet is working:
   - Plug in another device to test
   - Try a different outlet
2. Check power strip/surge protector is on
3. Look for indicator lights on charger
4. Inspect charger cable for damage

### Step 2: Inspect Charging Port
1. Examine laptop charging port for:
   - Physical damage
   - Debris or dust
   - Bent pins
2. Gently clean port with compressed air
3. Ensure charger plug fits snugly
4. Check for charging indicator light

### Step 3: Check Battery Status
1. Look for LED indicators on laptop
2. If removable battery:
   - Power off laptop completely
   - Remove battery
   - Hold power button for 30 seconds
   - Reinsert battery
   - Try powering on

### Step 4: Perform Hard Reset
1. Disconnect all external devices:
   - USB drives
   - External monitors
   - Docking stations
   - Peripherals
2. Unplug power cable
3. Remove battery (if removable)
4. Press and hold power button for 30 seconds
5. Reconnect power (not battery yet)
6. Try turning on
7. If successful, reconnect battery

### Step 5: Test with Alternative Charger
1. Try a different compatible charger
2. Borrow from colleague with same laptop model
3. Check voltage and amperage match
4. Observe if charging light appears

### Step 6: Check for Signs of Life
**Listen for:**
- Fan noise
- Hard drive spinning
- Beeping sounds (error codes)

**Look for:**
- LED indicators
- Screen backlight (even if dim)
- Keyboard backlight
- Caps Lock light response

## Warning Signs

Seek immediate help if you notice:
- Burning smell
- Excessive heat
- Swollen battery
- Unusual noises
- Smoke or sparks
- Liquid leakage

**DO NOT:**
- Continue using swollen battery
- Force connectors
- Open laptop case yourself
- Use damaged chargers

## Prevention Tips

### Daily Care:
- Don't let battery drain to 0% regularly
- Keep battery between 20-80% for longevity
- Avoid extreme temperatures
- Use original or approved chargers

### Monthly Maintenance:
- Clean charging port with compressed air
- Check charger cable for wear
- Update BIOS/firmware

## When to Escalate

Create urgent ticket if:
- All troubleshooting steps failed
- Physical damage visible
- Battery swollen or damaged
- Burning smell or unusual heat
- Device under warranty
- Critical work deadline approaching

**What to Include in Ticket:**
- Laptop model and serial number
- Detailed description of issue
- Troubleshooting steps already tried
- Any error messages or LED codes
- Photos of physical damage
- Whether laptop is under warranty`
  },
  {
    title: 'Software Installation Requests',
    category: 'software',
    status: 'published',
    content: `## Problem Description
You need to install new software or update existing applications on your work computer.

## Important Notes
- Only approved software can be installed
- Admin rights required for most installations
- Security scanning performed on all software
- License compliance must be verified

## Step-by-Step Process

### Step 1: Check if Software is Available
1. Open **Software Center** on your computer
2. Browse available applications
3. Check if your needed software is listed
4. If found, proceed to Step 3

### Step 2: Request New Software
If software not in catalog:
1. Create a ticket with IT
2. Provide software details:
   - Software name and version
   - Publisher/developer name
   - Official website
   - Business justification
   - Number of licenses needed
   - Department budget code
3. Wait for approval (typically 2-3 business days)

### Step 3: Self-Service Installation
For approved software in catalog:
1. Open **Software Center**
2. Search for the application
3. Click on the software name
4. Review system requirements
5. Click **Install**
6. Wait for installation to complete
7. Restart if prompted

### Step 4: Verify Installation
1. Check Start Menu for application
2. Launch the software
3. Verify it opens correctly
4. Test basic functionality
5. Check for updates within the app

## Software Request Requirements

### Information to Provide:
- **Software Name:** Full name and version
- **Purpose:** Why you need it
- **Alternative:** Have you tried existing tools?
- **Cost:** Free or paid (include pricing)
- **Users:** How many people need it?
- **Duration:** Temporary or permanent need?
- **Urgency:** When do you need it?

### Business Justification Examples:
✅ "Need Adobe Acrobat Pro to edit PDF contracts daily"
✅ "Require Slack for team collaboration with remote workers"
✅ "Need Python for data analysis project starting next week"

❌ "Want to try it out"
❌ "It looks nice"
❌ "Everyone else has it"

## Common Software Categories

### Pre-Approved (Usually Available):
- Microsoft Office Suite
- Web browsers (Chrome, Firefox, Edge)
- PDF readers
- Zoom/Teams
- Antivirus software
- VPN clients

### Requires Approval:
- Development tools
- Design software
- Specialized applications
- Software with licensing costs
- Administrative tools

### Generally Not Approved:
- Personal file-sharing apps
- Unauthorized cloud storage
- Games
- P2P software
- VPN services (non-company)

## Update Existing Software

### Automatic Updates:
Most corporate software updates automatically through:
1. Windows Update
2. Software Center
3. Application auto-update

### Manual Update Check:
1. Open the application
2. Go to **Help** or **About** menu
3. Click **Check for Updates**
4. Follow prompts to install

### If Updates Fail:
1. Restart your computer
2. Check internet connection
3. Verify you have admin rights
4. Contact IT if still failing

## Troubleshooting Installation Issues

### Error: "Requires Administrator Rights"
- Request IT assistance
- May need temporary admin access
- IT can install remotely

### Error: "Incompatible with this system"
- Check system requirements
- Verify Windows version
- May need OS upgrade
- Contact IT for alternatives

### Installation Hangs or Freezes
1. Wait 10-15 minutes (some installations are slow)
2. Check Task Manager for progress
3. If truly frozen, restart computer
4. Try installation again
5. Contact IT if problem persists

### Software Won't Launch After Installation
1. Restart your computer
2. Check for Windows updates
3. Run as administrator (if allowed)
4. Reinstall the software
5. Check antivirus isn't blocking it

## License Management

### Personal vs. Corporate Licenses:
- Use corporate licenses for work
- Don't install personal licensed software on work computers
- Don't use work licenses on personal devices

### License Types:
- **Per User:** Tied to your account
- **Per Device:** Tied to your computer
- **Site License:** Available to all employees
- **Concurrent:** Limited number of simultaneous users

## Software Removal

### To Uninstall Software:
1. Open **Settings** > **Apps**
2. Find the application
3. Click **Uninstall**
4. Follow prompts
5. Restart if required

**Note:** Some software requires IT approval to remove

## Security Considerations

### Never Download From:
❌ Unknown websites
❌ Email attachments from unknown senders
❌ Torrent sites
❌ Unofficial download mirrors
❌ Pop-up advertisements

### Always Download From:
✅ Software Center
✅ Official vendor websites
✅ Microsoft Store (approved apps)
✅ IT-provided links

## Mobile Device Apps

### To Install Apps on Company Devices:
1. Use Company Portal app
2. Browse available apps
3. Install approved applications
4. Report any issues to IT

### Personal Device (BYOD):
1. Check company BYOD policy
2. May need Company Portal
3. Work apps separated from personal
4. Follow mobile device management (MDM) rules

## When to Create a Ticket

Contact IT if:
- Software not available in catalog
- Installation fails repeatedly
- Software needs admin rights
- License key needed
- Software for entire team
- Custom configuration required
- Integration with other systems needed
- Training required for new software

**Ticket Should Include:**
- Software name and version
- Business justification
- Urgency level
- Budget approval (if applicable)
- Number of users
- Preferred installation date`
  }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get admin user to use as created_by
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminProfile) {
      throw new Error('No admin user found');
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const article of articles) {
      // Check if article already exists
      const { data: existing } = await supabase
        .from('knowledge_base')
        .select('id')
        .eq('title', article.title)
        .single();

      if (existing) {
        console.log(`Skipping existing article: ${article.title}`);
        skippedCount++;
        continue;
      }

      // Insert the article
      const { error } = await supabase
        .from('knowledge_base')
        .insert({
          ...article,
          created_by: adminProfile.id,
        });

      if (error) {
        console.error(`Error inserting article ${article.title}:`, error);
      } else {
        console.log(`Inserted article: ${article.title}`);
        insertedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Knowledge base seeded successfully`,
        inserted: insertedCount,
        skipped: skippedCount,
        total: articles.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error seeding knowledge base:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
