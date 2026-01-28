#!/usr/bin/env python3
"""
FastAPI Emotion Analysis Server
Provides fast local emotion classification using Hugging Face transformers
Model: j-hartmann/emotion-english-distilroberta-base
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Emotion Analysis API")

# Load emotion classification model
logger.info("Loading emotion classification model...")
try:
    classifier = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        device=-1  # Use CPU; set to 0 for GPU if available
    )
    logger.info("Model loaded successfully!")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    raise

class TextInput(BaseModel):
    text: str

class EmotionOutput(BaseModel):
    label: str
    score: float

@app.post("/analyze", response_model=EmotionOutput)
async def analyze_emotion(input_data: TextInput):
    """
    Analyze emotion of provided text
    Returns the emotion label and confidence score
    """
    text = input_data.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(text) > 512:
        text = text[:512]
    
    try:
        # Get emotion predictions
        result = classifier(text)
        
        # result is a list with one item: [{"label": "...", "score": ...}]
        top_emotion = result[0]
        
        return EmotionOutput(
            label=top_emotion["label"],
            score=float(top_emotion["score"])
        )
    except Exception as e:
        logger.error(f"Error analyzing emotion: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing emotion: {str(e)}")

@app.post("/analyze/batch")
async def analyze_batch(inputs: list[TextInput]):
    """
    Analyze emotions for multiple texts
    Returns list of emotions and confidence scores
    """
    if not inputs:
        raise HTTPException(status_code=400, detail="Input list cannot be empty")
    
    results = []
    for input_data in inputs:
        text = input_data.text.strip()
        
        if not text:
            results.append({"label": "neutral", "score": 0.0})
            continue
        
        if len(text) > 512:
            text = text[:512]
        
        try:
            result = classifier(text)
            top_emotion = result[0]
            results.append({
                "label": top_emotion["label"],
                "score": float(top_emotion["score"])
            })
        except Exception as e:
            logger.error(f"Error analyzing emotion: {e}")
            results.append({"label": "neutral", "score": 0.0})
    
    return {"results": results}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "model": "j-hartmann/emotion-english-distilroberta-base"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Emotion Analysis Server on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
