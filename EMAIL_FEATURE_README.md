# 📧 Scheduled Email Reports - Complete Feature

## 🎯 What This Does

Allows users to schedule automated email reports for YouTube video emotion analysis. Users can receive beautifully formatted emails with emotion statistics at their chosen time (daily, weekly, or monthly).

---

## ✨ Features

- ✅ **Schedule Creation UI** - Beautiful modal with easy form inputs
- ✅ **Multiple Frequencies** - Daily, Weekly (Mondays), Monthly (1st of month)
- ✅ **Custom Time Selection** - Choose any time in 24-hour format
- ✅ **Professional Emails** - HTML emails with charts and statistics
- ✅ **Automated Delivery** - Background scheduler sends emails automatically
- ✅ **Secure Storage** - User authentication and data validation
- ✅ **Easy Setup** - Gmail-ready with App Password support

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Configure Email (2 mins)

**Option A: Gmail (Recommended)**

1. Enable 2FA: [Google Security](https://myaccount.google.com/security)
2. Generate App Password: [App Passwords](https://myaccount.google.com/apppasswords)
3. Add to `.env.local`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

**Option B: Other Providers**
See [SCHEDULED_EMAIL_SETUP.md](SCHEDULED_EMAIL_SETUP.md) for SendGrid, Mailgun, AWS SES

### Step 2: Test Configuration (1 min)

```bash
npm run test-email your-email@example.com
```

If successful, you'll receive a test email! ✅

### Step 3: Start Services (2 mins)

**Terminal 1:**

```bash
npm run dev
```

**Terminal 2:**

```bash
npm run scheduler
```

**Or on Windows:**

```bash
start_scheduler.bat
```

---

## 📖 Usage Guide

### Creating a Schedule

1. **Navigate to Dashboard**
   - Go to any video's dashboard: `/dashboard/[videoId]`

2. **Click "Set Schedule"**
   - Purple button next to "Download PDF Report"

3. **Fill the Form**
   - **Email**: Where to send reports
   - **Frequency**:
     - `Daily` - Every day at chosen time
     - `Weekly` - Every Monday at chosen time
     - `Monthly` - 1st of month at chosen time
   - **Time**: 24-hour format (e.g., `09:00`, `14:30`)

4. **Submit**
   - Click "Create Schedule"
   - Success message appears
   - Schedule is now active!

### Receiving Reports

Emails are sent automatically at your scheduled time containing:

- Video title and ID
- Total comments analyzed
- Color-coded emotion breakdown
- Top emotion statistics
- Link to view full dashboard

---

## 📂 Files Added/Modified

### New Files Created

```
components/
  └── ScheduleModal.jsx              # Schedule creation UI

app/api/schedule/
  ├── create/route.js                # Save/retrieve schedules
  └── send-email/route.js            # Send email reports

lib/
  ├── emailTemplate.js               # Email HTML generator
  └── scheduler.js                   # Background cron service

data/
  ├── .gitkeep                       # Directory marker
  └── schedules.json                 # User schedules (auto-created)

# Scripts & Docs
start_scheduler.bat                  # Windows scheduler starter
test-email-config.js                 # SMTP test utility
SCHEDULED_EMAIL_SETUP.md             # Full documentation
QUICK_START_EMAIL_SCHEDULING.md      # Quick reference
IMPLEMENTATION_SUMMARY.md            # Implementation details
ARCHITECTURE_DIAGRAM.md              # Visual flow diagrams
```

### Modified Files

```
app/dashboard/[videoId]/
  └── DashboardClient.jsx            # Added "Set Schedule" button

.env.example                         # Added SMTP configuration
.gitignore                           # Protected user data
package.json                         # Added dependencies & scripts
```

---

## 🔧 Commands Reference

```bash
# Start development server
npm run dev

# Start email scheduler (required for emails to send)
npm run scheduler

# Test email configuration
npm run test-email your@email.com

# Windows batch script for scheduler
start_scheduler.bat
```

---

## 🎨 UI Components

### Set Schedule Button

- **Location**: Dashboard page, top-right
- **Color**: Purple (`bg-purple-600`)
- **Icon**: Calendar
- **Action**: Opens schedule modal

### Schedule Modal

- **Components**:
  - Email input (validated)
  - Frequency dropdown
  - Time picker
  - Submit/Cancel buttons
- **Validation**: Real-time feedback
- **UX**: Success message, auto-close on success

---

## 📊 Technical Details

### Data Storage

- **Format**: JSON file (`data/schedules.json`)
- **Structure**:
  ```json
  {
    "id": "userId-videoId-timestamp",
    "userId": "google-oauth-id",
    "videoId": "video-id",
    "videoTitle": "Video Title",
    "recipientEmail": "user@example.com",
    "frequency": "daily|weekly|monthly",
    "time": "HH:MM",
    "active": true,
    "createdAt": "ISO-8601-date"
  }
  ```

### Scheduler Logic

- **Technology**: node-cron
- **Frequency**: Checks every minute
- **Matching**: Compares current time with schedule time
- **Execution**: Calls send-email API when match found

### Email Template

- **HTML**: Professional gradient design with charts
- **Text**: Plain text fallback
- **Colors**: Emotion-specific (Joy=Yellow, Sadness=Blue, etc.)
- **Responsive**: Mobile-friendly layout

---

## 🔒 Security Features

- ✅ Session-based authentication (NextAuth)
- ✅ Email format validation
- ✅ Time format validation
- ✅ User-specific schedule filtering
- ✅ SMTP credentials in environment variables
- ✅ User data excluded from git

---

## 🐛 Troubleshooting

### "Email not sending"

**Check SMTP settings:**

```bash
# Verify environment variables
cat .env.local | grep SMTP
```

**Test configuration:**

```bash
npm run test-email your@email.com
```

**Common issues:**

- Wrong App Password (Gmail requires 16-char app password, not account password)
- 2FA not enabled on Gmail
- Firewall blocking SMTP port
- Wrong SMTP host/port

### "Scheduler not running"

**Verify process:**

```bash
# Should see console output
npm run scheduler
```

**Check schedules file:**

```bash
cat data/schedules.json
```

**Common issues:**

- Forgot to start scheduler
- Schedules file doesn't exist (create a schedule first)
- Wrong time format (must be HH:MM)

### "Schedule not triggering"

**Time zone issues:**

- Scheduler uses server's local time
- Adjust schedule time accordingly

**Frequency issues:**

- Weekly only sends on Mondays
- Monthly only sends on 1st of month
- Verify frequency is set correctly

---

## 📚 Documentation

| File                                                               | Purpose                               |
| ------------------------------------------------------------------ | ------------------------------------- |
| [QUICK_START_EMAIL_SCHEDULING.md](QUICK_START_EMAIL_SCHEDULING.md) | Quick setup guide (3 steps)           |
| [SCHEDULED_EMAIL_SETUP.md](SCHEDULED_EMAIL_SETUP.md)               | Complete documentation (50+ sections) |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)             | Implementation details for developers |
| [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)                 | Visual flow diagrams                  |
| This file                                                          | Quick reference for everyday use      |

---

## 🎯 Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start scheduler as service
pm2 start lib/scheduler.js --name "email-scheduler"

# Auto-start on reboot
pm2 startup
pm2 save

# View logs
pm2 logs email-scheduler
```

### Using Docker

Add to `Dockerfile`:

```dockerfile
CMD ["sh", "-c", "npm start & node lib/scheduler.js"]
```

### Environment Variables

Ensure these are set in production:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
NEXTAUTH_URL=https://your-domain.com
```

---

## 💡 Tips & Best Practices

1. **Test First**: Always run `npm run test-email` before production
2. **Monitor Logs**: Check scheduler console output regularly
3. **Rate Limits**: Be aware of SMTP provider sending limits
4. **Timezone**: Document server timezone for users
5. **Backup**: Consider backing up `schedules.json` regularly
6. **Database**: For production, migrate to PostgreSQL/MongoDB

---

## 🔮 Future Enhancements

Potential improvements:

- [ ] Schedule management UI (edit/delete)
- [ ] Email delivery tracking
- [ ] Multiple recipients per schedule
- [ ] Custom email templates
- [ ] Timezone selection
- [ ] Webhook integration
- [ ] Slack/Discord notifications

---

## 📞 Support

**Common Issues:**

1. Check documentation links above
2. Run `npm run test-email` to verify SMTP
3. Check console logs for errors
4. Verify environment variables are set

**For Gmail Issues:**

- Must use App Password, not account password
- Requires 2FA enabled
- Generate at: https://myaccount.google.com/apppasswords

---

## 🎉 You're Ready!

1. ✅ Configure SMTP in `.env.local`
2. ✅ Test with `npm run test-email`
3. ✅ Start dev server (`npm run dev`)
4. ✅ Start scheduler (`npm run scheduler`)
5. ✅ Create schedule from dashboard
6. ✅ Receive automated reports!

---

**Questions?** See [SCHEDULED_EMAIL_SETUP.md](SCHEDULED_EMAIL_SETUP.md) for detailed help.

**Last Updated**: January 31, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
