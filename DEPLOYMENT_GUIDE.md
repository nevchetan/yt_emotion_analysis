# Deployment Guide

This guide explains how to deploy **yt-emotion** to production on Vercel or Netlify.

## Prerequisites

- GitHub account with the repository pushed
- Node.js 18+ installed locally
- All environment variables configured

## Environment Variables

### Required Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_secret (generate: openssl rand -base64 32)

# Hugging Face (fallback only)
HUGGINGFACE_API_KEY=your_api_key

# Local Emotion Server (for development only)
LOCAL_EMOTION_API=http://127.0.0.1:8000
```

### For Production

For **Vercel/Netlify deployment**, the local emotion server is **NOT available**. You MUST:

1. Set `HUGGINGFACE_API_KEY` to enable the Hugging Face API fallback
2. Set `NEXTAUTH_URL` to your deployment domain (e.g., `https://yourdomain.vercel.app`)

```env
# Production variables
NEXTAUTH_URL=https://yourdomain.vercel.app
NEXTAUTH_SECRET=your_production_secret
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
HUGGINGFACE_API_KEY=your_hf_api_key
```

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Production-ready codebase"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Connect your GitHub repository
4. Configure project settings:
   - Framework: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Set Environment Variables

In Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add all production environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel domain)
   - `HUGGINGFACE_API_KEY`

### 4. Deploy

Click **Deploy** - Vercel will automatically build and deploy your app!

---

## Deployment to Netlify

### 1. Push to GitHub (same as above)

### 2. Connect to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`

### 3. Set Environment Variables

In Netlify Dashboard:

1. Go to **Site Settings** → **Build & Deploy** → **Environment**
2. Add all production environment variables

### 4. Deploy

Netlify will automatically build and deploy your app on push!

---

## Important Notes

### Local Emotion Server (Development Only)

The `LOCAL_EMOTION_API` environment variable is **for development only**. It allows instant emotion analysis on your machine.

- **Development**: Run Python FastAPI server locally (10-50ms per comment)
- **Production**: Uses Hugging Face API (slower but works without local server)

### Performance Considerations

1. **Hugging Face API**: ~1-3 seconds per comment (slower than local server)
2. **Cold starts**: First request may be slow on Vercel/Netlify (normal)
3. **Caching**: Comments are cached for 5 minutes on client, 10 minutes on CDN

### Troubleshooting

**Issue**: "Failed to analyze emotions"

- **Solution**: Ensure `HUGGINGFACE_API_KEY` is set in environment variables

**Issue**: "Unauthorized" error

- **Solution**: Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Note: Google OAuth redirect URI must match your deployment domain

**Issue**: Slow analysis

- **Solution**: This is expected on production (using HF API). Set up local server for development.

---

## Local Development (Before Deploying)

### Setup

```bash
# Install dependencies
npm install

# Run setup (one-time)
./SETUP_EMOTION_SERVER.bat

# Start emotion server (Terminal 1)
./start_emotion_server.bat

# Start Next.js dev server (Terminal 2)
npm run dev
```

### Testing

1. Navigate to http://localhost:3000
2. Sign in with Google
3. Select a video and analyze comments
4. Verify fast analysis (should complete in 0.5-2 seconds with local server)

---

## GitHub Integration

### Recommended Actions

1. **Add GitHub Secrets** for deployment workflows:

   ```
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   NEXTAUTH_SECRET
   HUGGINGFACE_API_KEY
   ```

2. **Create `.github/workflows/deploy.yml`** (optional CI/CD):
   ```yaml
   name: Deploy to Vercel
   on: [push]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: vercel/action@master
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID}}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID}}
   ```

---

## Production Checklist

- [ ] All environment variables set in Vercel/Netlify
- [ ] `NEXTAUTH_URL` matches your deployment domain
- [ ] `HUGGINGFACE_API_KEY` is valid and has sufficient quota
- [ ] Google OAuth redirect URIs are configured for production domain
- [ ] Build completes without errors (`npm run build`)
- [ ] No console errors in browser developer tools
- [ ] Authentication flows work correctly
- [ ] Comment analysis completes (may be slower than local)

---

## Support

For issues with:

- **Vercel**: [Vercel Docs](https://vercel.com/docs)
- **Netlify**: [Netlify Docs](https://docs.netlify.com)
- **NextAuth**: [NextAuth Docs](https://next-auth.js.org)
- **Hugging Face**: [HF Docs](https://huggingface.co/docs)
