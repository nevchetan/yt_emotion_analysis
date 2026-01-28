# HuggingFace Space Setup Guide

## 🚀 Why Use HuggingFace Spaces?

**Performance Comparison:**

- ❌ **HuggingFace API** (current fallback): 10-30+ seconds for 20 comments
- ✅ **HuggingFace Space** (recommended): 2-5 seconds for 20 comments
- ⚡ **Local Server** (development only): Sub-second

**The HF Spaces endpoint is 5-10x faster than the HF API and works in production!**

---

## 📋 Prerequisites

1. HuggingFace account (free): https://huggingface.co/join
2. Python 3.8+ installed locally (for testing Space code)
3. Git installed

---

## 🛠️ Step 1: Create Your HuggingFace Space

### 1.1 Create New Space

1. Go to https://huggingface.co/spaces
2. Click **"Create new Space"**
3. Fill in details:
   - **Owner**: Your username
   - **Space name**: `emotion-analyzer` (or any name)
   - **License**: Apache 2.0
   - **SDK**: Select **"Gradio"** (we'll convert to FastAPI)
   - **Visibility**: Public (free) or Private (paid)
4. Click **"Create Space"**

### 1.2 Clone Your Space

```bash
git clone https://huggingface.co/spaces/YOUR-USERNAME/emotion-analyzer
cd emotion-analyzer
```

---

## 📦 Step 2: Upload FastAPI Server Code

### 2.1 Copy Files from Your Project

Copy these files from `python_emotion_server/` to your Space directory:

```bash
# From your emotion_analysis_project-main directory
cp python_emotion_server/app.py emotion-analyzer/
cp python_emotion_server/requirements.txt emotion-analyzer/
```

### 2.2 Create Dockerfile

Create `Dockerfile` in your Space directory:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY app.py .

# Expose port
EXPOSE 7860

# Run FastAPI with uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
```

### 2.3 Create README.md

Create `README.md` in your Space directory:

```markdown
---
title: Emotion Analyzer API
emoji: 😊
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Emotion Analysis API

Fast emotion classification API using DistilRoBERTa.

**Model**: j-hartmann/emotion-english-distilroberta-base

**Emotions**: joy, sadness, anger, fear, surprise, disgust, neutral

## Endpoints

- `POST /analyze` - Single text analysis
- `POST /analyze/batch` - Batch text analysis
- `GET /health` - Health check
```

---

## 🚀 Step 3: Deploy to HuggingFace

### 3.1 Push to HuggingFace

```bash
cd emotion-analyzer
git add .
git commit -m "Add FastAPI emotion analyzer"
git push
```

### 3.2 Wait for Build

1. Go to your Space: `https://huggingface.co/spaces/YOUR-USERNAME/emotion-analyzer`
2. Wait 3-5 minutes for build to complete
3. Space status will show **"Running"** when ready

---

## 🔗 Step 4: Configure Your Next.js App

### 4.1 Get Your Space URL

Your Space URL format:

```
https://YOUR-USERNAME-emotion-analyzer.hf.space
```

Example: `https://johnsmith-emotion-analyzer.hf.space`

### 4.2 Update .env.local

Add to your `.env.local` file:

```bash
# HuggingFace Space URL (production)
HF_SPACE_URL=https://YOUR-USERNAME-emotion-analyzer.hf.space
```

**Important**: Replace `YOUR-USERNAME` with your actual HuggingFace username!

### 4.3 Restart Your Next.js App

```bash
npm run dev
```

---

## ✅ Step 5: Test Your Setup

### 5.1 Test Space Directly

Open in browser:

```
https://YOUR-USERNAME-emotion-analyzer.hf.space/health
```

Should return:

```json
{ "status": "healthy" }
```

### 5.2 Test Single Analysis

```bash
curl -X POST https://YOUR-USERNAME-emotion-analyzer.hf.space/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this product!"}'
```

Expected response:

```json
{ "label": "joy", "score": 0.95 }
```

### 5.3 Test from Your App

1. Login to your Next.js app
2. Select a video with comments
3. Click "Analyze Comments"
4. Check browser console for logs:
   - ✅ Should NOT see "HF Space unavailable"
   - ✅ Should see fast loading (2-5 seconds)

---

## 🔧 Troubleshooting

### Issue: Space Shows "Building" Forever

**Solution**: Check build logs in HuggingFace Space → "Logs" tab

Common issues:

- Missing dependencies in requirements.txt
- Python version mismatch
- Port not set to 7860

### Issue: "HF Space unavailable" in Console

**Solutions**:

1. Check HF_SPACE_URL in .env.local (no trailing slash!)
2. Verify Space is "Running" (not "Sleeping")
3. Test `/health` endpoint in browser
4. Check CORS settings (app.py includes CORS middleware)

### Issue: Space Goes to Sleep

**Problem**: Free HuggingFace Spaces sleep after inactivity

**Solutions**:

- **Option 1** (Free): Accept 15-30s cold start on first request
- **Option 2** (Paid): Upgrade to persistent Space ($10/month)
- **Option 3** (Workaround): Ping `/health` every 5 minutes with cron job

### Issue: Still Slow Performance

**Checklist**:

1. ✅ HF_SPACE_URL is set correctly
2. ✅ Space status is "Running"
3. ✅ App restarted after env change
4. ✅ Browser cache cleared
5. ✅ Check Network tab: requests going to .hf.space domain

---

## 📊 Performance Comparison

| Method        | 20 Comments | 100 Comments | Cost                   |
| ------------- | ----------- | ------------ | ---------------------- |
| Local Server  | 0.5s        | 2s           | Free (dev only)        |
| **HF Space**  | **2-5s**    | **10-20s**   | **Free**               |
| HF API        | 15-30s      | 60-120s      | Free (slow)            |
| HF Persistent | 2-5s        | 10-20s       | $10/mo (no cold start) |

**Recommendation**: Use HF Space (free tier) for production. Upgrade to persistent if cold starts are unacceptable.

---

## 🎯 Expected Results

**Before** (using HF API):

```
Loading emotion analysis... (30+ seconds)
```

**After** (using HF Space):

```
Loading emotion analysis... (3-5 seconds) ✅
```

**With Local Server** (development):

```
Loading emotion analysis... (<1 second) ⚡
```

---

## 🔄 Deployment Priority

The app now tries endpoints in this order:

1. **Local Server** (`http://127.0.0.1:8000`) - Dev only
2. **HF Space** (`HF_SPACE_URL`) - **PRIMARY FOR PRODUCTION**
3. **HF API** (`router.huggingface.co`) - Emergency fallback (slow)

Make sure to set `HF_SPACE_URL` in production!

---

## 🆘 Need Help?

- HuggingFace Spaces Docs: https://huggingface.co/docs/hub/spaces
- FastAPI Docs: https://fastapi.tiangolo.com
- Model Card: https://huggingface.co/j-hartmann/emotion-english-distilroberta-base

---

## 📝 Quick Reference

```bash
# Your Space URLs
Space Dashboard: https://huggingface.co/spaces/YOUR-USERNAME/emotion-analyzer
API Endpoint: https://YOUR-USERNAME-emotion-analyzer.hf.space
Health Check: https://YOUR-USERNAME-emotion-analyzer.hf.space/health

# Environment Variable
HF_SPACE_URL=https://YOUR-USERNAME-emotion-analyzer.hf.space
```

**Remember**: No trailing slash in HF_SPACE_URL!
