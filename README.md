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

## Style AI Backend

Create and activate a Python environment, then run:

pip install -r ai_backend/requirements.txt
uvicorn ai_backend.app:app --reload --host 0.0.0.0 --port 8000

Optional VLM mode (open-source caption model):

pip install -r ai_backend/requirements-vlm.txt

Check backend status:

curl http://127.0.0.1:8000/model-status
