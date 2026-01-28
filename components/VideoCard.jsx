"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";

export default function VideoCard({ video }) {
  const router = useRouter();

  // Correct videoId for playlist response
  const videoId =
    video?.snippet?.resourceId?.videoId || // main fix
    video?.id?.videoId ||
    video?.videoId ||
    null;

  return (
    <motion.div
      whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
      className="bg-white rounded-lg overflow-hidden shadow-md flex flex-col"
    >
      <img
        src={video.snippet?.thumbnails?.medium?.url}
        alt={video.snippet?.title}
        className="w-full object-cover aspect-video"
      />
      <div className="p-4 flex flex-col flex-grow">
        <h2 className="font-semibold text-lg mb-3 line-clamp-2">
          {video.snippet?.title}
        </h2>

        <button
          onClick={() => {
            if (!videoId) {
              alert("Video ID missing");
              return;
            }
            router.push(`/analysis/${videoId}`);
          }}
          className="mt-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-md font-semibold shadow-md hover:brightness-110 transition"
        >
          <BarChart2 size={20} />
          Analyze Comments
        </button>
      </div>
    </motion.div>
  );
}
