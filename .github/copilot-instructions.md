# YouTube Emotion Analysis - AI Coding Instructions

## Project Overview

**yt-emotion** is a Next.js web application that analyzes the emotional sentiment of YouTube comments using Hugging Face's distilroberta-based emotion classification model. Users authenticate with Google OAuth, view their uploaded videos, and see visualized emotion analytics per video.

### Data Flow

1. **Auth**: User logs in via NextAuth + Google OAuth → stores YouTube API access token
2. **Videos**: Fetch user's uploaded videos from YouTube's `contentDetails.uploads` playlist
3. **Comments**: Retrieve all comments for a selected video via YouTube API
4. **Emotions**: Send comments to Hugging Face `/hf-inference` endpoint for emotion classification
5. **Visualization**: Display aggregated emotion counts in pie/bar charts

## Architecture Overview

### Key Directories

- **`app/`** - Next.js App Router (file-based routes)
  - `api/auth/[...nextauth]/route.js` - OAuth configuration (Google provider)
  - `api/yt/{videos,comments}/route.js` - Backend API routes (server-only)
  - `dashboard/[videoId]/DashboardClient.jsx` - Video emotion dashboard (client component)
  - `analysis/[videoId]/` - [Currently unused, reserved for future expansion]
- **`lib/`** - Server-only utility modules
  - `hf.js` - Hugging Face API integration (emotion analysis)
  - `youtube.js` - [Empty, reserved for YouTube helper functions]
- **`components/`** - Reusable React components
  - `EmotionPie.jsx`, `EmotionBar.jsx` - Recharts visualizations
  - `VideoCard.jsx`, `Header.jsx` - UI components

### Tech Stack

- **Framework**: Next.js 16 + React 19 (with React Compiler enabled)
- **Auth**: NextAuth.js v4 (Google OAuth provider)
- **APIs**: YouTube Data API v3, Hugging Face Inference API
- **UI**: Tailwind CSS v4, Recharts (data viz), Lucide React (icons), Framer Motion (animations)
- **Data Fetching**: axios (HTTP), SWR configured in ClientProviders
- **Build**: Turbopack enabled (Next.js 16 default)

## Critical Patterns & Conventions

### 1. NextAuth Configuration

- **Location**: [app/api/auth/[...nextauth]/route.js](app/api/auth/[...nextauth]/route.js)
- **Pattern**: Store OAuth tokens in JWT callback, expose via session
- **YouTube Scopes**: Uses `youtube.readonly` + `youtube.force-ssl` with `offline` access_type to get refresh tokens
- **Key**: Access token available as `session.accessToken` in server routes; refresh tokens stored for token rotation

### 2. Server-Side API Routes (Protected)

