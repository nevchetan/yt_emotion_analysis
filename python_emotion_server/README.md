# Local Emotion Analysis Server

Fast local emotion analysis using Hugging Face transformers.

## Quick Setup (5 minutes)

### 1. Install Python 3.8+

Download from: https://www.python.org/downloads/

### 2. Create Virtual Environment

```bash
cd python_emotion_server
python -m venv venv
```

### 3. Activate Virtual Environment

**Windows:**

```bash
venv\Scripts\activate
```

**Mac/Linux:**

```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

This will download the emotion model (~500MB) - takes 2-5 minutes

### 5. Start Server

```bash
python app.py
```

Server runs on: http://127.0.0.1:8000

## Usage

The Next.js app will automatically connect to this server.

**Test it manually:**

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this product!"}'
```

**Response:**

```json
{
  "label": "joy",
  "score": 0.95
}
```

## Performance

- **Single text**: ~10-50ms
- **Batch (20 texts)**: ~200-500ms
- **No timeouts**: Guaranteed fast results

## Troubleshooting

**Port already in use:**

```bash
# Change port in app.py, line 113:
uvicorn.run(app, host="127.0.0.1", port=8001)
```

**Model download fails:**

- Check internet connection
- Try again (downloads resume automatically)
- Use VPN if blocked in your region

**Memory error:**

- Close other applications
- Requires ~2GB RAM minimum
