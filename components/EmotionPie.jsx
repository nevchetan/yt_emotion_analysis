"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

/**
 * Emotion Pie Chart Component
 * Displays emotion distribution as a donut chart with percentages
 * Shows 7 emotion categories from distilroberta model
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
 * Custom Tooltip for pie chart
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    const total = data.total || 1;
    const percentage = ((data.value / total) * 100).toFixed(1);
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-700">Count: {data.value}</p>
        <p className="text-sm font-medium text-indigo-600">
          Percentage: {percentage}%
        </p>
      </div>
    );
  }
  return null;
};

/**
 * EmotionPie Component
 * @param {Object} emotionData - Object with emotion keys and counts
 * @returns {React.ReactElement}
 */
export default function EmotionPie({ emotionData = {} }) {
  // Transform data for chart
  const chartData = Object.entries(emotionData).map(([emotion, count]) => ({
    name:
      EMOTION_CONFIG[emotion]?.label ||
      emotion.charAt(0).toUpperCase() + emotion.slice(1),
    value: count || 0,
    emotion,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const data = chartData.map((item) => ({ ...item, total }));

  if (total === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <p className="text-lg font-medium">No emotion data available</p>
        <p className="text-sm mt-1">Analyze comments to see results</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={120}
          innerRadius={50}
          fill="#8884d8"
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={EMOTION_CONFIG[entry.emotion]?.color || "#6B7280"}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ paddingTop: "20px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
