/**
 * Email Configuration Test Script
 * Run this to verify your SMTP settings are configured correctly
 *
 * Usage: node test-email-config.js your-test-email@example.com
 */

require("dotenv").config({ path: ".env.local" });
const nodemailer = require("nodemailer");

const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error("❌ Error: Please provide a recipient email address");
  console.log("\nUsage: node test-email-config.js your-email@example.com\n");
  process.exit(1);
}

console.log("🔍 Testing Email Configuration...\n");

// Check required environment variables
const requiredVars = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

console.log("📋 Configuration Check:");
let missingVars = [];

Object.entries(requiredVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`  ❌ ${key}: Not set`);
    missingVars.push(key);
  } else {
    // Hide password for security
    const displayValue = key === "SMTP_PASS" ? "****" : value;
    console.log(`  ✅ ${key}: ${displayValue}`);
  }
});

if (missingVars.length > 0) {
  console.error("\n❌ Missing required environment variables!");
  console.log("\nPlease add these to your .env.local file:");
  missingVars.forEach((varName) => {
    console.log(`  ${varName}=your-value-here`);
  });
  console.log("\nSee .env.example for reference\n");
  process.exit(1);
}

console.log("\n📧 Sending test email...\n");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test email content
const mailOptions = {
  from: `"YouTube Emotion Analysis" <${process.env.SMTP_USER}>`,
  to: recipientEmail,
  subject: "✅ Email Configuration Test - Success!",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .success { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .info { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ Email Test Successful!</h1>
        </div>
        
        <div class="success">
          <h3 style="margin-top: 0; color: #065f46;">🎉 Configuration Verified</h3>
          <p style="color: #047857;">Your SMTP settings are configured correctly and emails can be sent successfully!</p>
        </div>
        
        <div class="info">
          <h3 style="margin-top: 0; color: #1e40af;">📧 Email Server Details</h3>
          <ul style="color: #1e3a8a;">
            <li><strong>Host:</strong> ${process.env.SMTP_HOST}</li>
            <li><strong>Port:</strong> ${process.env.SMTP_PORT}</li>
            <li><strong>Sender:</strong> ${process.env.SMTP_USER}</li>
            <li><strong>Recipient:</strong> ${recipientEmail}</li>
          </ul>
        </div>
        
        <div style="margin: 20px 0; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #92400e;">🚀 Next Steps</h3>
          <ol style="color: #78350f;">
            <li>Start the Next.js development server: <code>npm run dev</code></li>
            <li>Start the email scheduler: <code>npm run scheduler</code></li>
            <li>Create a schedule from the dashboard</li>
            <li>Wait for the scheduled time to receive your report!</li>
          </ol>
        </div>
        
        <div class="footer">
          <p>This is a test email from YouTube Emotion Analysis</p>
          <p>If you received this, your scheduled email feature is ready to use!</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
✅ Email Configuration Test - Success!

🎉 Configuration Verified
Your SMTP settings are configured correctly and emails can be sent successfully!

📧 Email Server Details:
- Host: ${process.env.SMTP_HOST}
- Port: ${process.env.SMTP_PORT}
- Sender: ${process.env.SMTP_USER}
- Recipient: ${recipientEmail}

🚀 Next Steps:
1. Start the Next.js development server: npm run dev
2. Start the email scheduler: npm run scheduler
3. Create a schedule from the dashboard
4. Wait for the scheduled time to receive your report!

---
This is a test email from YouTube Emotion Analysis.
If you received this, your scheduled email feature is ready to use!
  `.trim(),
};

// Send test email
transporter
  .sendMail(mailOptions)
  .then((info) => {
    console.log("✅ Test email sent successfully!\n");
    console.log("📬 Message Details:");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Recipient: ${recipientEmail}`);
    console.log(`   Response: ${info.response}\n`);
    console.log(
      "🎉 Success! Check your inbox (and spam folder) for the test email.\n",
    );
    console.log("📝 If you received the email, your configuration is correct!");
    console.log("   You can now use the scheduled email feature.\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to send test email\n");
    console.error("Error Details:");
    console.error(`   ${error.message}\n`);

    // Common error solutions
    if (error.message.includes("Invalid login")) {
      console.log("💡 Common Solution for Gmail:");
      console.log(
        "   1. Enable 2-Factor Authentication on your Google account",
      );
      console.log(
        "   2. Generate an App Password at: https://myaccount.google.com/apppasswords",
      );
      console.log("   3. Use the 16-character App Password in SMTP_PASS\n");
    } else if (error.message.includes("ECONNREFUSED")) {
      console.log("💡 Connection Refused:");
      console.log("   1. Check your SMTP_HOST is correct");
      console.log(
        "   2. Verify your firewall allows outbound connections on the SMTP port",
      );
      console.log("   3. Try using port 587 instead of 465\n");
    } else if (error.message.includes("Timeout")) {
      console.log("💡 Connection Timeout:");
      console.log("   1. Check your internet connection");
      console.log("   2. Verify SMTP server is reachable");
      console.log("   3. Try a different SMTP provider\n");
    }

    console.log("📚 For more help, see: SCHEDULED_EMAIL_SETUP.md\n");
    process.exit(1);
  });
