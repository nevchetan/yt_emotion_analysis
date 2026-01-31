"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Calendar, Clock, Mail } from "lucide-react";

export default function ScheduleModal({
  isOpen,
  onClose,
  videoId,
  videoTitle,
}) {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("09:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const loadSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const res = await fetch("/api/schedule/create", {
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      setSchedules(Array.isArray(data.schedules) ? data.schedules : []);
    } catch (err) {
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    loadSchedules();
  }, [isOpen, loadSchedules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneOffsetMinutes = new Date().getTimezoneOffset();

      const response = await fetch("/api/schedule/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          videoTitle,
          email,
          frequency,
          time,
          timeZone,
          timezoneOffsetMinutes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create schedule");
      }

      setSuccess(true);
      await loadSchedules();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setEmail("");
        setFrequency("daily");
        setTime("09:00");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="text-indigo-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Schedule Email Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Video Info */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Report for:</p>
            <p className="font-semibold text-gray-800 truncate">
              {videoTitle || `Video ${videoId}`}
            </p>
          </div>

          {/* Email Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Frequency Selector */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} />
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (Every Monday)</option>
              <option value="monthly">Monthly (1st of month)</option>
            </select>
          </div>

          {/* Time Picker */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock size={16} />
              Time (24-hour format)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Existing Schedules */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">
                Your Schedules
              </p>
              <button
                type="button"
                onClick={loadSchedules}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Refresh
              </button>
            </div>

            {loadingSchedules ? (
              <p className="text-sm text-gray-600">Loading schedules...</p>
            ) : schedules.length === 0 ? (
              <p className="text-sm text-gray-600">No schedules yet.</p>
            ) : (
              <div className="space-y-3">
                {schedules.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-gray-200 bg-white p-3"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.videoTitle || "Unknown Video"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {item.frequency} at {item.time}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last sent: {item.lastSentAt || "Not sent yet"}
                    </p>
                    {item.lastError && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {item.lastError}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              ✓ Schedule created successfully!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
