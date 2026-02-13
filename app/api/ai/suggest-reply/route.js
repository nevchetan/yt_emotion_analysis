import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { generateReplySuggestions } from "@/lib/gemini";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Please sign in to use AI replies",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await request.json();
    const commentText = body?.commentText;
    const emotion = body?.emotion || "neutral";

    if (!commentText || !String(commentText).trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing comment text",
          message: "commentText is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const suggestions = await generateReplySuggestions({
      commentText: String(commentText).trim(),
      emotion,
    });

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI suggest-reply error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate replies",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
