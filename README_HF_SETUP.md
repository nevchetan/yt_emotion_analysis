# Hugging Face API Setup

## Environment Variables

Create a `.env.local` file in the root directory with:

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
```

## Optional: Custom Model URLs

If you want to use different models, you can override the defaults:

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
HF_MODEL_URL_PRIMARY=https://api-inference.huggingface.co/models/your-model-name
HF_MODEL_URL_FALLBACK=https://api-inference.huggingface.co/models/your-fallback-model
```

## Getting Your API Key

1. Go to https://huggingface.co/settings/tokens
2. Create a new token with **Read** permission
3. Copy the token (starts with `hf_`)
4. Add it to `.env.local`
5. Restart your dev server

## Model Endpoints

The default models are:
- **Primary**: `SamLowe/roberta-base-go_emotions` (better with emojis)
- **Fallback**: `j-hartmann/emotion-english-distilroberta-base` (general emotions)

Both models support emojis and are trained on social media data.

