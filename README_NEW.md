# YouTube Emotion Analysis - yt-emotion

**Analyze the emotional sentiment of YouTube comments using AI-powered emotion classification.**

Authenticate with your Google account, select any of your uploaded videos, and instantly get detailed emotion analytics with beautiful visualizations. Comments are analyzed using the industry-standard `distilroberta-base` model from Hugging Face.

---

## ✨ Features

- **🔐 Secure Authentication**: OAuth 2.0 via Google (no password storage)
- **📊 Emotion Analytics**: 7-emotion classification (joy, sadness, anger, fear, surprise, disgust, neutral)
- **⚡ Fast Analysis**:
  - Local deployment: 10-50ms per comment
  - Cloud deployment: 1-3 seconds per comment
- **📈 Beautiful Visualizations**: Interactive pie and bar charts with Recharts
- **📄 Export Reports**: Download emotion analysis as PDF
- **🎯 Scalable**: Supports 100+ comments per video
- **🔄 Smart Fallback**: Automatic failover from local server to Hugging Face API

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Google account (for OAuth)
- Python 3.8+ (for local emotion server)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/yt-emotion.git
cd yt-emotion
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Get credentials from:

- **Google OAuth**: [Google Cloud Console](https://console.cloud.google.com/)
- **Hugging Face API**: [HF Settings](https://huggingface.co/settings/tokens)

### 3. Setup Emotion Server (Development)

```bash
# One-time setup (downloads 500MB model)
.\SETUP_EMOTION_SERVER.bat

# Start the Python server (keep terminal open)
.\start_emotion_server.bat
```

### 4. Run Development Server

Open a new terminal:

```bash
npm run dev
```

Visit http://localhost:3000 and sign in with Google!

---

## 📚 Project Structure

```
yt-emotion/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── auth/[...nextauth]/   # OAuth configuration
│   │   └── yt/                   # YouTube API routes
│   │       ├── videos/           # Fetch user's videos
│   │       └── comments/         # Fetch and analyze comments
│   ├── dashboard/[videoId]/      # Video analysis dashboard
│   ├── analysis/[videoId]/       # Detailed analysis page
│   ├── ClientProviders.jsx       # Session & Error Boundary
│   ├── layout.js                 # Root layout
│   └── page.jsx                  # Landing page
├── components/                   # Reusable React components
│   ├── EmotionPie.jsx           # Pie chart visualization
│   ├── EmotionBar.jsx           # Bar chart visualization
│   ├── ErrorBoundary.jsx        # Error handling
│   ├── VideoCard.jsx            # Video list item
│   └── Header.jsx               # Navigation
├── lib/
│   ├── hf.js                    # Emotion analysis (local + HF API)
│   └── youtube.js               # YouTube helper functions
├── python_emotion_server/        # Local emotion analysis
│   ├── app.py                   # FastAPI server
│   ├── requirements.txt         # Python dependencies
│   └── venv/                    # Virtual environment
├── .env.example                 # Environment template
├── DEPLOYMENT_GUIDE.md          # Deploy to Vercel/Netlify
└── package.json                 # Node dependencies
```

---

## 🔧 Configuration

### Environment Variables

| Variable               | Purpose                  | Example                             |
| ---------------------- | ------------------------ | ----------------------------------- |
| `GOOGLE_CLIENT_ID`     | OAuth client ID          | `123abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth secret             | `GOCSPX-...`                        |
| `NEXTAUTH_SECRET`      | Session encryption       | `openssl rand -base64 32`           |
| `HUGGINGFACE_API_KEY`  | HF API access (optional) | `hf_xxxxx`                          |
| `LOCAL_EMOTION_API`    | Local server URL         | `http://127.0.0.1:8000`             |

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **YouTube Data API v3**
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

---

## 🎯 Architecture

### Data Flow

```
User
  ↓ (OAuth login)
Google OAuth → NextAuth → Session Token
  ↓ (authorized request)
YouTube API → Fetch Videos & Comments
  ↓ (emotion analysis)
Local Server (10-50ms) or HF API (1-3s)
  ↓ (aggregation)
Dashboard → Charts & Visualizations
```

### Emotion Analysis Pipeline

1. **Input**: YouTube comment text (max 512 characters)
2. **Model**: `j-hartmann/emotion-english-distilroberta-base`
3. **Processing**:
   - Batch processing (up to 20 comments)
   - Local server: Instant (~50ms per comment)
   - HF API fallback: ~1-3 seconds per comment
4. **Output**: Emotion label + confidence score
5. **Aggregation**: Counts per emotion category

### Deployment Strategies

| Strategy             | Speed   | Cost             | Setup            |
| -------------------- | ------- | ---------------- | ---------------- |
| **Local Server**     | 10-50ms | Free             | Complex (Python) |
| **Hugging Face API** | 1-3s    | ~$0.01/100 calls | Simple (API key) |
| **Cloud Deployment** | 1-3s    | ~$5-20/month     | Vercel/Netlify   |

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Push to GitHub
git add .
git commit -m "Production ready"
git push origin main

# Visit vercel.com, connect GitHub repo, add env variables
# Automatic deployment on every push!
```

### Deploy to Netlify

```bash
# Connect GitHub repo on netlify.com
# Add environment variables
# Automatic deployment!
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📊 API Endpoints

### GET `/api/yt/videos`

Fetch authenticated user's uploaded videos.

**Response:**

```json
{
  "items": [
    {
      "snippet": {
        "title": "My Video",
        "description": "...",
        "resourceId": { "videoId": "abc123" }
      }
    }
  ]
}
```

### GET `/api/yt/comments?videoId={videoId}`

Fetch and analyze comments for a video.

**Response:**

```json
{
  "comments": [
    {
      "author": "John Doe",
      "text": "Great video!",
      "emotion": "joy",
      "emotionScore": 0.98,
      "isML": true
    }
  ],
  "total": 150,
  "analyzed": 20,
  "hasMore": true
}
```

---

## 🧪 Testing

### Run Linter

```bash
npm run lint
```

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

---

## 🔒 Security

- **No password storage**: OAuth only
- **Session encryption**: NextAuth with NEXTAUTH_SECRET
- **API authentication**: YouTube OAuth tokens validated server-side
- **API keys**: Never exposed to client (server-only routes)
- **CORS**: Properly configured for API routes
- **Sensitive data**: Stripped before sending to frontend

---

## ⚠️ Limitations

1. **Comment limit**: Analyzes first 20 comments per video (customizable)
2. **Language**: Emotion model trained on English text
3. **Rate limiting**: YouTube API has quotas (10,000 units/day)
4. **Accuracy**: Model accuracy ~85-90% (varies by text length/style)
5. **Processing time**:
   - Local server: Fast but requires Python setup
   - Cloud deployment: Slower but easier to deploy

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm start        # Production server
npm run lint     # Run ESLint
```

### Tech Stack

- **Frontend**: React 19, Next.js 16, Tailwind CSS 4
- **Backend**: Next.js API Routes, Node.js
- **Authentication**: NextAuth.js 4
- **ML/AI**: Hugging Face Inference API + Local FastAPI
- **Visualization**: Recharts, Framer Motion
- **UI**: Lucide React icons

---

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Support

Having issues? Check out:

- [Troubleshooting Guide](DEPLOYMENT_GUIDE.md#troubleshooting)
- [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- [NextAuth Documentation](https://next-auth.js.org)
- [Hugging Face Docs](https://huggingface.co/docs)

---

**Made with ❤️ for emotion analysis enthusiasts**
