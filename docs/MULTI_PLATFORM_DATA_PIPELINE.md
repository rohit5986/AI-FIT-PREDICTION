# Multi-Platform Product Data Pipeline

This document explains the complete scraping and data generation flow used by this project, including platform support, file formats, commands, and troubleshooting.

## What This Pipeline Does

- Scrapes product listings from supported ecommerce category/listing pages.
- Extracts name, price, product URL, and image URL.
- Normalizes output into JSON files under data/scraped.
- Builds a single app-ready module file: indianBrandsData.js.
- Keeps platform metadata so products from different marketplaces can coexist.

## Current Flow

1. Scrape one or more listing pages using scripts/scrapeListings.mjs.
2. Output one JSON file per source page inside data/scraped.
3. Build app product module using scripts/buildIndianProductsOnly.mjs.
4. App reads products from indianBrandsData.js through productsData.js.

## Key Files

- scripts/scrapeListings.mjs: Multi-platform scraping and extraction.
- scripts/buildIndianProductsOnly.mjs: Converts scraped JSON files into INDIAN_PRODUCTS.
- scripts/refreshScrapedFiles.mjs: Re-scrapes every existing JSON file in data/scraped using stored metadata.
- data/scraped/*.json: Raw normalized scrape outputs.
- indianBrandsData.js: Auto-generated product module consumed by the app.
- ProductImage.js: Renders imageUrl with fallback if remote image fails.
- docs/INDIAN_BRANDS_QUICK_START.md: Short usage guide.

## NPM Commands

- npm run data:scrape
- npm run data:refresh-scraped
- npm run data:build-products-only

### Scrape One Source

npm run data:scrape -- --url "https://www.myntra.com/raymond-men-shirts" --brandId raymond --category top --currency INR --out data/scraped/raymond-top.json --limit 30

### Refresh All Existing Sources

npm run data:refresh-scraped

### Rebuild App Product Module

npm run data:build-products-only

## Platform Detection

scripts/scrapeListings.mjs auto-detects platform from URL hostname.

Current identifiers:

- myntra
- ajio
- tatacliq
- bewakoof
- generic

Platform is saved in each scraped JSON and propagated into generated products.

## Extraction Strategy by Platform

### Myntra

- Reads window.__myx payload.
- Uses product fields like productName, price, landingPageUrl, searchImage/defaultImage.

### Ajio

- Best-effort parse from window.__PRELOADED_STATE__.
- In many environments this URL returns 403 due anti-bot protections.

### Bewakoof

- Reads __NEXT_DATA__ payload.
- Extracts from props.pageProps.data.products.
- Maps fields such as name, sp/price, url, display_image.

### Tata CLiQ

- Uses generic and structured-data fallbacks where available.
- Some pages may return zero listing products depending on page payload shape.

### Generic fallback

- JSON-LD Product blocks.
- Name/price regex fallback.
- Anchor + price pattern fallback.

## URL and Image Normalization

- Relative URLs are resolved using source page base URL.
- Protocol-relative URLs are converted to https.
- http URLs are upgraded to https.
- Image URL is selected from multiple candidate fields.

## Scraped JSON Schema

Example shape in data/scraped:

{
  "brandId": "raymond",
  "category": "top",
  "platform": "myntra",
  "url": "https://www.myntra.com/raymond-men-shirts",
  "currency": "INR",
  "scrapedAt": "2026-03-17T17:00:00.000Z",
  "productCount": 30,
  "products": [
    {
      "name": "Product name",
      "price": 1299,
      "source": "https://...",
      "imageUrl": "https://..."
    }
  ]
}

## Generated Product Schema

Example shape in indianBrandsData.js:

{
  "id": "raymond-top-001",
  "brandId": "raymond",
  "platform": "myntra",
  "name": "Product name",
  "category": "top",
  "price": 1299,
  "originalPrice": 1624,
  "image": "👕",
  "imageUrl": "https://...",
  "source": "https://...",
  "sizes": ["S", "M", "L", "XL"],
  "colors": ["Black", "White", "Navy"],
  "details": {
    "material": "To be updated",
    "fit": "Regular",
    "care": "Machine wash",
    "inStock": 60
  }
}

## Deduplication Rules

During scraping:

- Deduped by lowercased name + price.

During final build:

- Deduped by brandId + platform + lowercased name + category.

This prevents collisions when the same product name exists across marketplaces.

## Image Rendering in App

ProductImage.js is used by listing/detail/cart/wishlist/order screens.

Behavior:

- If imageUrl is valid and loads, show remote image.
- If image fails or is missing, show fallback emoji.

## End-to-End Example

1. Scrape Myntra

npm run data:scrape -- --url "https://www.myntra.com/raymond-men-shirts" --brandId raymond --category top --out data/scraped/raymond-top.json

2. Scrape Bewakoof

npm run data:scrape -- --url "https://www.bewakoof.com/men-t-shirts" --brandId bewakoof-menswear --category top --out data/scraped/bewakoof-menswear-top.json

3. Build module

npm run data:build-products-only

4. Start app

npm start

## Troubleshooting

### Request failed: 403 Forbidden

Cause:

- Marketplace anti-bot protection.

What to do:

- Try another platform or category URL.
- Try later (temporary blocks can happen).
- Use manual JSON fallback for blocked sites.

### Saved 0 products

Cause:

- Page content not exposed in fetch response.
- Source URL not a listing page.

What to do:

- Validate URL in browser.
- Use a category/search URL with visible product grid.
- Add platform-specific extractor if payload format differs.

### Images not showing

Cause:

- Broken imageUrl or blocked media host.

What to do:

- Check imageUrl in scraped JSON.
- Verify URL opens directly in browser.
- Fallback emoji should still appear.

## Manual Fallback for Blocked Platforms

When a platform blocks scraping, create a manual JSON in data/scraped using the same schema:

- brandId
- category
- platform
- url
- currency
- products with name, price, source, imageUrl

Then run:

npm run data:build-products-only

## Extending to a New Platform

1. Add platform mapping in detectPlatform in scripts/scrapeListings.mjs.
2. Add extractor function for that platform payload.
3. Include extractor in combined collection list.
4. Add platform inference in scripts/buildIndianProductsOnly.mjs if needed.
5. Add examples and notes to docs.

## Operational Notes

- Scraped marketplace content can change over time, causing different products/prices between runs.
- Always rebuild indianBrandsData.js after adding or changing files in data/scraped.
- Keep one source file per page/platform for easier refresh and debugging.
