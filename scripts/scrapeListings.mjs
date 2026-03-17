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
  console.log('The scraper auto-detects platform from URL (myntra, ajio, tatacliq, bewakoof, generic).');
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

function normalizeUrl(value, base = '') {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/^http:\/\//i, 'https://');
    }

    if (trimmed.startsWith('//')) return `https:${trimmed}`;

    if (!base) return '';
    const normalizedBase = base.replace(/\/+$/, '');
    return new URL(trimmed, `${normalizedBase}/`).toString();
  } catch {
    return '';
  }
}

function detectPlatform(urlValue) {
  let hostname = '';
  try {
    hostname = new URL(urlValue).hostname.toLowerCase();
  } catch {
    return 'generic';
  }

  if (hostname.includes('myntra.com')) return 'myntra';
  if (hostname.includes('ajio.com')) return 'ajio';
  if (hostname.includes('tatacliq.com')) return 'tatacliq';
  if (hostname.includes('bewakoof.com')) return 'bewakoof';
  return 'generic';
}

function getUrlBases(urlValue) {
  try {
    const parsed = new URL(urlValue);
    const baseUrl = `${parsed.protocol}//${parsed.host}`;
    return { baseUrl, assetBaseUrl: baseUrl };
  } catch {
    return { baseUrl: '', assetBaseUrl: '' };
  }
}

function pickFirstString(values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function pickPriceValue(values) {
  for (const value of values) {
    const numeric = toNumber(value);
    if (numeric !== null) return numeric;
  }
  return null;
}

function pickImageUrl(item, assetBaseUrl) {
  if (!item || typeof item !== 'object') return '';

  const nestedImage = Array.isArray(item.images)
    ? item.images[0]
    : item.images?.default
      ? item.images.default
      : item.images;

  const imageCandidates = [
    item.searchImage,
    item.defaultImage,
    item.imageUrl,
    item.imageURL,
    item.imageSrc,
    item.productImage,
    item.thumbnail,
    nestedImage
  ];

  for (const candidate of imageCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return normalizeUrl(candidate, assetBaseUrl);
    }
  }

  return '';
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

function collectFromWindowMyx(html, baseUrl, assetBaseUrl) {
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
      const source = normalizeUrl(item?.landingPageUrl, baseUrl);
      const imageUrl = pickImageUrl(item, assetBaseUrl);
      if (!name || price === null) return null;
      return { name, price, source, imageUrl };
    })
    .filter(Boolean);
}

function collectFromJsonLd(html, baseUrl, assetBaseUrl) {
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
          const imageNode = Array.isArray(node.image) ? node.image[0] : node.image;
          results.push({
            name: String(node.name),
            price,
            source: normalizeUrl(node.url || '', baseUrl),
            imageUrl: normalizeUrl(String(imageNode || ''), assetBaseUrl)
          });
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
    results.push({ name, price, source: '', imageUrl: '' });
  }
  return results;
}

function collectFromAnchorPricePattern(html, baseUrl) {
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
    results.push({ name, price, source: normalizeUrl(href, baseUrl), imageUrl: '' });
  }
  return results;
}

function scoreProductCandidate(item) {
  let score = 0;
  if (item?.source) score += 1;
  if (item?.imageUrl) score += 1;
  if (item?.name && item.name.length > 14) score += 1;
  return score;
}

function collectFromAjioPreloadedState(html, baseUrl, assetBaseUrl) {
  const marker = 'window.__PRELOADED_STATE__ = ';
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return [];

  const jsonStart = markerIndex + marker.length;
  const jsonText = extractBalancedJson(html, jsonStart);
  if (!jsonText) return [];

  const parsed = safeJsonParse(jsonText);
  if (!parsed || typeof parsed !== 'object') return [];

  const results = [];
  const queue = [parsed];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;

    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }

    if (typeof node !== 'object') continue;

    const name = cleanText(
      pickFirstString([node.name, node.productName, node.title, node.displayName])
    );
    const price = pickPriceValue([
      node.discountedPrice,
      node.offerPrice,
      node.finalPrice,
      node.salePrice,
      node.sellingPrice,
      node.price,
      node.currentPrice,
      node.value
    ]);

    const source = normalizeUrl(
      pickFirstString([node.pdpUrl, node.url, node.productUrl, node.href, node.landingPageUrl]),
      baseUrl
    );
    const imageUrl = pickImageUrl(node, assetBaseUrl);

    if (name && price !== null && price > 0 && price < 500000) {
      results.push({ name, price, source, imageUrl });
    }

    Object.values(node).forEach((child) => {
      if (child && (typeof child === 'object' || Array.isArray(child))) {
        queue.push(child);
      }
    });
  }

  const deduped = dedupeProducts(results);
  return deduped
    .sort((a, b) => scoreProductCandidate(b) - scoreProductCandidate(a))
    .slice(0, 300);
}

