"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/**
 * Emotion Bar Chart Component
 * Displays emotion analysis results in a sortable bar chart
 * Supports 7 emotion categories from distilroberta model
 */

const EMOTION_CONFIG = {
  joy: { label: "Joy", color: "#FBBF24" },
  sadness: { label: "Sadness", color: "#3B82F6" },
  anger: { label: "Anger", color: "#EF4444" },
  fear: { label: "Fear", color: "#A855F7" },
  surprise: { label: "Surprise", color: "#F97316" },
  disgust: { label: "Disgust", color: "#10B981" },
  neutral: { label: "Neutral", color: "#6B7280" },
};

/**
 * Custom Tooltip for bar chart
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900">{data.emotion}</p>
        <p className="text-sm text-indigo-600 font-medium">
          Count: {data.count}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * EmotionBar Component
 * @param {Object} emotionData - Object with emotion keys and counts
 * @returns {React.ReactElement}
 */
export default function EmotionBar({ emotionData = {} }) {
  // Transform data for chart
  const chartData = Object.entries(emotionData)
    .map(([emotion, count]) => ({
      emotion:
        EMOTION_CONFIG[emotion]?.label ||
        emotion.charAt(0).toUpperCase() + emotion.slice(1),
      count: count || 0,
      emotionKey: emotion,
    }))
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0 || chartData.every((d) => d.count === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <p className="text-lg font-medium">No emotion data available</p>
        <p className="text-sm mt-1">Analyze comments to see results</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="emotion"
          tick={{ fill: "#6B7280", fontSize: 12 }}
          axisLine={{ stroke: "#d1d5db" }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tick={{ fill: "#6B7280", fontSize: 12 }}
          axisLine={{ stroke: "#d1d5db" }}
          label={{ value: "Count", angle: -90, position: "insideLeft" }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
        />
        <Bar
          dataKey="count"
          fill="#6366F1"
          radius={[8, 8, 0, 0]}
          animationDuration={800}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={EMOTION_CONFIG[entry.emotionKey]?.color || "#6366F1"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
