import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash"; // Latest fast model, supports generateContent

function extractJsonArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function normalizeSuggestions(raw) {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .map((item) => {
      if (typeof item === "string") {
        return { text: item.trim(), tone: "suggested" };
      }
      if (item && typeof item === "object") {
        const text = String(item.text || item.reply || "").trim();
        const tone = String(item.tone || item.style || "suggested").trim();
        return text ? { text, tone } : null;
      }
      return null;
    })
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : null;
}

function fallbackSuggestions() {
  return [
    {
      text: "Thanks for the comment! I appreciate you watching.",
      tone: "friendly",
    },
    {
      text: "Appreciate the feedback. Let me know what you would like to see next.",
      tone: "helpful",
    },
    {
      text: "Thanks for sharing this. What part stood out to you most?",
      tone: "engaging",
    },
  ];
}

export async function generateReplySuggestions({ commentText, emotion }) {
  if (!GEMINI_API_KEY) {
    console.warn(
      "⚠️ GEMINI_API_KEY not set - using fallback suggestions. Add it to .env.local",
    );
    return fallbackSuggestions();
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // Build emotion-specific guidance
  const emotionGuidance = {
    anger:
      "Be empathetic and understanding. Acknowledge their frustration without being defensive. Offer a solution if possible.",
    sadness:
      "Be supportive and compassionate. Show you care about their feelings. Offer encouragement.",
    joy: "Match their positive energy! Be enthusiastic and grateful. Celebrate with them.",
    fear: "Be reassuring and helpful. Address their concerns directly. Provide clarity or solutions.",
    surprise:
      "Acknowledge their reaction. Provide context or explanation if needed. Engage with curiosity.",
    disgust:
      "Be respectful and professional. Acknowledge their concern. Offer clarification or improvement.",
    neutral:
      "Be friendly and engaging. Encourage further discussion. Ask thoughtful questions.",
  };

  const guidance =
    emotionGuidance[emotion?.toLowerCase()] || emotionGuidance["neutral"];

  const prompt = `You are a helpful YouTube creator replying to a viewer's comment.

**Comment:** "${commentText}"
**Detected emotion:** ${emotion || "neutral"}

**Tone guidance:** ${guidance}

Generate exactly 3 personalized reply options that DIRECTLY REFERENCE the comment content and emotion:

1) **Friendly (15-20 words):** Warm, personal, acknowledges their specific point
2) **Helpful (25-35 words):** Detailed, addresses their concern or adds value, shows you read their comment
3) **Engaging (15-20 words):** Asks a relevant question or invites further discussion about THEIR specific point

IMPORTANT:
- Reference specific words/phrases from their comment
- Match the emotional tone (don't be cheerful if they're frustrated)
- Make it sound natural, not robotic
- Avoid generic "Thanks for watching" - be SPECIFIC to their comment

Return ONLY a JSON array:
[
  {"text": "your personalized friendly reply here", "tone": "friendly"},
  {"text": "your personalized helpful reply here", "tone": "helpful"},
  {"text": "your personalized engaging reply here", "tone": "engaging"}
]`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("✅ Gemini API response received");

    const parsed = extractJsonArray(responseText);
    const normalized = normalizeSuggestions(parsed);

    if (!normalized) {
      console.error(
        "Failed to parse Gemini response:",
        responseText.substring(0, 200),
      );
      return fallbackSuggestions();
    }

    return normalized;
  } catch (error) {
    console.error("❌ Gemini API error:", error.message, error.stack);
    return fallbackSuggestions();
  }
}
