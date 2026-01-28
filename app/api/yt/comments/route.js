/**
 * YouTube Comments API Endpoint
 * GET /api/yt/comments?videoId={videoId}
 *
 * Fetches comments for a video and analyzes emotions
 * Returns paginated results with emotion data
 *
 * Response:
 * {
 *   comments: Array<{author, text, emotion, emotionScore, isML}>,
 *   total: number (total comments available),
 *   analyzed: number (comments analyzed),
 *   hasMore: boolean (pagination flag)
 * }
 */

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { analyzeEmotionsBatch } from "@/lib/hf";

const YOUTUBE_API_BASE = "https://youtube.googleapis.com/youtube/v3";
const PAGE_SIZE = 20; // Comments to analyze per request
const CACHE_MAX_AGE = 300; // 5 minutes client cache
const CONCURRENCY = 3; // Parallel emotion analysis requests (increased from 2)

/**
 * Helper: Extract comment text from YouTube API response
 */
function extractCommentText(snippet) {
  // Prefer textOriginal to preserve emojis and formatting
  return snippet?.textOriginal || snippet?.textDisplay || "";
}

/**
 * GET handler: Fetch and analyze comments
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  // Validate input
  if (!videoId) {
    return new Response(
      JSON.stringify({
        error: "Missing videoId",
        message: "videoId query parameter is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Authenticate user
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Please sign in to access YouTube data",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Fetch video details (title, etc.) for metadata
    const videoUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    videoUrl.searchParams.set("part", "snippet");
    videoUrl.searchParams.set("id", videoId);

    const videoResponse = await fetch(videoUrl.toString(), {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    let videoTitle = "";
    if (videoResponse.ok) {
      const videoData = await videoResponse.json();
      videoTitle = videoData.items?.[0]?.snippet?.title || "";
    }

    // Fetch comments from YouTube API
    const commentsUrl = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
    commentsUrl.searchParams.set("part", "snippet");
    commentsUrl.searchParams.set("videoId", videoId);
    commentsUrl.searchParams.set("maxResults", "100");
    commentsUrl.searchParams.set("textFormat", "plainText");

    const commentsResponse = await fetch(commentsUrl.toString(), {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    if (!commentsResponse.ok) {
      const errorData = await commentsResponse.text();
      return new Response(
        JSON.stringify({
          error: "YouTube API Error",
          status: commentsResponse.status,
          message: `Failed to fetch comments: ${commentsResponse.statusText}`,
        }),
        {
          status: commentsResponse.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const commentsData = await commentsResponse.json();

    // Parse comments from response
    const allComments = (commentsData.items || []).map((item) => {
      const snippet = item.snippet?.topLevelComment?.snippet;
      return {
        author: snippet?.authorDisplayName || "Unknown",
        text: extractCommentText(snippet),
      };
    });

    // Paginate: only analyze first batch
    const paginatedComments = allComments.slice(0, PAGE_SIZE);

    if (paginatedComments.length === 0) {
      return new Response(
        JSON.stringify({
          comments: [],
          total: 0,
          analyzed: 0,
          hasMore: false,
          videoTitle: videoTitle,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `private, max-age=${CACHE_MAX_AGE}`,
          },
        },
      );
    }

    // Analyze emotions with optimized concurrency
    const commentTexts = paginatedComments.map((c) => c.text);
    let emotionResults = [];

    try {
      emotionResults = await analyzeEmotionsBatch(commentTexts, CONCURRENCY);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Emotion Analysis Failed",
          message:
            "Could not analyze comment emotions. Ensure the local Python server is running or HUGGINGFACE_API_KEY is set.",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Combine comments with emotion data
    const commentsWithEmotions = paginatedComments.map((comment, index) => ({
      ...comment,
      emotion: emotionResults[index]?.label || "neutral",
      emotionScore: emotionResults[index]?.score || 0,
      isML: true,
    }));

    // Return paginated response
    return new Response(
      JSON.stringify({
        comments: commentsWithEmotions,
        total: allComments.length,
        analyzed: paginatedComments.length,
        hasMore: allComments.length > PAGE_SIZE,
        videoTitle: videoTitle,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `private, max-age=${CACHE_MAX_AGE}`,
        },
      },
    );
  } catch (error) {
    console.error("Comments API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
