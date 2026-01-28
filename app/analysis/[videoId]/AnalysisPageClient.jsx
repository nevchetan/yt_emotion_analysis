"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, TrendingUp, MessageSquare } from "lucide-react";

export default function AnalysisPageClient({ videoId }) {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  useEffect(() => {
    if (!videoId) {
      setError("No video ID provided");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await axios.get(`/api/yt/comments?videoId=${videoId}`);
        const data = res.data;

        if (data?.error) {
          throw new Error(
            data.error + (data.details ? `: ${data.details}` : ""),
          );
        }

        if (data?.comments && Array.isArray(data.comments)) {
          setComments(data.comments);
          setError("");
        } else if (Array.isArray(data)) {
          setComments(data);
          setError("");
        } else {
          throw new Error("Invalid response format from API");
        }
      } catch (e) {
        let errorMessage = "Failed to load comments";

        if (e.response?.data) {
          const errorData = e.response.data;
          if (errorData.error === "ML Analysis Failed" || errorData.message) {
            errorMessage = errorData.message || errorData.error;
            if (errorData.details) {
              errorMessage += `\n\nDetails: ${errorData.details}`;
            }
          } else if (
            errorData.error?.includes("insufficient authentication scopes") ||
            errorData.error?.includes("insufficientPermissions") ||
            e.response?.status === 403
          ) {
            errorMessage =
              "Insufficient permissions. Please sign out and sign back in to grant YouTube access permissions.";
          } else if (errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              errorMessage += `: ${errorData.details}`;
            }
          } else if (errorData.details) {
            errorMessage = errorData.details;
          }
        } else if (e.message) {
          errorMessage = e.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [videoId]);

  function getEmotionCounts(data) {
    const counts = {};
    data.forEach((c) => {
      const emotion = c.emotion || "neutral";
      counts[emotion] = (counts[emotion] || 0) + 1;
    });
    return counts;
  }

  function getEmotionColor(emotion) {
    const colors = {
      joy: "bg-yellow-100 text-yellow-800 border-yellow-300",
      sadness: "bg-blue-100 text-blue-800 border-blue-300",
      anger: "bg-red-100 text-red-800 border-red-300",
      fear: "bg-purple-100 text-purple-800 border-purple-300",
      surprise: "bg-orange-100 text-orange-800 border-orange-300",
      disgust: "bg-green-100 text-green-800 border-green-300",
      neutral: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[emotion] || colors.neutral;
  }

  function getEmotionLabel(emotion) {
    return emotion.charAt(0).toUpperCase() + emotion.slice(1);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-indigo-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <MessageSquare className="text-indigo-600" size={32} />
            </div>
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-2">
            Analyzing Comments
          </p>
          <p className="text-gray-500 text-sm">This may take a moment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isPermissionError = error.includes("Insufficient permissions");
    const isMLError =
      error.includes("ML Analysis Failed") ||
      error.includes("HUGGINGFACE_API_KEY");

    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
          <h2 className="text-red-800 font-bold text-xl mb-3">
            ❌ Error Loading Comments
          </h2>
          <div className="text-red-700 whitespace-pre-wrap mb-4">{error}</div>

          {isPermissionError && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Sign Out & Sign Back In
            </button>
          )}

          {isMLError && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 font-semibold mb-2">
                🔧 How to Fix:
              </p>
              <ol className="list-decimal list-inside text-yellow-700 space-y-1">
                <li>Make sure you have a Hugging Face account</li>
                <li>
                  Get your API key from:{" "}
                  <a
                    href="https://huggingface.co/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    https://huggingface.co/settings/tokens
                  </a>
                </li>
                <li>
                  Add it to your{" "}
                  <code className="bg-yellow-100 px-1 rounded">.env.local</code>{" "}
                  file:{" "}
                  <code className="bg-yellow-100 px-1 rounded">
                    HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxx
                  </code>
                </li>
                <li>Restart your dev server</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  const emotionCounts = getEmotionCounts(comments);
  const totalComments = comments.length;
  const filteredComments = selectedEmotion
    ? comments.filter((c) => (c.emotion || "neutral") === selectedEmotion)
    : comments;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition"
        >
          <ArrowLeft size={20} />
          Back to Videos
        </button>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Comment Emotion Analysis
          </h1>
          <button
            onClick={() => router.push(`/dashboard/${videoId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md"
          >
            <BarChart3 size={20} />
            View Dashboard
          </button>
        </div>
      </div>

      {/* Emotion Distribution Cards Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Emotion Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* All Comments Card */}
          <button
            onClick={() => setSelectedEmotion(null)}
            className={`p-3 rounded-lg border-2 transition cursor-pointer ${
              selectedEmotion === null
                ? "bg-indigo-100 text-indigo-800 border-indigo-300 ring-2 ring-indigo-500"
                : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
            }`}
          >
            <div className="text-2xl font-bold">{totalComments}</div>
            <div className="text-sm font-medium">All</div>
            <div className="text-xs opacity-75">100%</div>
          </button>

          {/* Individual Emotion Cards */}
          {Object.entries(emotionCounts).map(([emotion, count]) => (
            <button
              key={emotion}
              onClick={() => setSelectedEmotion(emotion)}
              className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                selectedEmotion === emotion
                  ? `${getEmotionColor(emotion)} ring-2 ring-offset-1`
                  : `${getEmotionColor(emotion)} opacity-60 hover:opacity-100`
              }`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm font-medium">
                {getEmotionLabel(emotion)}
              </div>
              <div className="text-xs opacity-75">
                {totalComments > 0
                  ? Math.round((count / totalComments) * 100)
                  : 0}
                %
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Comments List Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Comments ({filteredComments.length})
          {selectedEmotion && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              - Filtered by {getEmotionLabel(selectedEmotion)}
            </span>
          )}
        </h2>
        <div className="space-y-4">
          {filteredComments.length > 0 ? (
            filteredComments.map((c, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <strong className="text-gray-800">{c.author}</strong>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${getEmotionColor(
                          c.emotion || "neutral",
                        )}`}
                      >
                        {getEmotionLabel(c.emotion || "neutral")}
                        {c.emotionScore && (
                          <span className="ml-1 opacity-75">
                            ({Math.round(c.emotionScore * 100)}%)
                          </span>
                        )}
                        {c.isML === false && (
                          <span
                            className="ml-1 text-xs opacity-60"
                            title="Keyword-based analysis (ML unavailable)"
                          >
                            ⚠
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="text-gray-700">{c.text}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              No comments found for this emotion.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
