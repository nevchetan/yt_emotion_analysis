"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart2, Eye, MessageSquare, Zap } from "lucide-react";

export default function VideoCard({ video, index = 0 }) {
  const router = useRouter();

  const videoId =
    video?.snippet?.resourceId?.videoId ||
    video?.id?.videoId ||
    video?.videoId ||
    null;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        delay: index * 0.08,
      },
    },
  };

  const hoverVariants = {
    initial: { scale: 1, y: 0 },
    hover: {
      scale: 1.02,
      y: -8,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="group h-full"
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-soft hover-lift h-full flex flex-col border border-slate-100 hover:border-indigo-200">
        {/* Image Container with Overlay */}
        <div className="relative overflow-hidden bg-slate-200 aspect-video">
          <img
            src={video.snippet?.thumbnails?.medium?.url}
            alt={video.snippet?.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Overlay Gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end"
          >
            <div className="p-3 w-full flex gap-2">
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-medium text-gray-800">
                <Eye size={14} />
                <span>Analyze</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Content Container */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Title */}
          <h2 className="font-bold text-sm md:text-base mb-3 line-clamp-2 text-gray-900 group-hover:text-indigo-600 transition-colors">
            {video.snippet?.title}
          </h2>

          {/* Stats (optional metadata) */}
          <div className="flex gap-3 mb-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MessageSquare size={14} />
              <span>Comments</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={14} />
              <span>Emotions</span>
            </div>
          </div>

          {/* Analyze Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!videoId) {
                alert("Video ID missing");
                return;
              }
              router.push(`/analysis/${videoId}`);
            }}
            className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold shadow-soft hover:shadow-lift hover:brightness-110 transition-all duration-300 w-full group-hover:shadow-glow"
          >
            <BarChart2 size={18} />
            <span>Analyze</span>
          </motion.button>
        </div>

        {/* Top Accent Bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.08 + 0.3, duration: 0.6 }}
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 w-full origin-left"
        />
      </div>
    </motion.div>
  );
}
