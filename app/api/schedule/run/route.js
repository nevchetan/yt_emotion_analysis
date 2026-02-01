import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

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

function shouldSendNow(schedule) {
  const now = new Date();

  // Vercel Cron free tier doesn't support specific times
  // Only check if schedule matches the frequency pattern
  // Cron runs at: daily (0 0 * * *), weekly (0 0 * * 0), monthly (0 0 1 * *)

  if (schedule.lastSentAt) {
    const lastSentDate = new Date(schedule.lastSentAt);
    const nowDate = new Date(now.toISOString().split("T")[0]);
    const lastSentDateOnly = new Date(lastSentDate.toISOString().split("T")[0]);

    // Don't send twice on same day
    if (nowDate.getTime() === lastSentDateOnly.getTime()) {
      return false;
    }
  }

  // Use UTC for date/day calculations
  const dayOfMonth = now.getUTCDate();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday

  switch (schedule.frequency) {
    case "daily":
      return true; // Send every day
    case "weekly":
      return dayOfWeek === 0; // Send on Sundays (when Vercel cron runs)
    case "monthly":
      return dayOfMonth === 1; // Send on 1st of month (when Vercel cron runs)
    default:
      return false;
  }
}

async function sendEmail(schedule) {
  const response = await fetch(`${BASE_URL}/api/schedule/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoId: schedule.videoId,
      videoTitle: schedule.videoTitle,
      recipientEmail: schedule.recipientEmail,
      refreshToken: schedule.refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || "Failed to send email");
  }

  return true;
}

export async function GET(request) {
  return handleScheduleRun(request);
}

export async function POST(request) {
  return handleScheduleRun(request);
}

async function handleScheduleRun(request) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Redis is not configured" },
      { status: 500 },
    );
  }

  const cronHeader = request.headers.get("x-vercel-cron");
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Require either Vercel CRON header OR valid Bearer token (not both optional)
  const isVercelCron = !!cronHeader;
  const hasValidAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasValidAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lockKey = "schedule:lock";
  const lockAcquired = await redis.set(lockKey, Date.now(), {
    nx: true,
    ex: 55,
  });

  if (!lockAcquired) {
    return NextResponse.json({ skipped: true });
  }

  const ids = await redis.smembers("schedules:all");
  if (!ids || ids.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  let sent = 0;

  for (const id of ids) {
    const data = await redis.get(`schedule:${id}`);
    if (!data) continue;

    // Upstash Redis already parses JSON automatically
    const schedule = typeof data === "string" ? JSON.parse(data) : data;
    if (!schedule?.active) continue;

    processed += 1;
    console.log(
      `Checking schedule ${id}: time=${schedule.time}, freq=${schedule.frequency}`,
    );

    if (shouldSendNow(schedule)) {
      console.log(`✅ Sending email for schedule ${id}`);
      try {
        await sendEmail(schedule);
        schedule.lastSentAt = new Date().toISOString();
        schedule.lastError = null;
        await redis.set(`schedule:${id}`, JSON.stringify(schedule));
        sent += 1;
        console.log(`Email sent for ${id}`);
      } catch (error) {
        console.error(`Error sending email for ${id}:`, error.message);
        schedule.lastError = error.message;
        schedule.lastAttemptAt = new Date().toISOString();
        await redis.set(`schedule:${id}`, JSON.stringify(schedule));
      }
    } else {
      console.log(`⏭️ Skipping schedule ${id}`);
    }
  }

  return NextResponse.json({ processed, sent });
}
