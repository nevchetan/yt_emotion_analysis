import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateEmailHTML, generateEmailText } from "@/lib/emailTemplate";
import { analyzeEmotionsBatch } from "@/lib/hf";

const YOUTUBE_API_BASE = "https://youtube.googleapis.com/youtube/v3";
const PAGE_SIZE = 100;
const CONCURRENCY = 3;
const MAX_COMMENTS = Number.parseInt(
  process.env.SCHEDULE_MAX_COMMENTS || "200",
  10,
);

function extractCommentText(snippet) {
  return snippet?.textOriginal || snippet?.textDisplay || "";
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth client credentials");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token || null;
}

/**
 * API Route: Send Email Report
 * POST /api/schedule/send-email
 * Sends an emotion analysis report via email
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { videoId, videoTitle, recipientEmail, accessToken, refreshToken } =
      body;

    // Validate input
    if (!videoId || !recipientEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const effectiveAccessToken =
      accessToken || (await refreshAccessToken(refreshToken));

    if (!effectiveAccessToken) {
      return NextResponse.json(
        {
          error: "Missing access token",
          message:
            "Re-authenticate to grant offline access and create a new schedule.",
        },
        { status: 401 },
      );
    }

    // Fetch video title (if not provided) and comments from YouTube API
    let resolvedVideoTitle = videoTitle || "";
    let comments = [];

    const videoUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    videoUrl.searchParams.set("part", "snippet");
    videoUrl.searchParams.set("id", videoId);

    const videoResponse = await fetch(videoUrl.toString(), {
      headers: { Authorization: `Bearer ${effectiveAccessToken}` },
    });

    if (videoResponse.ok) {
      const videoData = await videoResponse.json();
      resolvedVideoTitle =
        resolvedVideoTitle || videoData.items?.[0]?.snippet?.title || "";
    }

    const allComments = [];
    let nextPageToken = null;

    do {
      const commentsUrl = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
      commentsUrl.searchParams.set("part", "snippet");
      commentsUrl.searchParams.set("videoId", videoId);
      commentsUrl.searchParams.set("maxResults", String(PAGE_SIZE));
      commentsUrl.searchParams.set("textFormat", "plainText");
      commentsUrl.searchParams.set("order", "time");
      if (nextPageToken) {
        commentsUrl.searchParams.set("pageToken", nextPageToken);
      }

      const commentsResponse = await fetch(commentsUrl.toString(), {
        headers: { Authorization: `Bearer ${effectiveAccessToken}` },
      });

      if (!commentsResponse.ok) {
        const errorText = await commentsResponse.text();
        return NextResponse.json(
          {
            error: "YouTube API Error",
            status: commentsResponse.status,
            message: `Failed to fetch comments: ${commentsResponse.statusText}`,
            details: errorText,
          },
          { status: commentsResponse.status },
        );
      }

      const commentsData = await commentsResponse.json();
      const batchComments = (commentsData.items || []).map((item) => {
        const snippet = item.snippet?.topLevelComment?.snippet;
        return {
          author: snippet?.authorDisplayName || "Unknown",
          text: extractCommentText(snippet),
        };
      });

      allComments.push(...batchComments);
      nextPageToken = commentsData.nextPageToken || null;
    } while (nextPageToken && allComments.length < MAX_COMMENTS);

    const paginatedComments = allComments.slice(0, MAX_COMMENTS);

    if (paginatedComments.length === 0) {
      return NextResponse.json(
        {
          error: "No comments found",
          message: "No comments available to analyze for this video.",
        },
        { status: 200 },
      );
    }

    const commentTexts = paginatedComments.map((c) => c.text);
    let emotionResults = [];

    try {
      emotionResults = await analyzeEmotionsBatch(commentTexts, CONCURRENCY);
    } catch (analysisError) {
      return NextResponse.json(
        {
          error: "Emotion Analysis Failed",
          message:
            "Could not analyze comment emotions. Ensure the local Python server is running or HUGGINGFACE_API_KEY is set.",
          details: analysisError.message,
        },
        { status: 500 },
      );
    }

    const commentsWithEmotions = paginatedComments.map((comment, index) => ({
      ...comment,
      emotion: emotionResults[index]?.label || "neutral",
      emotionScore: emotionResults[index]?.score || 0,
      isML: true,
    }));

    comments = commentsWithEmotions;

    // Calculate emotion statistics
    function getEmotionCounts(data) {
      const counts = {};
      data.forEach((c) => {
        const emotion = c.emotion || "neutral";
        counts[emotion] = (counts[emotion] || 0) + 1;
      });
      return counts;
    }

    function getEmotionStats(data) {
      const counts = getEmotionCounts(data);
      const total = data.length;
      const stats = Object.entries(counts).map(([emotion, count]) => ({
        emotion,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0,
      }));
      return stats.sort((a, b) => b.count - a.count);
    }

    const emotionStats = getEmotionStats(comments);
    const topEmotion = emotionStats[0];

    // Prepare report data
    const reportData = {
      videoTitle: resolvedVideoTitle || "Unknown Video",
      videoId,
      totalComments: comments.length,
      analyzedCount: comments.length,
      emotionStats,
      topEmotion,
      dashboardUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/${videoId}`,
    };

    // Generate email content
    const htmlContent = generateEmailHTML(reportData);
    const textContent = generateEmailText(reportData);

    // Configure email transporter
    // For production, use a proper SMTP service (Gmail, SendGrid, etc.)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    const mailOptions = {
      from: `"YouTube Emotion Analysis" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `📊 Emotion Analysis Report: ${videoTitle || videoId}`,
      text: textContent,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      sentTo: recipientEmail,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
