import fs from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function printUsage() {
  console.log('Usage:');
  console.log('node scripts/scrapeListings.mjs --url <url> --brandId <id> --category <top|bottom> [--currency INR] [--limit 30] [--out data/scraped/file.json]');
}

function cleanText(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[,\s]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractBalancedJson(text, startIndex) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      depth += 1;
      continue;
    }

    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

function collectFromWindowMyx(html) {
  const marker = 'window.__myx = ';
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return [];

  const jsonStart = markerIndex + marker.length;
  const jsonText = extractBalancedJson(html, jsonStart);
  if (!jsonText) return [];

  const parsed = safeJsonParse(jsonText);
  if (!parsed) return [];

  const products = parsed?.searchData?.results?.products;
  if (!Array.isArray(products)) return [];

  return products
    .map((item) => {
      const name = cleanText(String(item?.productName || item?.product || ''));
      const price = toNumber(item?.price);
      const source = item?.landingPageUrl ? `https://www.myntra.com/${String(item.landingPageUrl).replace(/^\//, '')}` : '';
      if (!name || price === null) return null;
      return { name, price, source };
    })
    .filter(Boolean);
}

function collectFromJsonLd(html) {
  const results = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const parsed = safeJsonParse(match[1]);
    if (!parsed) continue;
    const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node)) {
        queue.push(...node);
        continue;
      }
      const type = node['@type'];
      if (type === 'Product' && node.name) {
        const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
        const price = toNumber(offer?.price ?? node.price);
        if (price !== null) {
          results.push({ name: String(node.name), price, source: node.url || '' });
        }
      }
      Object.values(node).forEach((child) => {
        if (child && (typeof child === 'object' || Array.isArray(child))) {
          queue.push(child);
        }
      });
    }
  }
  return results;
}

function collectFromNamePricePairs(html) {
  const results = [];
  const pattern = /["']name["']\s*:\s*["']([^"']{5,180})["'][\s\S]{0,300}?["']price["']\s*:\s*["']?([0-9]+(?:\.[0-9]+)?)["']?/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const name = cleanText(match[1]);
    const price = toNumber(match[2]);
    if (!name || price === null) continue;
    results.push({ name, price, source: '' });
  }
  return results;
}

function collectFromAnchorPricePattern(html) {
  const results = [];
  const pattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const href = match[1] || '';
    const text = cleanText(match[2]);
    if (!text || text.length < 6) continue;

    const priced = text.match(/^(.*?),\s*(?:Original price[^,]*,\s*)?(?:current\s+price\s*)?Price\s*[Rs.$£₹]*\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (!priced) continue;

    const name = cleanText(priced[1]);
    const price = toNumber(priced[2]);
    if (!name || price === null) continue;
    results.push({ name, price, source: href });
  }
  return results;
}

function dedupeProducts(items) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const key = `${item.name.toLowerCase()}::${item.price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

async function main() {
  const args = parseArgs(process.argv);
  const url = args.url;
  const brandId = args.brandId;
  const category = args.category;

  if (!url || !brandId || !category) {
    printUsage();
    process.exit(1);
  }

  if (!['top', 'bottom'].includes(category)) {
    console.error('category must be top or bottom');
    process.exit(1);
  }

  const limit = Number(args.limit || 30);
  const currency = String(args.currency || 'INR');
  const outPath = args.out || `data/scraped/${brandId}-${category}.json`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!response.ok) {
    console.error(`Request failed: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const html = await response.text();

  const combined = dedupeProducts([
    ...collectFromWindowMyx(html),
    ...collectFromJsonLd(html),
    ...collectFromNamePricePairs(html),
    ...collectFromAnchorPricePattern(html)
  ]).slice(0, Math.max(1, limit));

  const payload = {
    brandId,
    category,
    url,
    currency,
    scrapedAt: new Date().toISOString(),
    productCount: combined.length,
    products: combined
  };

  const absoluteOut = path.resolve(outPath);
  await fs.mkdir(path.dirname(absoluteOut), { recursive: true });
  await fs.writeFile(absoluteOut, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Saved ${combined.length} products to ${absoluteOut}`);
}

main().catch((error) => {
  console.error('Scrape failed:', error.message);
  process.exit(1);
});
