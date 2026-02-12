/**
 * Emotion Analysis Module
 *
 * Provides fast emotion classification with priority:
 * 1. Hugging Face Space (500ms-2s) - Production (PRIMARY - FASTEST)
 * 2. Local Python FastAPI server (10-50ms) - Development fallback
 * 3. Hugging Face Inference API (10+ seconds) - Emergency fallback only
 *
 * Model: j-hartmann/emotion-english-distilroberta-base
 * Emotions: joy, sadness, anger, fear, surprise, disgust, neutral
 */

const LOCAL_API_URL = process.env.LOCAL_EMOTION_API || "http://127.0.0.1:8000";
const HF_SPACE_URL = process.env.HF_SPACE_URL; // HuggingFace Space endpoint (e.g., https://your-username-emotion-analyzer.hf.space)
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base";

const MAX_RETRIES = 2;
const BASE_DELAY = 500;
const MAX_TEXT_LENGTH = 512; // Model input limit

/**
 * Sleep utility for retry delays
 */
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Analyze emotion of a single text string
 * @param {string} text - Text to analyze (max 512 chars)
 * @returns {Promise<{label: string, score: number}>} Emotion with confidence score
 * @throws {Error} If analysis fails on all retries
 */
export async function analyzeEmotion(text) {
  if (!text || !text.trim()) {
    throw new Error("Text cannot be empty");
  }

  const cleanedText = text
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_TEXT_LENGTH);

  // Strategy 1: HuggingFace Space (PRIMARY - production fast and reliable)
  if (HF_SPACE_URL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${HF_SPACE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          label: data.label.toLowerCase(),
          score: data.score,
        };
      }
    } catch (error) {
      console.warn("HF Space unavailable, trying local server:", error.message);
      // Continue to local server fallback
    }
  }

  // Strategy 2: Local FastAPI server (development fallback)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Quick timeout for fallback

    const response = await fetch(`${LOCAL_API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanedText }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        label: data.label.toLowerCase(),
        score: data.score,
      };
    }
  } catch (error) {
    // Local server unavailable, continue to HF API
  }

  // Strategy 3: Hugging Face Inference API (slow emergency fallback)
  if (!HF_API_KEY) {
    console.warn(
      "No HF_SPACE_URL or HF_API_KEY configured, returning neutral emotion",
    );
    return { label: "neutral", score: 0 };
  }

  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(HF_MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: cleanedText }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 504) {
          lastError = new Error("HF API Gateway Timeout");
          const delay = BASE_DELAY * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        throw new Error(`HF API Error ${response.status}`);
      }

      const data = await response.json();
      const predictions = Array.isArray(data[0]) ? data[0] : data;

      if (!Array.isArray(predictions) || predictions.length === 0) {
        throw new Error("Invalid HF response format");
      }

      const topEmotion = predictions.reduce((prev, curr) =>
        curr.score > prev.score ? curr : prev,
      );

      return {
        label: topEmotion.label.toLowerCase(),
        score: topEmotion.score,
      };
    } catch (error) {
      lastError = error;

      if (error.name === "AbortError" || error.message.includes("504")) {
        if (attempt < MAX_RETRIES - 1) {
          await sleep(2000 + attempt * 3000);
          continue;
        }
      } else {
        throw error;
      }
    }
  }

  return { label: "neutral", score: 0 };
}

/**
 * Analyze emotions for multiple texts efficiently
 * Uses batch endpoint on local/HF Space server, falls back to sequential processing
 * @param {string[]} texts - Array of texts to analyze
 * @param {number} concurrency - Number of parallel requests (default 3)
 * @returns {Promise<Array<{label: string, score: number}>>} Array of emotions
 */
export async function analyzeEmotionsBatch(texts, concurrency = 3) {
  if (!texts || texts.length === 0) {
    return [];
  }

  const cleanedTexts = texts.map((t) =>
    t.trim().replace(/\s+/g, " ").slice(0, MAX_TEXT_LENGTH),
  );

  // Try HuggingFace Space batch endpoint first (PRIMARY - production)
  if (HF_SPACE_URL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for batch

      const response = await fetch(`${HF_SPACE_URL}/analyze/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: cleanedTexts }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data.map((item) => ({
          label: item.label.toLowerCase(),
          score: item.score,
        }));
      }
    } catch (error) {
      console.warn(
        "HF Space batch unavailable, trying local server:",
        error.message,
      );
      // Fall back to local server
    }
  }

  // Try local server batch endpoint (development fallback)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Quick timeout for fallback

    const response = await fetch(`${LOCAL_API_URL}/analyze/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: cleanedTexts }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.map((item) => ({
        label: item.label.toLowerCase(),
        score: item.score,
      }));
    }
  } catch (error) {
    // Local server unavailable, fall back to sequential
  }

  // Fallback: Sequential processing with concurrency control
  const results = new Array(texts.length);
  let currentIndex = 0;
  const DELAY_BETWEEN_REQUESTS = 200; // Conservative delay to avoid rate limiting while improving speed (reduced from 300ms)

  const worker = async () => {
    while (currentIndex < texts.length) {
      const index = currentIndex++;
      if (index >= texts.length) break;

      try {
        results[index] = await analyzeEmotion(texts[index]);
      } catch (error) {
        console.error(`Error analyzing text at index ${index}`);
        results[index] = { label: "neutral", score: 0 };
      }

      if (currentIndex < texts.length) {
        await sleep(DELAY_BETWEEN_REQUESTS);
      }
    }
  };

  const workers = Array(Math.min(concurrency, texts.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}
