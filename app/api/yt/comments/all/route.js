/**
 * YouTube Comments Paginated Analysis Endpoint
 * GET /api/yt/comments/all?videoId={videoId}&offset={offset}&limit={limit}
 *
 * Fetches and analyzes comments with pagination support
 * Analyzes a specific batch of comments based on offset/limit
 *
 * Query Parameters:
 * - videoId: YouTube video ID (required)
 * - offset: Starting index for pagination (default: 0)
 * - limit: Number of comments to analyze (default: 20, max: 50)
 *
 * Response:
 * {
 *   comments: Array<{author, text, emotion, emotionScore, isML}>,
 *   total: number (total comments available from YouTube),
 *   analyzed: number (comments analyzed in this batch),
 *   offset: number (current offset),
 *   hasMore: boolean (more comments available)
 * }
 */

import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { analyzeEmotionsBatch } from "@/lib/hf";

const YOUTUBE_API_BASE = "https://youtube.googleapis.com/youtube/v3";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const CONCURRENCY = 4; // Parallel emotion analysis requests
const CACHE_MAX_AGE = 300; // 5 minutes client cache

/**
 * Helper: Extract comment text from YouTube API response
 */
function extractCommentText(snippet) {
  return snippet?.textOriginal || snippet?.textDisplay || "";
}

/**
 * GET handler: Fetch and analyze comments with pagination
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10),
    MAX_LIMIT,
  );

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

  if (offset < 0 || limit <= 0) {
    return new Response(
      JSON.stringify({
        error: "Invalid pagination",
        message: "offset must be >= 0 and limit must be > 0",
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
    // Fetch comments from YouTube API
    const commentsUrl = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
    commentsUrl.searchParams.set("part", "snippet");
    commentsUrl.searchParams.set("videoId", videoId);
    commentsUrl.searchParams.set("maxResults", "100"); // Get all comments
    commentsUrl.searchParams.set("textFormat", "plainText");

    const commentsResponse = await fetch(commentsUrl.toString(), {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    if (!commentsResponse.ok) {
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

    // Parse all comments from response
    const allComments = (commentsData.items || []).map((item) => {
      const snippet = item.snippet?.topLevelComment?.snippet;
      return {
        author: snippet?.authorDisplayName || "Unknown",
        text: extractCommentText(snippet),
      };
    });

    const totalComments = allComments.length;

    // Calculate pagination
    const endIndex = Math.min(offset + limit, totalComments);
    const batchComments = allComments.slice(offset, endIndex);
    const hasMore = endIndex < totalComments;

    if (batchComments.length === 0) {
      return new Response(
        JSON.stringify({
          comments: [],
          total: totalComments,
          analyzed: 0,
          offset,
          hasMore: false,
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

    // Analyze emotions for this batch
    const commentTexts = batchComments.map((c) => c.text);
    const analysisStartTime = Date.now();

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

    const analysisTime = Date.now() - analysisStartTime;
    const avgTimePerComment = Math.round(
      analysisTime / Math.max(commentTexts.length, 1),
    );

    console.log(
      `[PERF] Batch analyzed ${commentTexts.length} comments (offset=${offset}) in ${analysisTime}ms (avg ${avgTimePerComment}ms/comment)`,
    );

    // Combine comments with emotion data
    const commentsWithEmotions = batchComments.map((comment, index) => ({
      ...comment,
      emotion: emotionResults[index]?.label || "neutral",
      emotionScore: emotionResults[index]?.score || 0,
      isML: true,
    }));

    // Return paginated response
    const responseData = {
      comments: commentsWithEmotions,
      total: totalComments,
      analyzed: batchComments.length,
      offset,
      hasMore,
      _timing: {
        analysisTimeMs: analysisTime,
        avgPerCommentMs: avgTimePerComment,
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `private, max-age=${CACHE_MAX_AGE}`,
      },
    });
  } catch (error) {
    console.error("Paginated comments API error:", error);
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
