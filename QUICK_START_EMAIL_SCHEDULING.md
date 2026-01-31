# 🚀 Quick Start Guide - Scheduled Email Reports

## What's New?

You can now schedule automated email reports for your YouTube video emotion analysis! Reports are sent at your chosen time with beautiful charts and statistics.

## 📋 Quick Setup (3 Steps)

### 1️⃣ Install Dependencies

Already done! The following packages were installed:

- `nodemailer` - for sending emails
- `node-cron` - for scheduling tasks

### 2️⃣ Configure Email Settings

Add these to your `.env.local` file:

```env
# Email Configuration (Use Gmail for easy setup)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-app-password-here
```

**Getting Gmail App Password:**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate password for "Mail"
5. Copy the 16-character password to `SMTP_PASS`

### 3️⃣ Start the Services

**Terminal 1** - Start Next.js:

```bash
npm run dev
```

**Terminal 2** - Start Email Scheduler:

```bash
npm run scheduler
```

Or on Windows, use:

```bash
start_scheduler.bat
```

## 🎯 How to Use

### Create a Schedule

1. **Go to any video dashboard**
   - Navigate to `/dashboard/[videoId]`
2. **Click "Set Schedule" button** (purple button next to Download PDF)

3. **Fill in the form:**
   - **Email**: Where to send the report
   - **Frequency**:
     - Daily (every day)
     - Weekly (every Monday)
     - Monthly (1st of month)
   - **Time**: When to send (24-hour format, e.g., 09:00)

4. **Click "Create Schedule"**

### What You Get

**Beautiful HTML email with:**

- ✅ Video title and statistics
- ✅ Total comments analyzed
- ✅ Color-coded emotion breakdown
- ✅ Top emotion highlighted
- ✅ Link back to full dashboard
- ✅ Professional design

**Example:**

```
📊 Emotion Analysis Report
━━━━━━━━━━━━━━━━━━━━━━━━

Video: My Awesome Video
Total Comments: 150
Top Emotion: Joy (45%)

Emotion Breakdown:
Joy       ████████████ 68 (45%)
Sadness   ██████       30 (20%)
...
```

## 📁 Files Added

```
your-project/
├── components/
│   └── ScheduleModal.jsx           ← Schedule UI modal
├── app/api/schedule/
│   ├── create/route.js             ← Save schedules
│   └── send-email/route.js         ← Send emails
├── lib/
│   ├── emailTemplate.js            ← Email HTML generator
│   └── scheduler.js                ← Cron job runner
├── data/
│   └── schedules.json              ← Stored schedules (auto-created)
├── start_scheduler.bat             ← Windows scheduler starter
└── SCHEDULED_EMAIL_SETUP.md        ← Full documentation
```

## 🔍 Testing

### Test Email Manually

Use Postman or curl:

```bash
curl -X POST http://localhost:3000/api/schedule/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "your-video-id",
    "videoTitle": "Test Video",
    "recipientEmail": "your@email.com"
  }'
```

### Check Scheduler Logs

The scheduler outputs to console:

```
🚀 Email Scheduler started
⏰ Checking for scheduled emails every minute...

[1/31/2026, 9:00:00 AM] Running scheduled check...
📧 Sending email for schedule: ...
✅ Email sent successfully!
```

## ⚙️ Configuration Options

### Change Check Frequency

Edit `lib/scheduler.js`:

```javascript
// Current: every minute
cron.schedule("* * * * *", checkSchedules);

// Every 5 minutes:
cron.schedule("*/5 * * * *", checkSchedules);

// Every hour:
cron.schedule("0 * * * *", checkSchedules);
```

### Use Different Email Provider

See [SCHEDULED_EMAIL_SETUP.md](SCHEDULED_EMAIL_SETUP.md) for:

- SendGrid
- Mailgun
- AWS SES
- Other SMTP providers

## ❗ Troubleshooting

### "Email not sending"

- ✅ Check SMTP credentials in `.env.local`
- ✅ Verify Gmail App Password is correct
- ✅ Check console logs for errors

### "Scheduler not running"

- ✅ Make sure you ran `npm run scheduler`
- ✅ Check if `data/schedules.json` exists
- ✅ Verify `NEXTAUTH_URL` matches your app URL

### "Schedule not triggering"

- ✅ Scheduler uses server's local time
- ✅ Time must be in 24-hour format (HH:MM)
- ✅ Weekly sends only on Mondays
- ✅ Monthly sends only on 1st of month

## 📚 Full Documentation

For detailed information, see:

- **[SCHEDULED_EMAIL_SETUP.md](SCHEDULED_EMAIL_SETUP.md)** - Complete setup guide
- **[.env.example](.env.example)** - Environment variable template

## 🎉 You're All Set!

1. Configure SMTP settings
2. Start both services (Next.js + Scheduler)
3. Create a schedule from dashboard
4. Receive automated email reports!

---

**Need Help?** Check the full documentation in [SCHEDULED_EMAIL_SETUP.md](SCHEDULED_EMAIL_SETUP.md)
