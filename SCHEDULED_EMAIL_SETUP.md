# Scheduled Email Reporting Setup Guide

## Overview

This feature allows users to schedule automated email reports for their YouTube video emotion analysis. Reports can be sent daily, weekly, or monthly at a specified time.

## Features Added

### 1. **Schedule Modal Component** (`components/ScheduleModal.jsx`)

- User-friendly modal for setting up email schedules
- Allows selection of:
  - Email address
  - Frequency (Daily, Weekly, Monthly)
  - Time of day (24-hour format)

### 2. **API Routes**

#### Create Schedule (`/api/schedule/create`)

- **POST**: Save a new email schedule
- **GET**: Retrieve all active schedules for the logged-in user
- Stores schedules in `data/schedules.json`

#### Send Email (`/api/schedule/send-email`)

- Sends beautifully formatted HTML email reports
- Includes:
  - Video title and ID
  - Total comments and analyzed count
  - Emotion breakdown with visual bars
  - Top emotion statistics
  - Link to view full dashboard

### 3. **Email Scheduler** (`lib/scheduler.js`)

- Background process that runs continuously
- Checks every minute for scheduled tasks
- Automatically sends emails at the configured time

### 4. **UI Updates**

- "Set Schedule" button added to dashboard next to "Download PDF Report"
- Purple button for easy visibility
- Opens modal for scheduling configuration

## Setup Instructions

### Step 1: Configure Email SMTP Settings

Add these environment variables to your `.env.local` file:

```env
# Email Configuration (Required for scheduled emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Application URL (Required)
NEXTAUTH_URL=http://localhost:3000
```

### Step 2: Gmail Setup (Recommended for Easy Setup)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification
   - App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
3. **Update .env.local**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # 16-char app password
   ```

### Alternative Email Services

#### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

#### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### Step 3: Start the Application

```bash
# Terminal 1: Start Next.js development server
npm run dev

# Terminal 2: Start email scheduler
npm run scheduler
```

Or use the batch file (Windows):

```bash
start_scheduler.bat
```

## Usage Guide

### For Users

1. **Navigate to Dashboard**:
   - Go to any video's dashboard page
   - URL: `/dashboard/[videoId]`

2. **Set Schedule**:
   - Click "Set Schedule" button (purple button)
   - Enter your email address
   - Select frequency:
     - **Daily**: Sends every day at specified time
     - **Weekly**: Sends every Monday at specified time
     - **Monthly**: Sends on 1st of month at specified time
   - Choose time (24-hour format, e.g., 09:00 for 9 AM)
   - Click "Create Schedule"

3. **Receive Reports**:
   - Email will be sent automatically at scheduled time
   - Contains full emotion analysis with charts
   - Includes link to view full dashboard

### For Administrators

#### View All Schedules

```javascript
// API: GET /api/schedule/create
// Returns all active schedules for logged-in user
```

#### Manually Trigger Email

```javascript
// API: POST /api/schedule/send-email
// Body: { videoId, videoTitle, recipientEmail }
```

#### Monitor Scheduler

The scheduler logs output to console:

```
🚀 Email Scheduler started
📁 Schedules file: /path/to/data/schedules.json
🌐 API Base URL: http://localhost:3000
⏰ Checking for scheduled emails every minute...

[1/31/2026, 9:00:00 AM] Running scheduled check...
📧 Sending email for schedule: user-videoId-timestamp
   Video: My Amazing Video
   To: user@example.com
