"""
Fast Local Emotion Analysis Server
Using Hugging Face transformers with local model
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import uvicorn
from typing import List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Emotion Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
logger.info("Loading emotion classification model...")
try:
    emotion_classifier = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        top_k=None,  # Return all emotion scores
        device=-1,  # Use CPU (change to 0 for GPU)
    )
    logger.info("Model loaded successfully!")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    emotion_classifier = None


class TextRequest(BaseModel):
    text: str


class BatchRequest(BaseModel):
    texts: List[str]


class EmotionResult(BaseModel):
    label: str
    score: float


@app.get("/")
async def root():
    return {
        "message": "Emotion Analysis API",
        "status": "ready" if emotion_classifier else "model not loaded",
        "model": "j-hartmann/emotion-english-distilroberta-base",
    }


@app.post("/analyze", response_model=EmotionResult)
async def analyze_emotion(request: TextRequest):
    """Analyze emotion for a single text"""
    if not emotion_classifier:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        # Clean and truncate text
        text = request.text.strip()[:512]

        # Get predictions
        results = emotion_classifier(text)[0]

        # Find top emotion
        top_emotion = max(results, key=lambda x: x["score"])

        return EmotionResult(
            label=top_emotion["label"].lower(), score=top_emotion["score"]
        )
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/batch", response_model=List[EmotionResult])
async def analyze_emotions_batch(request: BatchRequest):
    """Analyze emotions for multiple texts in batch"""
    if not emotion_classifier:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not request.texts:
        raise HTTPException(status_code=400, detail="Texts list cannot be empty")

    try:
        # Clean and truncate texts
        cleaned_texts = [text.strip()[:512] for text in request.texts if text.strip()]

        if not cleaned_texts:
            raise HTTPException(status_code=400, detail="No valid texts provided")

        # Batch process all texts at once (much faster!)
        all_results = emotion_classifier(cleaned_texts)

        # Extract top emotion for each text
        emotions = []
        for results in all_results:
            top_emotion = max(results, key=lambda x: x["score"])
            emotions.append(
                EmotionResult(
                    label=top_emotion["label"].lower(), score=top_emotion["score"]
                )
            )

        return emotions
    except Exception as e:
        logger.error(f"Batch analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if emotion_classifier else "unhealthy",
        "model_loaded": emotion_classifier is not None,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
