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
  const scheduleTime = parseScheduleTime(schedule.time);

  if (!scheduleTime) return false;

  const nowParts = getTimeParts(now, schedule.timeZone);
  const nowTotal = nowParts.hour * 60 + nowParts.minute;
  const scheduleTotal = scheduleTime.hour * 60 + scheduleTime.minute;

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

  if (!cronHeader && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
    const raw = await redis.get(`schedule:${id}`);
    if (!raw) continue;

    const schedule = JSON.parse(raw);
    if (!schedule?.active) continue;

    processed += 1;

    if (shouldSendNow(schedule)) {
      try {
        await sendEmail(schedule);
        schedule.lastSentAt = new Date().toISOString();
        schedule.lastError = null;
        await redis.set(`schedule:${id}`, JSON.stringify(schedule));
        sent += 1;
      } catch (error) {
        schedule.lastError = error.message;
        schedule.lastAttemptAt = new Date().toISOString();
        await redis.set(`schedule:${id}`, JSON.stringify(schedule));
      }
    }
  }

  return NextResponse.json({ processed, sent });
}
