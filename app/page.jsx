"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import VideoCard from "../components/VideoCard";
import {
  Loader2,
  LogOut,
  LogIn,
  Cpu,
  Bot,
  Zap,
  Activity,
  ShieldCheck,
  PlayCircle,
  Eye,
  MessageSquare,
  BarChart2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null); // New state for selected video
  const [analysisLoading, setAnalysisLoading] = useState(false); // New state for analysis loading
  const [emotionResults, setEmotionResults] = useState(null); // New state for emotion results
  const currentUserRef = useRef(null); // Track current logged-in user with ref (doesn't trigger re-renders)

  useEffect(() => {
    console.log(
      "🔍 Effect triggered - status:",
      status,
      "hasSession:",
      !!session,
      "hasToken:",
      !!session?.accessToken,
    );

    // Wait for session to fully load before fetching
    if (status === "loading") {
      console.log("⏳ Status is loading, waiting...");
      return;
    }

    if (!session?.accessToken) {
      console.log("🚫 No session or accessToken, clearing state");
      // User logged out - clear all state
      setVideos([]);
      setSelectedVideo(null);
      setEmotionResults(null);
      currentUserRef.current = null;
      return;
    }

    // Check if user changed (different email)
    const userEmail = session?.user?.email;
    console.log("👤 Current logged in user:", userEmail);
    console.log("📝 Previous user was:", currentUserRef.current);

    if (currentUserRef.current && currentUserRef.current !== userEmail) {
      console.log(
        "🔄 User changed from",
        currentUserRef.current,
        "to",
        userEmail,
      );
      // Clear all state when switching users
      setVideos([]);
      setSelectedVideo(null);
      setEmotionResults(null);
    }
    currentUserRef.current = userEmail;

    console.log("🚀 Starting to fetch videos...");
    setLoading(true);
    async function fetchVideos() {
      try {
        console.log("🔄 Fetching videos from /api/yt/videos...");
        // Add cache busting and no-cache headers
        const res = await axios.get("/api/yt/videos", {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          // Add timestamp to prevent caching
          params: {
            _t: Date.now(),
          },
        });
        console.log("📦 Response:", res.data);
        console.log("🎬 Videos count:", res.data?.items?.length || 0);
        setVideos(res.data.items || []);
        // Clear selected video when switching accounts/refreshing
        setSelectedVideo(null);
        setEmotionResults(null);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching videos:", err);
        console.error("📝 Error response:", err.response?.data);
        setError(err.response?.data?.message || err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [session, status]);

  // Dummy function for analysis - replace with actual API call
  const analyzeVideo = async (videoId) => {
    setAnalysisLoading(true);
    setEmotionResults(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setEmotionResults({
        positive: Math.floor(Math.random() * 40) + 50, // 50-90%
        neutral: Math.floor(Math.random() * 20) + 10, // 10-30%
        negative: Math.floor(Math.random() * 10) + 5, // 5-15%
        overall: "predominantly positive",
        keyPhrases: [
          "engaging content",
          "positive feedback",
          "community interaction",
        ],
      });
    } catch (err) {
      console.error("Analysis error:", err);
      setEmotionResults({ error: "Failed to fetch analysis data." });
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-[#020203] text-cyan-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="relative w-20 h-20 border-2 border-cyan-500/20 rounded-full flex items-center justify-center"
        >
          <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full"></div>
          <Cpu size={30} className="text-fuchsia-500" />
        </motion.div>
        <p className="mt-6 font-mono tracking-[0.5em] text-xs uppercase animate-pulse">
          Syncing YT Link...
        </p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="relative w-full bg-gradient-to-b from-[#050505] via-[#0a0a0f] to-[#000000] text-white overflow-x-hidden">
        {/* Animated Background Grid */}
        <div
          className="fixed inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        ></div>

        {/* Hero Section - Modern Landing Page */}
        <section className="relative z-10 min-h-screen flex items-center px-6 py-20">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-full">
                  <span className="text-cyan-400 text-sm font-semibold uppercase tracking-widest">
                    ✨ AI-Powered Solution
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">
                  Understand Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                    Audience Emotions
                  </span>
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed max-w-xl">
                  Analyze YouTube comments with advanced AI to uncover the
                  emotional sentiment of your viewers. Make data-driven
                  decisions to improve your content strategy.
                </p>
              </div>

              {/* Key Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-cyan-400 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      Real-time Emotion Detection
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Instantly classify 7 different emotions from comments
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-fuchsia-500/20 border border-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-fuchsia-400 text-xs font-bold">
                      ✓
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      Interactive Analytics Dashboard
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Visualize sentiment trends with beautiful charts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-cyan-400 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      PDF Export & Reporting
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Download detailed reports of your emotion analysis
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(6,182,212,0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => signIn("google")}
                className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-8 py-4 font-bold uppercase tracking-widest rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all text-lg"
              >
                <LogIn size={22} /> Start Analyzing
              </motion.button>

              <p className="text-gray-600 text-sm font-mono">
                No credit card required • 100% Secure OAuth • Free to start
              </p>
            </motion.div>

            {/* Right Side - Visual Showcase */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* Main Image Card */}
              <div className="relative">
                {/* Glowing background */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 rounded-2xl blur-3xl"></div>

                {/* Image Container */}
                <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Dashboard Preview */}
                  <div className="aspect-square bg-gradient-to-br from-cyan-900/30 via-black to-fuchsia-900/30 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Animated background elements */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 20,
                        ease: "linear",
                      }}
                      className="absolute w-96 h-96 border border-cyan-500/10 rounded-full"
                    ></motion.div>
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 30,
                        ease: "linear",
                      }}
                      className="absolute w-64 h-64 border border-fuchsia-500/10 rounded-full"
                    ></motion.div>

                    {/* Content */}
                    <div className="relative z-10 text-center space-y-6">
                      <div className="inline-block">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                          className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center shadow-lg"
                        >
                          <BarChart2 size={40} className="text-white" />
                        </motion.div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white">
                          Smart Analytics
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Powered by Advanced ML
                        </p>
                      </div>

                      {/* Mini Stats */}
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-cyan-400">
                            7
                          </div>
                          <div className="text-xs text-gray-500">Emotions</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-fuchsia-400">
                            ∞
                          </div>
                          <div className="text-xs text-gray-500">Scalable</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-cyan-400">
                            98%
                          </div>
                          <div className="text-xs text-gray-500">Accurate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="absolute -bottom-6 -left-6 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-4 shadow-xl max-w-xs border border-cyan-400/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Activity size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        Real-time Updates
                      </p>
                      <p className="text-cyan-100 text-xs">
                        Instant analysis results
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
                  className="absolute -top-6 -right-6 bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 rounded-lg p-4 shadow-xl max-w-xs border border-fuchsia-400/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <BarChart2 size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        Visual Insights
                      </p>
                      <p className="text-fuchsia-100 text-xs">
                        Beautiful dashboards
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-cyan-400 text-center"
          >
            <div className="text-xs uppercase tracking-widest mb-2">
              Scroll to explore
            </div>
            <svg
              className="w-5 h-5 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </section>

        {/* Feature Section 1: Emotion Detection */}
        <section className="relative z-10 min-h-screen flex items-center px-6 py-20">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="text-cyan-400 text-sm font-bold uppercase tracking-widest">
                Feature 01
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                AI-Powered Emotion Detection
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Leverage advanced machine learning models to automatically
                detect and classify emotions from YouTube comments. Our system
                identifies 7 distinct emotions: joy, sadness, anger, fear,
                surprise, disgust, and neutral sentiment.
              </p>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  Real-time emotion classification
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  Confidence scores for accuracy
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  High accuracy with distilRoBERTa model
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 border border-white/10 rounded-lg p-8 backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
                      😊
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Joy</div>
                      <div className="text-sm text-gray-500">
                        45 comments • 85%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                      😢
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Sadness</div>
                      <div className="text-sm text-gray-500">
                        12 comments • 92%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center">
                      😠
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Anger</div>
                      <div className="text-sm text-gray-500">
                        8 comments • 88%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Section 2: Visualization & Analytics */}
        <section className="relative z-10 min-h-screen flex items-center px-6 py-20">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative order-2 md:order-1"
            >
              <div className="bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 border border-white/10 rounded-lg p-8 backdrop-blur-xl">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">
                      127
                    </div>
                    <div className="text-sm text-gray-400">
                      Total Comments Analyzed
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-2xl font-bold text-yellow-400">
                        45%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Positive Sentiment
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-2xl font-bold text-blue-400">
                        35%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Neutral Sentiment
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-2xl font-bold text-red-400">15%</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Negative Sentiment
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-2xl font-bold text-green-400">
                        5%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Mixed Emotions
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6 order-1 md:order-2"
            >
              <div className="text-cyan-400 text-sm font-bold uppercase tracking-widest">
                Feature 02
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Interactive Charts & Analytics
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Visualize your emotion data with beautiful, interactive charts.
                Get instant insights into audience sentiment distribution with
                pie charts, bar graphs, and detailed statistics for each emotion
                category.
              </p>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  Pie charts for emotion distribution
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  Bar graphs for trend analysis
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  PDF export functionality
                </li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Feature Section 3: Easy Integration */}
        <section className="relative z-10 min-h-screen flex items-center px-6 py-20">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="text-cyan-400 text-sm font-bold uppercase tracking-widest">
                Feature 03
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Seamless YouTube Integration
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Connect your YouTube channel with a single sign-in. Our system
                automatically pulls all your videos and comments, then analyzes
                them to provide comprehensive sentiment insights about your
                audience.
              </p>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  Google OAuth authentication
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  Access all your channel videos
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  Secure and privacy-first approach
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 border border-white/10 rounded-lg p-8 backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
                      ▶
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">YouTube</div>
                      <div className="text-sm text-gray-500">
                        Direct channel access
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      🔐
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        Secure OAuth
                      </div>
                      <div className="text-sm text-gray-500">
                        Safe authentication
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      ⚡
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        Real-time Analysis
                      </div>
                      <div className="text-sm text-gray-500">
                        Instant results
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Start Analyzing Your{" "}
              <span className="text-cyan-400">Audience</span> Today
            </h2>
            <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
              Join thousands of content creators who are using YT Sentiment to
              understand their audience emotions and optimize their content
              strategy.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signIn("google")}
              className="flex items-center gap-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-12 py-5 font-bold uppercase tracking-tighter hover:opacity-90 transition-all rounded-lg shadow-lg text-lg mx-auto"
            >
              <LogIn size={24} /> Get Started Now
            </motion.button>
            <p className="text-gray-500 text-sm mt-8 font-mono uppercase tracking-widest">
              Powered by AI • Secured by OAuth • Fast & Reliable
            </p>
          </motion.div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-900 text-gray-300 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 w-72 h-72 -translate-x-1/2 -translate-y-1/2 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
                ></motion.div>
                <span className="text-[11px] uppercase font-extrabold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  SYSTEM ONLINE
                </span>
              </div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-6xl font-black bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent"
              >
                Welcome back,{" "}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-cyan-400"
                >
                  {session.user.name}
                </motion.span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-slate-400 font-light"
              >
                📊 Select a video to analyze audience sentiment
              </motion.p>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signOut()}
              className="px-6 py-3 bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/50 text-red-400 hover:border-red-400 hover:bg-red-600/30 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all hover:shadow-lift"
            >
              Sign Out
            </motion.button>
          </div>
        </motion.header>

        {/* Videos Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="space-y-4 mb-8">
            {/* Section Header with Premium Look */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-purple-500/0 rounded-lg blur-xl"></div>
              <div className="relative px-6 py-6 border border-purple-500/30 rounded-lg bg-gradient-to-r from-slate-900/50 to-slate-900/30 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="text-indigo-400 flex-shrink-0"
                  >
                    <PlayCircle size={28} />
                  </motion.div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 mb-1">
                      Your Uploaded Videos
                    </h2>
                    <p className="text-slate-400 text-sm font-medium">
                      Select a video to analyze audience sentiment and emotions
                    </p>
                  </div>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50 rounded-lg text-indigo-300 text-sm font-bold uppercase tracking-wider"
                  >
                    {videos.length} {videos.length === 1 ? "video" : "videos"}
                  </motion.span>
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="mt-4 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent rounded-full origin-left"
                ></motion.div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <div className="space-y-4 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full mx-auto"
                  ></motion.div>
                  <p className="text-gray-500 font-mono uppercase tracking-widest">
                    Loading your videos...
                  </p>
                </div>
              </motion.div>
            ) : videos.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 border border-white/10 rounded-2xl p-12 text-center"
              >
                <PlayCircle size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No videos found
                </h3>
                <p className="text-gray-500">
                  It seems you haven't uploaded any videos yet. Please upload a
                  video to YouTube first.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="video-grid"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
                  },
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
              >
                {videos.map((video, idx) => (
                  <motion.div
                    key={video.snippet.resourceId.videoId}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.95 },
                      show: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 100,
                          damping: 12,
                        },
                      },
                    }}
                    onClick={() => {
                      setSelectedVideo(video);
                      setEmotionResults(null);
                    }}
                    className={`group relative cursor-pointer transition-all duration-300 ${
                      selectedVideo?.snippet.resourceId.videoId ===
                      video.snippet.resourceId.videoId
                        ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900"
                        : ""
                    }`}
                  >
                    {/* Glow effect overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity:
                          selectedVideo?.snippet.resourceId.videoId ===
                          video.snippet.resourceId.videoId
                            ? 1
                            : 0,
                      }}
                      className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-xl pointer-events-none z-10 transition-opacity duration-300"
                    ></motion.div>

                    {/* Content */}
                    <VideoCard video={video} index={idx} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Panel: Analysis Results */}
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 space-y-8"
          >
            {/* Premium Card Container */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-pink-500/0 rounded-xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-purple-500/30 rounded-xl p-8 backdrop-blur-lg">
                {/* Video Title Section */}
                <div className="space-y-4 pb-6 border-b border-purple-500/20">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 mb-2">
                      {selectedVideo.snippet.title}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium">
                      Published on{" "}
                      <span className="text-indigo-300 font-semibold">
                        {new Date(
                          selectedVideo.snippet.publishedAt,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </p>
                  </motion.div>

                  {/* Analyze Button - Premium Style */}
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      analyzeVideo(selectedVideo.snippet.resourceId.videoId)
                    }
                    disabled={analysisLoading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider text-sm shadow-lg disabled:shadow-none"
                  >
                    {analysisLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        ></motion.div>
                        Analyzing Comments...
                      </span>
                    ) : (
                      "🚀 Analyze Emotions"
                    )}
                  </motion.button>
                </div>

                {/* Analysis Results */}
                {emotionResults && !emotionResults.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-6"
                  >
                    {/* Premium Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Overall Sentiment Card */}
                      <motion.div
                        whileHover={{
                          y: -4,
                          boxShadow: "0 10px 25px rgba(99, 102, 241, 0.2)",
                        }}
                        className="relative overflow-hidden rounded-lg p-5 bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/40 backdrop-blur"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <div className="relative space-y-2">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            Overall Sentiment
                          </p>
                          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 capitalize">
                            {emotionResults.overall}
                          </p>
                          <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                      </motion.div>

                      {/* Positive Card */}
                      <motion.div
                        whileHover={{
                          y: -4,
                          boxShadow: "0 10px 25px rgba(34, 197, 94, 0.2)",
                        }}
                        className="relative overflow-hidden rounded-lg p-5 bg-gradient-to-br from-green-600/20 to-emerald-600/10 border border-green-500/40 backdrop-blur"
                      >
                        <div className="relative space-y-2">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            Positive Emotions
                          </p>
                          <p className="text-3xl font-black text-green-300">
                            {emotionResults.positive}%
                          </p>
                          <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                        </div>
                      </motion.div>

                      {/* Negative Card */}
                      <motion.div
                        whileHover={{
                          y: -4,
                          boxShadow: "0 10px 25px rgba(239, 68, 68, 0.2)",
                        }}
                        className="relative overflow-hidden rounded-lg p-5 bg-gradient-to-br from-red-600/20 to-rose-600/10 border border-red-500/40 backdrop-blur"
                      >
                        <div className="relative space-y-2">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            Negative Emotions
                          </p>
                          <p className="text-3xl font-black text-red-300">
                            {emotionResults.negative}%
                          </p>
                          <div className="h-1 w-16 bg-gradient-to-r from-red-500 to-rose-500 rounded-full"></div>
                        </div>
                      </motion.div>
                    </div>

                    {emotionResults.keyPhrases && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                          <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                            Key Phrases & Themes
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {emotionResults.keyPhrases.map((phrase, idx) => (
                            <motion.span
                              key={idx}
                              whileHover={{ scale: 1.05, y: -2 }}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50 rounded-full text-indigo-300 text-sm font-semibold cursor-default hover:shadow-lg transition-shadow"
                            >
                              {phrase}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {emotionResults?.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-red-600/20 to-rose-600/10 border border-red-500/40 rounded-lg p-6 backdrop-blur"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <p className="text-red-400 font-bold uppercase tracking-wider text-sm">
                        Error
                      </p>
                    </div>
                    <p className="text-red-300">{emotionResults.error}</p>
                  </motion.div>
                )}

                {!emotionResults && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="mb-6"
                    >
                      <BarChart2 size={48} className="text-slate-600" />
                    </motion.div>
                    <p className="text-slate-500 font-mono uppercase tracking-widest text-sm">
                      📊 Click "Analyze Sentiments" to see results
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
