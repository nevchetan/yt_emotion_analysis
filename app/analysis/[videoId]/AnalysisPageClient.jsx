"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReplyWithAIModal from "@/components/ReplyWithAIModal";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Zap,
} from "lucide-react";

export default function AnalysisPageClient({ videoId }) {
  const router = useRouter();
  const [comments, setComments] = useState([]); // All loaded comments
  const [displayCount, setDisplayCount] = useState(20); // How many to display
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyNotice, setReplyNotice] = useState("");

  useEffect(() => {
    if (!videoId) {
      setError("No video ID provided");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await axios.get(`/api/yt/comments?videoId=${videoId}`, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          params: {
            _t: Date.now(),
          },
        });
        const data = res.data;

        if (data?.error) {
          throw new Error(
            data.error + (data.details ? `: ${data.details}` : ""),
          );
        }

        if (data?.comments && Array.isArray(data.comments)) {
          setComments(data.comments); // Store ALL comments
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

  // Load more (client-side pagination - just show more from already-loaded comments)
  function loadMore() {
    setDisplayCount(displayCount + 20);
  }

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          />
        </div>

        {/* Loading Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 text-center bg-white/10 backdrop-blur-xl p-12 rounded-2xl shadow-lift border border-white/20 max-w-md w-full mx-4"
        >
          {/* Animated icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-indigo-500"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-500 border-l-purple-500"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-4 flex items-center justify-center"
            >
              <MessageSquare className="text-indigo-400" size={32} />
            </motion.div>
          </div>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"
          >
            Analyzing Comments
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-slate-300"
          >
            This may take a moment...
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mt-6 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          />
        </motion.div>
      </div>
    );
  }

  if (error) {
    const isPermissionError = error.includes("Insufficient permissions");
    const isMLError =
      error.includes("ML Analysis Failed") ||
      error.includes("HUGGINGFACE_API_KEY");

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden p-6">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
          />
        </div>

        {/* Error Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          <div className="glass-dark rounded-2xl p-8 shadow-lift border border-red-500/20 backdrop-blur-xl">
            {/* Error Icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-red-400 text-center mb-4">
              ❌ Error Loading Comments
            </h2>

            {/* Error Message */}
            <div className="bg-white/5 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                {error}
              </p>
            </div>

            {/* Solution Box */}
            {isPermissionError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
              >
                <p className="text-blue-400 font-semibold mb-3">
                  🔐 Permission Issue
                </p>
                <p className="text-slate-300 text-sm mb-4">
                  Please sign out and sign back in to refresh your YouTube
                  access permissions.
                </p>
              </motion.div>
            )}

            {isMLError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4"
              >
                <p className="text-amber-400 font-semibold mb-3">
                  🔧 Setup Required
                </p>
                <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                  <li>Create a Hugging Face account (free)</li>
                  <li>
                    Get your API key from{" "}
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline"
                    >
                      huggingface.co/settings/tokens
                    </a>
                  </li>
                  <li>
                    Add to your{" "}
                    <code className="bg-white/10 px-1 rounded">.env.local</code>
                    :
                  </li>
                  <li className="ml-4">
                    <code className="bg-white/10 px-1 rounded text-xs">
                      HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxx
                    </code>
                  </li>
                  <li>Restart your dev server</li>
                </ol>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-col sm:flex-row">
              {isPermissionError && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lift transition font-medium"
                >
                  Sign Out & Sign Back In
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition font-medium"
              >
                Try Again
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.history.back()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition font-medium"
              >
                Go Back
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const emotionCounts = getEmotionCounts(comments);
  const filteredComments = selectedEmotion
    ? comments.filter((c) => (c.emotion || "neutral") === selectedEmotion)
    : comments.slice(0, displayCount);
  const hasMore = !selectedEmotion && displayCount < comments.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition font-medium mb-6"
          >
            <ArrowLeft size={20} />
            Back to Videos
          </motion.button>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              Comment Analysis
            </motion.h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/dashboard/${videoId}`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lift transition shadow-soft font-medium w-fit"
            >
              <BarChart3 size={20} />
              View Dashboard
            </motion.button>
          </div>
        </motion.div>

        {/* Emotion Distribution Cards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-2xl shadow-lift p-6 mb-8 border border-white/10 backdrop-blur-xl"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg"
            >
              <TrendingUp size={20} className="text-white" />
            </motion.div>
            Sentiment Distribution
          </h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05, delayChildren: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3"
          >
            {/* All Comments Card */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedEmotion(null)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-3 rounded-lg border-2 transition cursor-pointer backdrop-blur-sm ${
                selectedEmotion === null
                  ? "bg-indigo-500/30 text-indigo-200 border-indigo-400 ring-2 ring-indigo-500/30"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="text-2xl font-bold">{comments.length}</div>
              <div className="text-sm font-medium">All</div>
              <div className="text-xs opacity-75">100%</div>
            </motion.button>

            {/* Individual Emotion Cards */}
            {Object.entries(emotionCounts).map(([emotion, count], idx) => (
              <motion.button
                key={emotion}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (idx + 1) * 0.05 }}
                onClick={() => setSelectedEmotion(emotion)}
                className={`p-3 rounded-lg border-2 transition cursor-pointer backdrop-blur-sm ${
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
                  {comments.length > 0
                    ? Math.round((count / comments.length) * 100)
                    : 0}
                  %
                </div>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Comments List Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-dark rounded-2xl shadow-lift p-8 border border-white/10 backdrop-blur-xl"
        >
          <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg"
            >
              <MessageSquare size={20} className="text-white" />
            </motion.div>
            Comments ({filteredComments.length})
            {!selectedEmotion && displayCount < comments.length && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                · {displayCount} of {comments.length}
              </span>
            )}
            {selectedEmotion && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                · Filtered by {getEmotionLabel(selectedEmotion)}
              </span>
            )}
          </h2>

          {replyNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400 backdrop-blur-sm"
            >
              ✓ {replyNotice}
            </motion.div>
          )}

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {filteredComments.length > 0 ? (
                filteredComments.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{
                      x: 4,
                      backgroundColor: "rgba(255,255,255,0.08)",
                    }}
                    className="p-4 rounded-lg border border-white/10 bg-white/5 hover:border-white/20 transition group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <strong className="text-white truncate">
                            {c.author}
                          </strong>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`px-2 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getEmotionColor(
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
                                title="Keyword-based analysis"
                              >
                                ⚠
                              </span>
                            )}
                          </motion.span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setReplyTarget(c)}
                            disabled={!c.commentId}
                            title={
                              c.commentId
                                ? "Reply with AI"
                                : "Reply unavailable"
                            }
                            className="ml-auto rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-xs font-semibold text-white hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50 transition group-hover:opacity-100 opacity-0"
                          >
                            Reply with AI
                          </motion.button>
                        </div>
                        <p className="text-slate-300 leading-relaxed break-words">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-slate-400 text-center py-12"
                >
                  No comments found for this emotion.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {!selectedEmotion && hasMore && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadMore}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition flex items-center gap-2 shadow-lift hover:shadow-glow"
              >
                <Zap size={18} />
                Load More ({comments.length - displayCount} remaining)
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {replyTarget && (
        <ReplyWithAIModal
          comment={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSuccess={() => {
            setReplyTarget(null);
            setReplyNotice("Reply posted successfully!");
            setTimeout(() => setReplyNotice(""), 3000);
          }}
        />
      )}
    </main>
  );
}