function collectFromNextData(html, baseUrl, assetBaseUrl, platform) {
  const match = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return [];

  const parsed = safeJsonParse(match[1]);
  if (!parsed || typeof parsed !== 'object') return [];

  const results = [];
  const root = parsed?.props?.pageProps || parsed;
  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;

    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }

    if (typeof node !== 'object') continue;

    const name = cleanText(
      pickFirstString([
        node.name,
        node.productName,
        node.product_name,
        node.displayName,
        node.display_name,
        node.title,
        node.product
      ])
    );
    const price = pickPriceValue([
      node.sp,
      node.selling_price,
      node.discounted_price,
      node.offer_price,
      node.final_price,
      node.price,
      node.salePrice,
      node.mrp
    ]);

    let source = normalizeUrl(
      pickFirstString([
        node.url,
        node.slug,
        node.href,
        node.link,
        node.product_url,
        node.productUrl,
        node.pdpUrl,
        node.plink
      ]),
      baseUrl
    );

    if (platform === 'bewakoof' && source && !/\/p\//.test(source)) {
      const slug = source.split('/').pop();
      source = normalizeUrl(`/p/${slug}`, baseUrl);
    }

    let imageUrl = pickImageUrl(node, assetBaseUrl);
    if (platform === 'bewakoof' && imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      imageUrl = normalizeUrl(imageUrl, 'https://images.bewakoof.com/t1080');
    }

    if (name && price !== null && price > 0 && price < 500000) {
      results.push({ name, price, source, imageUrl });
    }

    Object.values(node).forEach((child) => {
      if (child && (typeof child === 'object' || Array.isArray(child))) {
        queue.push(child);
      }
    });
  }

  const deduped = dedupeProducts(results);
  return deduped
    .sort((a, b) => scoreProductCandidate(b) - scoreProductCandidate(a))
    .slice(0, 300);
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

async function fetchHtml(url) {
  const headerProfiles = [
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: url
    },
    {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/html',
      'Accept-Language': 'en-US,en;q=0.8'
    },
    {
      'User-Agent': 'Wget/1.21',
      Accept: '*/*'
    }
  ];

  let lastStatus = 0;
  let lastStatusText = '';

  for (const headers of headerProfiles) {
    const response = await fetch(url, { headers });
    if (response.ok) {
      return response.text();
    }
    lastStatus = response.status;
    lastStatusText = response.statusText;

    if (![401, 403, 405, 406, 408, 429].includes(response.status)) {
      break;
    }
  }

  throw new Error(`Request failed: ${lastStatus} ${lastStatusText}`);
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
  const platform = detectPlatform(url);
  const { baseUrl, assetBaseUrl } = getUrlBases(url);

  let html = '';
  try {
    html = await fetchHtml(url);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const combined = dedupeProducts([
    ...(platform === 'myntra' ? collectFromWindowMyx(html, baseUrl, 'https://assets.myntassets.com') : []),
    ...(platform === 'ajio' ? collectFromAjioPreloadedState(html, baseUrl, assetBaseUrl) : []),
    ...collectFromNextData(html, baseUrl, assetBaseUrl, platform),
    ...collectFromJsonLd(html, baseUrl, assetBaseUrl),
    ...collectFromNamePricePairs(html),
    ...collectFromAnchorPricePattern(html, baseUrl)
  ]).slice(0, Math.max(1, limit));

  const payload = {
    brandId,
    category,
    platform,
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
