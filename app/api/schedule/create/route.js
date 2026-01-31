import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import fs from "fs/promises";
import path from "path";
import { getRedis } from "@/lib/redis";

/**
 * API Route: Create Email Schedule
 * POST /api/schedule/create
 * Saves a schedule for sending email reports at specified intervals
 */
export async function POST(request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      videoId,
      videoTitle,
      email,
      frequency,
      time,
      timeZone,
      timezoneOffsetMinutes,
    } = body;

    // Validate input
    if (!videoId || !email || !frequency || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Time validation (HH:MM format)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM (24-hour)" },
        { status: 400 },
      );
    }

    if (!session?.refreshToken) {
      return NextResponse.json(
        {
          error: "Missing refresh token",
          message: "Please sign out and sign in again to grant offline access.",
        },
        { status: 400 },
      );
    }

    // Prepare schedule data
    const schedule = {
      id: `${session.userId}-${videoId}-${Date.now()}`,
      userId: session.userId,
      userEmail: session.user?.email,
      videoId,
      videoTitle: videoTitle || "Unknown Video",
      recipientEmail: email,
      frequency, // daily, weekly, monthly
      time, // HH:MM format
      refreshToken: session.refreshToken,
      timeZone: timeZone || null,
      timezoneOffsetMinutes:
        typeof timezoneOffsetMinutes === "number"
          ? timezoneOffsetMinutes
          : null,
      createdAt: new Date().toISOString(),
      active: true,
    };

    const scheduleKey = `${videoId}|${email}|${frequency}|${time}`;
    const redis = getRedis();

    if (redis) {
      const scheduleKeyHash = `schedulekey:${session.userId}`;
      const existingId = await redis.hget(scheduleKeyHash, scheduleKey);

      if (existingId) {
        const existingRaw = await redis.get(`schedule:${existingId}`);
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        const updated = {
          ...existing,
          ...schedule,
          id: existingId,
          scheduleKey,
          updatedAt: new Date().toISOString(),
        };

        await redis.set(`schedule:${existingId}`, JSON.stringify(updated));
        await redis.sadd(`schedules:user:${session.userId}`, existingId);
        await redis.sadd("schedules:all", existingId);

        return NextResponse.json({
          success: true,
          schedule: {
            id: existingId,
            videoId: schedule.videoId,
            frequency: schedule.frequency,
            time: schedule.time,
          },
        });
      }

      const scheduleId = schedule.id;
      const record = { ...schedule, scheduleKey };

      await redis.set(`schedule:${scheduleId}`, JSON.stringify(record));
      await redis.sadd("schedules:all", scheduleId);
      await redis.sadd(`schedules:user:${session.userId}`, scheduleId);
      await redis.hset(scheduleKeyHash, scheduleKey, scheduleId);

      return NextResponse.json({
        success: true,
        schedule: {
          id: scheduleId,
          videoId: schedule.videoId,
          frequency: schedule.frequency,
          time: schedule.time,
        },
      });
    }

    // Store in file system (simple JSON storage)
    const schedulesRoot = path.join(process.cwd(), "data", "schedules");
    const schedulesFile = path.join(schedulesRoot, `${session.userId}.json`);

    // Create data directory if it doesn't exist
    try {
      await fs.mkdir(schedulesRoot, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore
    }

    // Read existing schedules
    let schedules = [];
    try {
      const data = await fs.readFile(schedulesFile, "utf-8");
      schedules = JSON.parse(data);
    } catch (err) {
      // File doesn't exist yet, start with empty array
      schedules = [];
    }

    const existingIndex = schedules.findIndex(
      (item) => item.scheduleKey === scheduleKey && item.active,
    );

    if (existingIndex >= 0) {
      schedules[existingIndex] = {
        ...schedules[existingIndex],
        videoTitle: schedule.videoTitle,
        refreshToken: schedule.refreshToken,
        timeZone: schedule.timeZone,
        timezoneOffsetMinutes: schedule.timezoneOffsetMinutes,
        updatedAt: new Date().toISOString(),
      };
    } else {
      schedules.push({
        ...schedule,
        scheduleKey,
      });
    }

    // Save back to file
    await fs.writeFile(schedulesFile, JSON.stringify(schedules, null, 2));

    // Cleanup legacy shared schedules file to avoid cross-user clashes
    const legacyFile = path.join(process.cwd(), "data", "schedules.json");
    try {
      const legacyData = await fs.readFile(legacyFile, "utf-8");
      const legacySchedules = JSON.parse(legacyData);
      const filteredLegacy = legacySchedules.filter(
        (item) => item.userId !== session.userId,
      );
      if (filteredLegacy.length !== legacySchedules.length) {
        await fs.writeFile(legacyFile, JSON.stringify(filteredLegacy, null, 2));
      }
    } catch (err) {
      // Ignore if legacy file doesn't exist or is invalid
    }

    return NextResponse.json({
      success: true,
      schedule: {
        id: schedule.id,
        videoId: schedule.videoId,
        frequency: schedule.frequency,
        time: schedule.time,
      },
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule", details: error.message },
      { status: 500 },
    );
  }
}

/**
 * API Route: Get User Schedules
 * GET /api/schedule/create
 * Returns all schedules for the authenticated user
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redis = getRedis();
    if (redis) {
      const ids = await redis.smembers(`schedules:user:${session.userId}`);
      if (!ids || ids.length === 0) {
        return NextResponse.json({ schedules: [] });
      }

      const schedules = [];
      for (const id of ids) {
        const raw = await redis.get(`schedule:${id}`);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed?.active) {
          schedules.push(parsed);
        }
      }

      return NextResponse.json({ schedules });
    }

    const schedulesFile = path.join(
      process.cwd(),
      "data",
      "schedules",
      `${session.userId}.json`,
    );

    try {
      const data = await fs.readFile(schedulesFile, "utf-8");
      const allSchedules = JSON.parse(data);

      // Filter schedules for this user
      const userSchedules = allSchedules.filter((s) => s.active);

      return NextResponse.json({ schedules: userSchedules });
    } catch (err) {
      // No schedules file exists yet
      return NextResponse.json({ schedules: [] });
    }
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}
