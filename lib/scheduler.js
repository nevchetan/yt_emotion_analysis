/**
 * Email Scheduler Service
 * Runs as a background process to check and execute scheduled email reports
 *
 * Usage:
 *   node lib/scheduler.js
 *
 * For production, use PM2 or similar process manager:
 *   pm2 start lib/scheduler.js --name "email-scheduler"
 */

const cron = require("node-cron");
const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");

const SCHEDULES_DIR = path.join(__dirname, "..", "data", "schedules");
const LEGACY_SCHEDULES_FILE = path.join(
  __dirname,
  "..",
  "data",
  "schedules.json",
);
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
let isSchedulerRunning = false;

function buildScheduleKey(schedule) {
  return `${schedule.videoId}|${schedule.recipientEmail}|${schedule.frequency}|${schedule.time}`;
}

function getTimeParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  const hour = Number(lookup.hour);
  const minute = Number(lookup.minute);
  const day = Number(lookup.day);
  const month = Number(lookup.month);
  const year = Number(lookup.year);

  const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone || undefined,
    weekday: "short",
  });

  const weekday = weekdayFormatter.format(date);

  return { hour, minute, day, dateKey, weekday };
}

function parseScheduleTime(time) {
  if (!time || typeof time !== "string") return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { hour: h, minute: m };
}

/**
 * Load all active schedules from file
 */
async function readSchedulesFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const schedules = JSON.parse(data);
    return Array.isArray(schedules) ? schedules : [];
  } catch (err) {
    return [];
  }
}

async function migrateLegacySchedules() {
  const legacySchedules = await readSchedulesFile(LEGACY_SCHEDULES_FILE);
  if (legacySchedules.length === 0) return;

  const grouped = legacySchedules.reduce((acc, schedule) => {
    if (!schedule?.userId) return acc;
    if (!acc.has(schedule.userId)) {
      acc.set(schedule.userId, []);
    }
    acc.get(schedule.userId).push({
      ...schedule,
      scheduleKey: schedule.scheduleKey || buildScheduleKey(schedule),
    });
    return acc;
  }, new Map());

  await fs.mkdir(SCHEDULES_DIR, { recursive: true });

  for (const [userId, schedules] of grouped.entries()) {
    const filePath = path.join(SCHEDULES_DIR, `${userId}.json`);
    const existingSchedules = await readSchedulesFile(filePath);
    const existingKeys = new Set(
      existingSchedules.map(
        (item) => item.scheduleKey || buildScheduleKey(item),
      ),
    );

    const merged = [...existingSchedules];
    for (const schedule of schedules) {
      const key = schedule.scheduleKey || buildScheduleKey(schedule);
      if (!existingKeys.has(key)) {
        merged.push({ ...schedule, scheduleKey: key });
        existingKeys.add(key);
      }
    }

    await saveSchedules(filePath, merged);
  }

  await saveSchedules(LEGACY_SCHEDULES_FILE, []);
  console.log("✅ Migrated legacy schedules into per-user files.");
}

async function loadSchedulesByFile() {
  const schedulesByFile = new Map();

  await migrateLegacySchedules();

  try {
    await fs.mkdir(SCHEDULES_DIR, { recursive: true });
    const files = await fs.readdir(SCHEDULES_DIR);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(SCHEDULES_DIR, file);
      const schedules = await readSchedulesFile(filePath);
      schedulesByFile.set(
        filePath,
        schedules.filter((s) => s.active === true),
      );
    }
  } catch (err) {
    console.log("No schedules directory found or error reading:", err.message);
  }

  return schedulesByFile;
}

/**
 * Check if it's time to send a scheduled email
 */
