# AI-FIT-PREDICTION

Fit prediction and product discovery app with multi-platform product ingestion.

## Documentation

- Quick start: docs/INDIAN_BRANDS_QUICK_START.md
- Full pipeline reference: docs/MULTI_PLATFORM_DATA_PIPELINE.md
- Style AI setup: docs/STYLE_AI_ASSISTANT.md

## Product Data Commands

- Scrape one listing page:
	npm run data:scrape -- --url "https://www.myntra.com/raymond-men-shirts" --brandId raymond --category top --out data/scraped/raymond-top.json

- Refresh all existing scraped files:
	npm run data:refresh-scraped

- Rebuild app product module:
	npm run data:build-products-only

## Run App

npm start

## Firebase Authentication Setup

This app now uses Firebase Email/Password authentication.

1. In Firebase Console, create/select your project.
2. Open Authentication -> Sign-in method -> enable Email/Password.
3. Copy `.env.example` to `.env`.
4. Fill all `EXPO_PUBLIC_FIREBASE_*` values in `.env`.
5. Restart Expo with cache clear:

npx expo start --clear

## Style AI Backend

Create and activate a Python environment, then run from project root:

pip install -r ai_backend/requirements.txt
uvicorn ai_backend.app:app --reload --host 0.0.0.0 --port 8000

If you are inside the `ai_backend` folder, use these equivalents instead:

pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000

Optional VLM mode (open-source caption model):

From project root:

pip install -r ai_backend/requirements-vlm.txt

From inside `ai_backend`:

pip install -r requirements-vlm.txt

Check backend status:

curl http://127.0.0.1:8000/model-status

Troubleshooting: `ModuleNotFoundError: No module named 'ai_backend'`

- Cause: Running `uvicorn ai_backend.app:app` while current directory is already `ai_backend`.
- Fix option 1: Go to project root and run `uvicorn ai_backend.app:app --reload --host 0.0.0.0 --port 8000`.
- Fix option 2: Stay in `ai_backend` and run `uvicorn app:app --reload --host 0.0.0.0 --port 8000`.

## Clothing AI Chatbot

The app now includes chat inside the `Style AI` page.
After image analysis completes, users can continue the conversation in-page for clothing Q&A and outfit review.

- Endpoint: `POST /chatbot`
- Use cases: size advice, color matching, occasion styling, outfit review, and fabric care.

Example payload:

{
	"message": "Review my outfit: navy shirt with beige chinos",
	"context": {
		"measurements": { "chest": 100, "waist": 84 },
		"preferred_brands": ["allen-solly"],
		"audience": "men"
	}
}

## Deploy Backend On Vercel

This repo is pre-configured to deploy FastAPI from:

- api/index.py
- vercel.json

### 1) Install Vercel CLI and login

npm i -g vercel
vercel login

### 2) Deploy from project root

vercel

For production:

vercel --prod

### 3) Verify endpoints

https://YOUR-VERCEL-DOMAIN/health
https://YOUR-VERCEL-DOMAIN/model-status
https://YOUR-VERCEL-DOMAIN/chatbot

### 4) Use in app

In Style AI, set Backend URL to:

https://YOUR-VERCEL-DOMAIN

### Notes

- Vercel serverless is best for heuristic/auto fallback mode.
- Full VLM mode with torch/transformers is usually too heavy for serverless limits.