✅ Email sent successfully to user@example.com
```

## File Structure

```
emotion_analysis_project-main/
├── app/
│   └── api/
│       └── schedule/
│           ├── create/
│           │   └── route.js          # Save/retrieve schedules
│           └── send-email/
│               └── route.js          # Send email reports
├── components/
│   └── ScheduleModal.jsx             # Schedule setup UI
├── lib/
│   ├── emailTemplate.js              # Email HTML/text generators
│   └── scheduler.js                  # Cron job scheduler
├── data/
│   └── schedules.json                # Stored schedules (auto-created)
├── start_scheduler.bat               # Windows batch script
└── SCHEDULED_EMAIL_SETUP.md          # This file
```

## Data Format

### Schedule Object

```json
{
  "id": "userId-videoId-timestamp",
  "userId": "user-google-id",
  "userEmail": "creator@example.com",
  "videoId": "dQw4w9WgXcQ",
  "videoTitle": "My Video Title",
  "recipientEmail": "recipient@example.com",
  "frequency": "daily",
  "time": "09:00",
  "createdAt": "2026-01-31T08:00:00.000Z",
  "active": true
}
```

## Email Features

### HTML Email Includes:

- ✅ Professional gradient header
- ✅ Video title and ID
- ✅ Summary statistics cards
- ✅ Color-coded emotion breakdown bars
- ✅ Top emotion highlight
- ✅ Call-to-action button to dashboard
- ✅ Responsive design (mobile-friendly)

### Plain Text Email:

- Same information in text format for email clients that don't support HTML

## Production Deployment

### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start scheduler as background service
pm2 start lib/scheduler.js --name "email-scheduler"

# View logs
pm2 logs email-scheduler

# Stop scheduler
pm2 stop email-scheduler

# Restart scheduler
pm2 restart email-scheduler

# Auto-start on system reboot
pm2 startup
pm2 save
```

### Using Docker

Add to your Dockerfile:

```dockerfile
# Start both Next.js and scheduler
CMD ["sh", "-c", "npm start & node lib/scheduler.js"]
```

### Using systemd (Linux)

Create `/etc/systemd/system/email-scheduler.service`:

```ini
[Unit]
Description=Email Scheduler Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/project
ExecStart=/usr/bin/node lib/scheduler.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable email-scheduler
sudo systemctl start email-scheduler
sudo systemctl status email-scheduler
```

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials**:

   ```bash
   # Verify environment variables are set
   echo $SMTP_USER
   echo $SMTP_HOST
   ```

2. **Test email configuration**:
   - Try sending a test email via Postman to `/api/schedule/send-email`

3. **Check Gmail security**:
   - Ensure 2FA is enabled
   - Use App Password, not regular password
   - Check "Less secure apps" is not blocking

4. **Check scheduler is running**:
   ```bash
   # Should see scheduler process
   npm run scheduler
   ```

### Scheduler Not Running

1. **Verify schedules file exists**:

   ```bash
   # Check if data/schedules.json exists
   cat data/schedules.json
   ```

2. **Check time format**:
   - Must be HH:MM (24-hour)
   - Example: "09:00", "14:30", "23:45"

3. **Verify BASE_URL**:
   - Must match NEXTAUTH_URL
   - Check console output when scheduler starts

### Schedule Not Triggering

1. **Verify time zone**:
   - Scheduler uses server's local time
   - Adjust time in schedule accordingly

2. **Check frequency logic**:
   - Weekly: Only sends on Mondays
   - Monthly: Only sends on 1st of month

3. **Monitor logs**:
   - Scheduler logs every minute
   - Shows which schedules it's checking

## Security Considerations

1. **SMTP Credentials**: Never commit `.env.local` to git
2. **Rate Limiting**: Consider adding rate limits to prevent abuse
3. **Email Validation**: API validates email format before saving
4. **User Authentication**: Only authenticated users can create schedules
5. **Data Storage**: Schedules stored locally; consider database for production

## Future Enhancements

Potential improvements:

- [ ] Database storage (MongoDB, PostgreSQL)
- [ ] Schedule management UI (edit/delete schedules)
- [ ] Email delivery status tracking
- [ ] Custom email templates
- [ ] Multiple recipients per schedule
- [ ] Timezone selection
- [ ] Email preview before scheduling
- [ ] Webhook integration
- [ ] Slack/Discord notification support

## Support

For issues or questions:

1. Check console logs for errors
2. Verify all environment variables are set
3. Test email service with manual API call
4. Check that scheduler process is running

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
