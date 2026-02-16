"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import EmotionPie from "@/components/EmotionPie";
import EmotionBar from "@/components/EmotionBar";
import ScheduleModal from "@/components/ScheduleModal";
import {
  ArrowLeft,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Download,
  MessageSquare,
  Calendar,
  Zap,
} from "lucide-react";

export default function DashboardClient({ videoId }) {
  const router = useRouter();
  const chartsRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalComments, setTotalComments] = useState(0);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Loading comments...");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  useEffect(() => {
    if (!videoId) {
      setError("No video ID provided");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoadingMessage("Analyzing all comments for accurate charts...");

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
        let data = res.data;

        // Handle case where data might be double-stringified
        if (typeof data === "string") {
          data = JSON.parse(data);
        }

        if (data?.error) {
          throw new Error(
            data.error + (data.details ? `: ${data.details}` : ""),
          );
        }

        // Extract video title from response metadata
        if (data?.videoTitle) {
          setVideoTitle(data.videoTitle);
        }

        // Handle new paginated response format
        if (data?.comments && Array.isArray(data.comments)) {
          setComments(data.comments);
          setTotalComments(data.total || data.comments.length);
          setAnalyzedCount(data.analyzed || data.comments.length);
          setError("");
        } else if (Array.isArray(data)) {
          // Legacy format support
          setComments(data);
          setTotalComments(data.length);
          setAnalyzedCount(data.length);
          setError("");
        } else {
          // Try parsing string comments if present
          if (data?.comments && typeof data.comments === "string") {
            try {
              const parsed = JSON.parse(data.comments);
              if (Array.isArray(parsed)) {
                setComments(parsed);
                setTotalComments(data.total || parsed.length);
                setAnalyzedCount(data.analyzed || parsed.length);
                setError("");
                return;
              }
            } catch (parseErr) {
              console.error("Failed to parse data.comments:", parseErr);
            }
          }

          throw new Error("Invalid response format from API");
        }
      } catch (e) {
        const errorMessage =
          e.response?.data?.error || e.message || "Failed to load comments";
        setError(errorMessage);
        console.error("Error loading comments:", e);
        if (e.response?.data) {
          console.error("Response data:", e.response.data);
        }
        if (e.message) {
          console.error("Error message:", e.message);
        }
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

  const downloadPDF = async () => {
    if (!chartsRef.current) return;

    setDownloadingPdf(true);
    try {
      // Primary path: build a print-safe, inline-styled export (no Tailwind/lab colors) and render to PDF
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const colorMap = {
        joy: "#FBBF24",
        sadness: "#3B82F6",
        anger: "#EF4444",
        fear: "#A855F7",
        surprise: "#F97316",
        disgust: "#10B981",
        neutral: "#6B7280",
      };

      const stats = getEmotionStats(comments);
      const total = comments.length || 1;

      const exportContainer = document.createElement("div");
      exportContainer.style.width = "900px";
      exportContainer.style.padding = "24px";
      exportContainer.style.background = "#ffffff";
      exportContainer.style.color = "#0f172a";
      exportContainer.style.fontFamily = "Arial, sans-serif";

      exportContainer.innerHTML = `
        <div style="border-bottom: 3px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 22px; font-weight: 700; color: #111827;">Emotion Analysis Report</div>
            <div style="font-size: 14px; color: #374151; margin-top: 4px;">Video: ${videoTitle || "Unknown"}</div>
          </div>
          <div style="font-size: 12px; color: #4b5563;">Generated on ${new Date().toLocaleString()}</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px;">
          <div style="border: 1px solid #e5e7eb; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 12px; background: #f8fafc;">
            <div style="font-size: 12px; color: #4b5563;">Total Comments</div>
            <div style="font-size: 24px; font-weight: 700; color: #111827; margin-top: 4px;">${total}</div>
          </div>
          <div style="border: 1px solid #e5e7eb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 12px; background: #fffbeb;">
            <div style="font-size: 12px; color: #4b5563;">Unique Emotions</div>
            <div style="font-size: 24px; font-weight: 700; color: #111827; margin-top: 4px;">${Object.keys(colorMap).length}</div>
          </div>
          <div style="border: 1px solid #e5e7eb; border-left: 4px solid #10b981; border-radius: 8px; padding: 12px; background: #ecfdf3;">
            <div style="font-size: 12px; color: #4b5563;">Top Emotion</div>
            <div style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 4px;">${stats[0]?.emotion || "N/A"}</div>
            ${stats[0] ? `<div style="font-size: 12px; color: #4b5563;">${stats[0].count} comments (${stats[0].percentage}%)</div>` : ""}
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 10px; color: #111827;">Emotion Breakdown</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${stats
              .map((stat) => {
                const pct = ((stat.count / total) * 100).toFixed(1);
                const barWidth = Math.max(6, Math.min(100, pct));
                const color = colorMap[stat.emotion] || "#6B7280";
                return `
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 110px; font-size: 13px; font-weight: 600; text-transform: capitalize; color: #111827;">${stat.emotion}</div>
                    <div style="flex: 1; background: #e5e7eb; border-radius: 9999px; overflow: hidden; height: 12px;">
                      <div style="width: ${barWidth}%; height: 12px; background: ${color};"></div>
                    </div>
                    <div style="width: 70px; font-size: 12px; color: #111827; text-align: right;">${stat.count} (${pct}%)</div>
                  </div>`;
              })
              .join("")}
          </div>
        </div>
      `;

      document.body.appendChild(exportContainer);

      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);

      const safeTitle =
        videoTitle.replace(/[^\/\w\s-]/g, "").substring(0, 100) ||
        `emotion-analysis-${videoId}`;

      doc.save(`${safeTitle}.pdf`);

      document.body.removeChild(exportContainer);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      // Try alternative approach if html2pdf fails
      try {
        const { jsPDF } = await import("jspdf");
        const html2canvas = (await import("html2canvas")).default;

        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        let yPosition = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;

        // Title
        doc.setFontSize(20);
        doc.setTextColor(79, 70, 229);
        doc.text("Emotion Analysis Report", margin, yPosition);
        yPosition += 15;

        // Video title
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Video: ${videoTitle || "Unknown"}`, margin, yPosition);
        yPosition += 10;

        // Summary stats
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("Summary Statistics:", margin, yPosition);
        yPosition += 7;

        doc.setFont(undefined, "normal");
        doc.setFontSize(10);
        const emotionStats = getEmotionStats(comments);
        emotionStats.forEach((stat) => {
          const text = `${stat.emotion.charAt(0).toUpperCase() + stat.emotion.slice(1)}: ${stat.count} (${stat.percentage}%)`;
          doc.text(text, margin + 5, yPosition);
          yPosition += 6;

          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
        });

        doc.save(
          `${videoTitle.replace(/[^\/\w\s-]/g, "").substring(0, 100) || `emotion-analysis-${videoId}`}.pdf`,
        );
      } catch (fallbackErr) {
        console.error("PDF generation failed:", fallbackErr);
        alert("Failed to download PDF. Please try again.");
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background animation */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
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
              <Zap className="text-indigo-400" size={32} />
            </motion.div>
          </div>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"
          >
            {loadingMessage}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-slate-300"
          >
            This may take 15-30 seconds for complete analysis
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full"
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Error Title */}
            <h3 className="text-xl font-bold text-red-400 text-center mb-4">
              Error Loading Dashboard
            </h3>

            {/* Error Message */}
            <p className="text-slate-300 text-center mb-6 text-sm leading-relaxed">
              {error}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-col sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lift transition font-medium"
              >
                Retry
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/")}
                className="flex-1 px-4 py-3 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition font-medium"
              >
                Go Home
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const emotionCounts = getEmotionCounts(comments);
  const emotionStats = getEmotionStats(comments);
  const topEmotion = emotionStats[0];

  // Show message if no comments were analyzed
  if (comments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="glass-dark rounded-2xl p-8 shadow-lift border border-amber-500/20 backdrop-blur-xl text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-6"
            >
              <MessageSquare className="text-amber-400" size={32} />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-3">
              No Comments Found
            </h3>
            <p className="text-slate-300 mb-6">
              This video doesn't have any comments yet, or comments are
              disabled.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/")}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lift transition font-medium"
            >
              Back to Videos
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

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
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Schedule Modal */}
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          videoId={videoId}
          videoTitle={videoTitle}
        />

        {/* Action Buttons - Top Priority */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-end gap-3 flex-wrap"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lift hover:shadow-glow text-sm md:text-base"
          >
            <Calendar size={18} />
            <span>Schedule</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPDF}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-lift disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow text-sm md:text-base"
          >
            <Download size={18} />
            <span>{downloadingPdf ? "Generating..." : "Export PDF"}</span>
          </motion.button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/analysis/${videoId}`)}
            className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-indigo-400 transition font-medium mb-6"
          >
            <ArrowLeft size={20} />
            Back to Analysis
          </motion.button>

          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              Emotion Analysis Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 text-lg"
            >
              {videoTitle || "Video ID: " + videoId}
            </motion.p>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              icon: BarChart3,
              label: "Total Comments",
              value: totalComments,
              gradient: "from-indigo-600 to-blue-600",
              delay: 0,
            },
            {
              icon: TrendingUp,
              label: "Analyzed",
              value: analyzedCount,
              gradient: "from-green-600 to-emerald-600",
              delay: 0.1,
            },
            {
              icon: Zap,
              label: "Top Emotion",
              value:
                topEmotion?.emotion.charAt(0).toUpperCase() +
                topEmotion?.emotion.slice(1),
              gradient: "from-amber-600 to-orange-600",
              delay: 0.2,
            },
            {
              icon: PieChartIcon,
              label: "Emotion Types",
              value: Object.keys(emotionCounts).length,
              gradient: "from-purple-600 to-pink-600",
              delay: 0.3,
            },
          ].map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: card.delay }}
              className={`glass-dark rounded-xl p-6 shadow-lift border border-white/10 backdrop-blur-xl group hover:border-indigo-500/30 hover-lift`}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4`}
              >
                <card.icon className="text-white" size={24} />
              </motion.div>
              <p className="text-slate-400 text-sm font-medium mb-2">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Section */}
        <motion.div
          ref={chartsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-dark rounded-2xl p-8 shadow-lift border border-white/10 backdrop-blur-xl hover-lift"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center"
              >
                <PieChartIcon className="text-white" size={22} />
              </motion.div>
              Distribution Overview
            </h2>
            <EmotionPie emotionData={emotionCounts} />
            {/* Count Legend */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 pt-6 border-t border-white/10"
            >
              <h3 className="text-sm font-semibold mb-4 text-slate-300 uppercase tracking-wider">
                Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {emotionStats.map((stat, idx) => (
                  <motion.div
                    key={stat.emotion}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/0 hover:border-white/10 transition cursor-pointer"
                  >
                    <p className="text-slate-400 text-xs font-medium mb-1">
                      {stat.emotion.charAt(0).toUpperCase() +
                        stat.emotion.slice(1)}
                    </p>
                    <p className="text-lg font-bold text-indigo-400">
                      {stat.count}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-dark rounded-2xl p-8 shadow-lift border border-white/10 backdrop-blur-xl hover-lift"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"
              >
                <BarChart3 className="text-white" size={22} />
              </motion.div>
              Comparative Analysis
            </h2>
            <EmotionBar emotionData={emotionCounts} />
          </motion.div>
        </motion.div>

        {/* Detailed Stats Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-dark rounded-2xl shadow-lift border border-white/10 p-8 backdrop-blur-xl overflow-hidden"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center"
            >
              📊
            </motion.div>
            Detailed Statistics
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Emotion
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Distribution
                  </th>
                </tr>
              </thead>
              <tbody>
                {emotionStats.map((stat, index) => (
                  <motion.tr
                    key={stat.emotion}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="border-b border-white/5 hover:border-white/10 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="inline-block px-3 py-1 rounded-full text-sm font-bold text-white capitalize"
                        style={{
                          backgroundColor:
                            {
                              joy: "#FBBF24",
                              sadness: "#3B82F6",
                              anger: "#EF4444",
                              fear: "#A855F7",
                              surprise: "#F97316",
                              disgust: "#10B981",
                              neutral: "#6B7280",
                            }[stat.emotion] || "#6B7280",
                        }}
                      >
                        {stat.emotion}
                      </motion.span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-white">
                        {stat.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-indigo-400">
                        {stat.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-48">
                        <motion.div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: `${stat.percentage}%` }}
                            transition={{
                              delay: 0.5 + index * 0.05,
                              duration: 1,
                            }}
                            className="h-2 rounded-full transition-all"
                            style={{
                              background: `linear-gradient(90deg, ${
                                {
                                  joy: "#FBBF24",
                                  sadness: "#3B82F6",
                                  anger: "#EF4444",
                                  fear: "#A855F7",
                                  surprise: "#F97316",
                                  disgust: "#10B981",
                                  neutral: "#6B7280",
                                }[stat.emotion] || "#6B7280"
                              }, ${
                                {
                                  joy: "#FBBF24",
                                  sadness: "#3B82F6",
                                  anger: "#EF4444",
                                  fear: "#A855F7",
                                  surprise: "#F97316",
                                  disgust: "#10B981",
                                  neutral: "#6B7280",
                                }[stat.emotion] || "#6B7280"
                              })`,
                            }}
                          />
                        </motion.div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
