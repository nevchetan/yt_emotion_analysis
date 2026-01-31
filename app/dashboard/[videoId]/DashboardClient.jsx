"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export default function DashboardClient({ videoId }) {
  const router = useRouter();
  const chartsRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalComments, setTotalComments] = useState(0);
  const [analyzedCount, setAnalyzedCount] = useState(0);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-indigo-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <BarChart3 className="text-indigo-600" size={32} />
            </div>
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-2">
            Loading emotion analysis...
          </p>
          <p className="text-gray-500 text-sm">Analyzing comments with AI</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-600"
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
              <h3 className="text-lg font-bold text-red-900">
                Error Loading Dashboard
              </h3>
            </div>
            <p className="text-red-800 mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition font-medium"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const emotionCounts = getEmotionCounts(comments);
  const emotionStats = getEmotionStats(comments);
  const topEmotion = emotionStats[0];

  // Show message if no comments were analyzed
  if (comments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 shadow-lg text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="text-yellow-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Comments Found
            </h3>
            <p className="text-gray-600 mb-6">
              This video doesn't have any comments yet, or comments are
              disabled.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium"
            >
              Back to Videos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        videoId={videoId}
        videoTitle={videoTitle}
      />

      {/* Action Buttons - Top Priority */}
      <div className="mb-6 flex justify-end gap-4 flex-wrap">
        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="flex items-center gap-3 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition shadow-xl text-lg"
        >
          <Calendar size={24} />
          Set Schedule
        </button>
        <button
          onClick={downloadPDF}
          disabled={downloadingPdf}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl text-lg"
        >
          <Download size={28} />
          {downloadingPdf ? "Generating PDF..." : "Download PDF Report"}
        </button>
      </div>

      {/* Header */}
      <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-b-4 border-indigo-600">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <button
            onClick={() => router.push(`/analysis/${videoId}`)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            <ArrowLeft size={20} />
            Back to Analysis
          </button>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Emotion Analysis Dashboard
        </h1>
        <p className="text-gray-600 text-lg">Video ID: {videoId}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Total Comments
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {totalComments}
              </p>
            </div>
            <BarChart3 className="text-indigo-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Analyzed</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {analyzedCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totalComments > 0
                  ? Math.round((analyzedCount / totalComments) * 100)
                  : 0}
                % of total
              </p>
            </div>
            <div className="text-green-500 text-2xl font-bold">✓</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Top Emotion</p>
              <p className="text-3xl font-bold text-gray-800 mt-2 capitalize">
                {topEmotion?.emotion || "N/A"}
              </p>
              {topEmotion && (
                <p className="text-sm text-gray-500 mt-1">
                  {topEmotion.count} comments ({topEmotion.percentage}%)
                </p>
              )}
            </div>
            <TrendingUp className="text-yellow-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Emotion Types</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {Object.keys(emotionCounts).length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Unique emotions detected
              </p>
            </div>
            <PieChartIcon className="text-purple-500" size={40} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div
        ref={chartsRef}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Pie Chart */}
        <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800 border-b-2 border-indigo-500 pb-3">
            <PieChartIcon size={28} className="text-indigo-600" />
            Distribution Overview
          </h2>
          <EmotionPie emotionData={emotionCounts} />
          {/* Count Legend */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-800 uppercase tracking-wide">
              Emotion Breakdown:
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {emotionStats.map((stat) => (
                <div
                  key={stat.emotion}
                  className="flex justify-between items-center p-2 bg-gray-100 rounded hover:bg-gray-200 transition"
                >
                  <span className="capitalize text-gray-700 font-medium">
                    {stat.emotion}:
                  </span>
                  <span className="font-bold text-indigo-600 text-lg">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800 border-b-2 border-indigo-500 pb-3">
            <BarChart3 size={28} className="text-indigo-600" />
            Comparative Analysis
          </h2>
          <EmotionBar emotionData={emotionCounts} />
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800 border-b-2 border-indigo-500 pb-3">
          📊 Detailed Emotion Statistics
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Emotion
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {emotionStats.map((stat, index) => (
                <tr
                  key={stat.emotion}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
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
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-gray-900">
                      {stat.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-indigo-600">
                      {stat.percentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-48">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${stat.percentage}%`,
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
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
