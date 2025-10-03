-- Insert sample knowledge base articles for common IT issues

-- Get the first admin user to use as creator
DO $$
DECLARE
  admin_profile_id uuid;
BEGIN
  -- Get the first admin user's profile id
  SELECT id INTO admin_profile_id 
  FROM profiles 
  WHERE role = 'admin' 
  LIMIT 1;

  -- Insert sample articles only if admin exists
  IF admin_profile_id IS NOT NULL THEN
    -- Hardware Issues
    INSERT INTO knowledge_base (title, content, category, video_url, created_by, status) VALUES
    ('Computer Won''t Start', 
     E'**Problem**: Computer won''t turn on\n\n**Solutions**:\n1. Check if the power cable is properly connected\n2. Verify the power outlet is working\n3. Check if the power supply switch is on\n4. Try a different power cable\n5. If laptop, ensure battery is charged\n\n**Prevention**: Regularly check cable connections and use surge protectors.',
     'hardware',
     NULL,
     admin_profile_id,
     'published'),

    ('Printer Not Working',
     E'**Problem**: Printer not responding or printing incorrectly\n\n**Solutions**:\n1. Check if printer is turned on and connected\n2. Verify paper and ink/toner levels\n3. Clear any paper jams\n4. Restart the printer\n5. Check printer queue for stuck jobs\n6. Reinstall printer drivers\n\n**For Network Printers**: Verify network connection and IP address.',
     'hardware',
     NULL,
     admin_profile_id,
     'published'),

    -- Software Issues
    ('Password Reset Procedure',
     E'**How to Reset Your Password**:\n\n1. Go to the login page\n2. Click "Forgot Password"\n3. Enter your email address\n4. Check your email for reset link\n5. Click the link (valid for 1 hour)\n6. Enter new password (minimum 6 characters)\n7. Confirm new password\n\n**Best Practices**:\n- Use a mix of letters, numbers, and symbols\n- Don''t reuse old passwords\n- Change password every 90 days',
     'software',
     NULL,
     admin_profile_id,
     'published'),

    ('Application Crashes or Freezes',
     E'**Problem**: Software application keeps crashing\n\n**Quick Fixes**:\n1. Save your work immediately\n2. Close and restart the application\n3. Restart your computer\n4. Check for software updates\n5. Clear application cache\n6. Reinstall the application\n\n**If Problem Persists**: Create a ticket with error messages and screenshots.',
     'software',
     NULL,
     admin_profile_id,
     'published'),

    -- Network Issues
    ('Cannot Connect to WiFi',
     E'**Problem**: Unable to connect to wireless network\n\n**Troubleshooting Steps**:\n1. Check if WiFi is enabled on your device\n2. Verify you''re selecting the correct network\n3. Restart your device\n4. Forget and reconnect to the network\n5. Check if other devices can connect\n6. Move closer to the router\n7. Restart the router (if at home)\n\n**Corporate Network**: Contact IT if problem persists.',
     'network',
     NULL,
     admin_profile_id,
     'published'),

    ('Slow Internet Connection',
     E'**Problem**: Internet is very slow\n\n**Solutions**:\n1. Run a speed test (speedtest.net)\n2. Close unnecessary browser tabs\n3. Disconnect unused devices\n4. Clear browser cache\n5. Disable VPN temporarily\n6. Check for background downloads\n7. Restart your router\n\n**At Office**: Report persistent issues to IT for network analysis.',
     'network',
     NULL,
     admin_profile_id,
     'published'),

    -- Access Issues
    ('VPN Connection Issues',
     E'**Problem**: Cannot connect to company VPN\n\n**Solutions**:\n1. Verify your credentials are correct\n2. Check internet connection\n3. Restart VPN client\n4. Update VPN client software\n5. Try different VPN server\n6. Disable firewall temporarily\n7. Restart your computer\n\n**Required**: Contact IT if you need VPN credentials reset.',
     'access',
     NULL,
     admin_profile_id,
     'published'),

    ('Account Locked Out',
     E'**Problem**: Account is locked after multiple failed login attempts\n\n**What to Do**:\n1. Wait 30 minutes (automatic unlock)\n2. OR create a ticket for immediate unlock\n3. Do not attempt to login again (extends lockout)\n\n**Prevention**:\n- Use password manager\n- Enable password save in browser\n- Contact IT before account expires',
     'access',
     NULL,
     admin_profile_id,
     'published'),

    -- General IT Issues
    ('Email Not Sending or Receiving',
     E'**Problem**: Email client not working\n\n**Troubleshooting**:\n1. Check internet connection\n2. Verify email server settings\n3. Check mailbox storage (may be full)\n4. Look in spam/junk folders\n5. Try webmail interface\n6. Restart email client\n7. Check for email client updates\n\n**For Outlook**: Repair Outlook data file (PST).',
     'other',
     NULL,
     admin_profile_id,
     'published'),

    ('Monitor Display Issues',
     E'**Problem**: Monitor shows no display or distorted image\n\n**Solutions**:\n1. Check monitor power and connections\n2. Verify input source is correct\n3. Try different video cable\n4. Test with different monitor\n5. Update graphics drivers\n6. Adjust screen resolution\n7. Check monitor settings (brightness, contrast)\n\n**Multiple Monitors**: Detect displays in Windows settings.',
     'hardware',
     NULL,
     admin_profile_id,
     'published');

  END IF;
END $$;