- **Pattern**: All API routes check `getServerSession(authOptions)` and validate `session.accessToken`
- **Error Handling**: Return JSON with `{error, status}` format; no generic catch-alls
- **Example**: [app/api/yt/comments/route.js](app/api/yt/comments/route.js#L15-L20) validates auth before querying YouTube
- **Query Params**: Use `new URL(request.url)` to extract params, not destructuring

### 3. Hugging Face Emotion Analysis

- **Model**: `j-hartmann/emotion-english-distilroberta-base` via `https://router.huggingface.co/hf-inference`
- **API Key**: Read from `process.env.HUGGINGFACE_API_KEY` (must be set in `.env.local`)
- **Input**: Plain text (max 512 chars), stripped of leading/trailing whitespace
- **Output**: Array of `{label, score}` objects; **always extract top emotion by highest score**
- **Batch Processing**: [analyzeEmotionsBatch](lib/hf.js#L25-L36) throttles requests (400ms delay) to avoid rate limiting
- **Critical**: Response is unwrapped from nested array structure; see debug comment in `hf.js`

### 4. Client-Server Boundary

- **"use client"**: Applied to components that need React hooks (useState, useEffect)
- **Examples**: [page.jsx](app/page.jsx#L1), [DashboardClient.jsx](app/dashboard/[videoId]/DashboardClient.jsx#L1)
- **Pattern**: Root layout never uses "use client"; wrap with ClientProviders for SessionProvider
- **Data Fetching**: Client components use axios + manual loading states (no tRPC/GraphQL)

### 5. Emotion Data Processing

- **Response Format**: Array of comment objects with `{author, text, emotion, emotionScore, isML}`
- **Visualization Input**: [DashboardClient.jsx](app/dashboard/[videoId]/DashboardClient.jsx#L45-L60) aggregates emotions into counts object
- **Colors**: Mapped in [EmotionPie.jsx](components/EmotionPie.jsx#L3-L11); 7 emotions (joy, sadness, anger, fear, surprise, disgust, neutral)
- **Text Preservation**: Use `textOriginal` (not `textDisplay`) to preserve emojis in YouTube comments

### 6. Environment Setup

- **Required**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `HUGGINGFACE_API_KEY`
- **Reference**: [README_HF_SETUP.md](README_HF_SETUP.md)
- **Dev Server**: `npm run dev` (auto-reloads on file changes)
- **Build**: `npm run build` → `npm start` (Turbopack enabled)

## Performance Optimizations

### Current Improvements (v1)

- **Parallel emotion analysis**: `analyzeEmotionsBatch()` now processes up to 3 comments in parallel (vs sequential 400ms throttle)
  - With 30 comments: ~4-5 seconds total (vs 12+ seconds sequential)
  - Configuration: `concurrency = 3` (adjustable in [api/yt/comments/route.js](app/api/yt/comments/route.js#L20))
- **Comment pagination**: First load analyzes only first 30 comments (vs all 100)
  - Faster initial dashboard render; metadata includes `hasMore` flag for future pagination
  - Page size: `PAGE_SIZE = 30` (adjustable in route)
- **Rate limiting**: 100ms delay between parallel workers (vs 400ms sequential)

### Known Bottlenecks (Future Work)

1. **Hugging Face API latency**: Each comment still requires ~1-2s network round-trip; no way to batch in single request
2. **YouTube pagination**: Currently loads all 100 comments upfront; could paginate comment loading
3. **No caching**: No Redis/memory cache for analyzed comments (would need persistent storage)
4. **Client-side rendering**: All 100+ comments listed in DOM even if user only views summary stats

## Developer Workflows

### Running the App

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Build for production
npm start          # Serve built app
npm run lint       # Run ESLint (no auto-fix)
```

### Debugging API Routes

- Use `console.log()` statements (visible in terminal)
- Check `session.accessToken` presence before external API calls
- Verify Hugging Face API key and model availability
- Test comment pagination: YouTube returns max 100 comments per request

### Adding New Features

1. **New API endpoint**: Create in `app/api/*/route.js`, follow session validation pattern
2. **New UI component**: Place in `components/`, mark with `"use client"` if using hooks
3. **New emotional analysis**: Extend `lib/hf.js` with additional model support (keep batch throttling)
4. **Dashboard pages**: Use dynamic segments like `app/analysis/[videoId]/` matching video routes

## Non-Standard Patterns

- **No ORM**: Direct YouTube API calls (no abstraction layer)
- **No Type System**: JavaScript (not TypeScript); minimal prop validation
- **No Test Suite**: No test files in workspace
- **Manual Cache**: No React Query/SWR hooks for API caching (SWR lib installed but not actively used)
- **Single Model**: Only Hugging Face integration (no fallback sentiment tools)
- **Async Pagination**: YouTube API pagination not implemented (fixed 20 videos/100 comments per request)

## Common Pitfalls for AI Agents

1. **Forget session validation**: Always check `session?.accessToken` in API routes
2. **YouTube API quotas**: Each request consumes quota; test with small datasets
3. **Emotion model rate-limiting**: Batch function has built-in 400ms throttle; don't remove it
4. **Response unwrapping**: Hugging Face returns nested arrays; always check structure with debug logs
5. **Client-side auth**: Never expose tokens in client components; keep sensitive calls in API routes
6. **Text truncation**: Limit comment text to 512 chars before HF analysis (model limitation)

## File References for Patterns

- **Auth pattern**: [app/api/auth/[...nextauth]/route.js](app/api/auth/[...nextauth]/route.js)
- **API route pattern**: [app/api/yt/comments/route.js](app/api/yt/comments/route.js)
- **Client component pattern**: [app/dashboard/[videoId]/DashboardClient.jsx](app/dashboard/[videoId]/DashboardClient.jsx)
- **Emotion analysis**: [lib/hf.js](lib/hf.js)
- **Data visualization**: [components/EmotionPie.jsx](components/EmotionPie.jsx)
