# Indian Brands: Quick Pipeline

This guide lets you add Indian brands quickly with documentation and repeatable scripts.

## Goal

- Scrape product names and prices fast.
- Map official size charts from brand sources.
- Build one module file used directly by the app.

## Product-Only Mode (No Size Charts Yet)

Use this when you only want products now.

1. Scrape one or more listing pages.
2. Build products-only module.
3. Restart app to see products.

Commands:

npm run data:scrape -- --url "https://example.com/category/tops" --brandId yourbrand --category top --currency INR --out data/scraped/yourbrand-top.json
npm run data:scrape -- --url "https://example.com/category/bottoms" --brandId yourbrand --category bottom --currency INR --out data/scraped/yourbrand-bottom.json
npm run data:build-products-only

Notes:

- This generates indianBrandsData.js with INDIAN_BRANDS = [] and only INDIAN_PRODUCTS.
- You can add size charts later without redoing product scraping.

## Files Added

- scripts/scrapeListings.mjs
- scripts/buildIndianDataModule.mjs
- scripts/buildIndianProductsOnly.mjs
- data/manual/indianBrands.template.json
- indianBrandsData.js

## Step 1: Scrape product listings

Run one command per source page.

Example:

node scripts/scrapeListings.mjs --url "https://www.asos.com/men/t-shirts-vests/cat/?cid=7616" --brandId samplebrand --category top --currency INR --out data/scraped/samplebrand-top.json

Output format:

- brandId
- category
- products[] with name and price

## Step 2: Build manual brand payload

Open data/manual/indianBrands.template.json and replace template values.

Required sections:

- brands[] with official chart values and source URL
- products[] with app-ready product objects

Tip:

- Keep top and bottom chart entries complete for S, M, L, XL.
- Keep category only top or bottom.

## Step 3: Generate app module

node scripts/buildIndianDataModule.mjs data/manual/indianBrands.template.json indianBrandsData.js

This updates indianBrandsData.js used by the app.

## Step 4: Verify in app

- Restart Expo if needed.
- Check predictor recommendations and product listing screens.

## Quality checklist

- Brand source URL added
- Price values checked against source
- Size chart copied from official brand guide
- No guessed chest or waist ranges

## Fast timeline

- 1 brand with products + chart: 20 to 35 minutes
- 3 brands end-to-end: 1.5 to 3 hours