function shouldSendNow(schedule) {
  const now = new Date();
  const scheduleTime = parseScheduleTime(schedule.time);

  if (!scheduleTime) return false;

  const nowParts = getTimeParts(now, schedule.timeZone);
  const nowTotal = nowParts.hour * 60 + nowParts.minute;
  const scheduleTotal = scheduleTime.hour * 60 + scheduleTime.minute;

  // Allow a 1-minute tolerance window to avoid missing due to timing drift
  if (Math.abs(nowTotal - scheduleTotal) > 1) {
    return false;
  }

  if (schedule.lastSentAt) {
    const lastSentParts = getTimeParts(
      new Date(schedule.lastSentAt),
      schedule.timeZone,
    );
    if (lastSentParts.dateKey === nowParts.dateKey) {
      return false;
    }
  }

  switch (schedule.frequency) {
    case "daily":
      return true;
    case "weekly":
      return nowParts.weekday === "Mon";
    case "monthly":
      return nowParts.day === 1;
    default:
      return false;
  }
}

async function saveSchedules(filePath, schedules) {
  await fs.writeFile(filePath, JSON.stringify(schedules, null, 2));
}

/**
 * Send email for a specific schedule
 */
async function sendScheduledEmail(schedule) {
  try {
    console.log(`📧 Sending email for schedule: ${schedule.id}`);
    console.log(`   Video: ${schedule.videoTitle}`);
    console.log(`   To: ${schedule.recipientEmail}`);

    if (!schedule.refreshToken) {
      console.error(
        `❌ Missing refresh token for schedule ${schedule.id}. Please recreate the schedule after re-authentication.`,
      );
      return;
    }

    const response = await axios.post(
      `${BASE_URL}/api/schedule/send-email`,
      {
        videoId: schedule.videoId,
        videoTitle: schedule.videoTitle,
        recipientEmail: schedule.recipientEmail,
        refreshToken: schedule.refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.success) {
      console.log(`✅ Email sent successfully to ${schedule.recipientEmail}`);
      return true;
    } else {
      console.error(`❌ Failed to send email:`, response.data);
    }
  } catch (error) {
    console.error(
      `❌ Error sending email for schedule ${schedule.id}:`,
      error.response?.data || error.message,
    );
  }

  return false;
}

/**
 * Main scheduler function - runs every minute
 */
async function checkSchedules() {
  if (isSchedulerRunning) {
    console.log("⏳ Previous check still running, skipping this tick.");
    return;
  }

  isSchedulerRunning = true;

  const schedulesByFile = await loadSchedulesByFile();
  const allSchedules = Array.from(schedulesByFile.values()).flat();

  if (allSchedules.length === 0) {
    console.log("⏰ No active schedules found");
    isSchedulerRunning = false;
    return;
  }

  console.log(`⏰ Checking ${allSchedules.length} active schedule(s)...`);

  try {
    for (const [filePath, schedules] of schedulesByFile.entries()) {
      let updated = false;

      for (let index = 0; index < schedules.length; index += 1) {
        const schedule = schedules[index];
        if (shouldSendNow(schedule)) {
          const sent = await sendScheduledEmail(schedule);
          if (sent) {
            schedules[index] = {
              ...schedule,
              lastSentAt: new Date().toISOString(),
            };
            updated = true;
          }
        }
      }

      if (updated) {
        await saveSchedules(filePath, schedules);
      }
    }
  } finally {
    isSchedulerRunning = false;
  }
}

/**
 * Start the cron job
 * Runs every minute: "* * * * *"
 */
function startScheduler() {
  console.log("🚀 Email Scheduler started");
  console.log(`📁 Schedules dir: ${SCHEDULES_DIR}`);
  console.log(`🌐 API Base URL: ${BASE_URL}`);
  console.log("⏰ Checking for scheduled emails every minute...\n");

  // Run immediately on start
  checkSchedules();

  // Then run every minute
  cron.schedule("* * * * *", () => {
    const now = new Date().toLocaleString();
    console.log(`\n[${now}] Running scheduled check...`);
    checkSchedules();
  });
}

// Start the scheduler
startScheduler();

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Scheduler shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Scheduler shutting down gracefully...");
  process.exit(0);
});
