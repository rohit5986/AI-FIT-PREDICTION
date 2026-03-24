import { INDIAN_PRODUCTS } from './indianBrandsData';

const BRAND_ID_MAP = {
  biba: 'biba',
  'allen solly': 'allen-solly',
  bewakoof: 'bewakoof-menswear',
  fabindia: 'fabindia',
  'h&m': 'hm',
  hm: 'hm'
};

const BRAND_NAME_MAP = {
  biba: 'BIBA',
  'allen-solly': 'Allen Solly',
  'bewakoof-menswear': 'Bewakoof',
  fabindia: 'Fabindia',
  hm: 'H&M'
};

const FRACTION_MAP = {
  '1/4': '.25',
  '1/2': '.5',
  '3/4': '.75',
  '¼': '.25',
  '½': '.5',
  '¾': '.75'
};

const PRODUCT_MAP = INDIAN_PRODUCTS.reduce((acc, product) => {
  const key = String(product?.brandId || '').trim().toLowerCase();
  if (!key) return acc;
  if (!acc[key]) acc[key] = [];
  acc[key].push(product);
  return acc;
}, {});

const SIZE_ALIASES = {
  xxs: 'XXS',
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
  xxl: 'XXL',
  xxxl: '3XL',
  '2xl': 'XXL',
  '3xl': '3XL',
  '4xl': '4XL',
  '5xl': '5XL'
};

const toCleanString = (value) => String(value ?? '').trim();

const normalizeBrandKey = (value) =>
  toCleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9&\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const isRowEmpty = (row) => !Array.isArray(row) || row.every((cell) => !toCleanString(cell));

const normalizeHeader = (value) =>
  toCleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const replaceFractions = (value) => {
  let text = value;
  Object.entries(FRACTION_MAP).forEach(([key, replacement]) => {
    text = text.replaceAll(key, replacement);
  });
  return text;
};

const normalizeUnitValue = (raw) => {
  const text = replaceFractions(toCleanString(raw)).toLowerCase().replace(/,/g, '');
  if (!text) return null;

  const hasCm = /cm/.test(text);
  const hasMeter = /(^|\s)m($|\s)|\d\s*m$/.test(text) && !hasCm;
  const numbers = text.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return null;

  const parsed = Number(numbers[0]);
  if (!Number.isFinite(parsed)) return null;
  if (hasMeter || (parsed <= 3 && /\bm\b/.test(text))) {
    return parsed * 100;
  }
  return parsed;
};

const parseRange = (raw) => {
  const text = replaceFractions(toCleanString(raw)).toLowerCase();
  if (!text) return null;

  const parts = text.split('-').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const left = normalizeUnitValue(parts[0]);
    const right = normalizeUnitValue(parts[1]);
    if (Number.isFinite(left) && Number.isFinite(right)) {
      return left <= right ? [left, right] : [right, left];
    }
  }

  const single = normalizeUnitValue(text);
  if (!Number.isFinite(single)) return null;
  return [single, single];
};

const normalizeSizeToken = (token) => {
  const clean = toCleanString(token).toLowerCase().replace(/\s+/g, '');
  if (!clean) return '';
  if (SIZE_ALIASES[clean]) return SIZE_ALIASES[clean];

  if (/^\d{2}$/.test(clean)) {
    const value = Number(clean);
    if (value <= 28) return 'XS';
    if (value <= 32) return 'S';
    if (value <= 34) return 'M';
    if (value <= 36) return 'L';
    if (value <= 38) return 'XL';
    if (value <= 40) return 'XXL';
    return '3XL';
  }

  return '';
};

const detectCategory = (text) => {
  const lower = toCleanString(text).toLowerCase();
  if (!lower) return '';

  const bottomSignals = ['bottom', 'pant', 'pants', 'trouser', 'jeans', 'salwar'];
  if (bottomSignals.some((signal) => lower.includes(signal))) return 'bottom';

  const topSignals = ['top', 'shirt', 'kurti', 'kurta', 'dress', 'suit', 'blazer', 'jacket'];
  if (topSignals.some((signal) => lower.includes(signal))) return 'top';

  return '';
};

const inferWeightRange = (waistRange, size) => {
  const [minW, maxW] = Array.isArray(waistRange) ? waistRange : [78, 82];
  const waistMid = (Number(minW) + Number(maxW)) / 2;
  const baseMin = Math.max(38, Math.round(waistMid * 0.8 - 5));

  let spread = 10;
  if (['XXL', '3XL', '4XL', '5XL'].includes(size)) spread = 12;
  if (['XXS', 'XS'].includes(size)) spread = 8;

  return [baseMin, baseMin + spread];
};

const findColumn = (headers, patterns) => {
  if (!Array.isArray(headers)) return -1;
  return headers.findIndex((header) => patterns.some((pattern) => header.includes(pattern)));
};

const isLikelyBrandRow = (row) => {
  const nonEmpty = row.map(toCleanString).filter(Boolean);
  if (nonEmpty.length !== 1) return false;
  const only = normalizeBrandKey(nonEmpty[0]);
  return Boolean(BRAND_ID_MAP[only]);
};

const getBrandTemplate = (id) => ({
  id,
  name: BRAND_NAME_MAP[id] || id,
  description: 'Imported from size chart file',
  priceRange: '₹999-₹4999',
  quality: 4.0,
  chart: {
    top: [],
    bottom: []
  },
  products: PRODUCT_MAP[id] || []
});

const dedupeEntriesBySize = (entries) => {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = String(entry?.size || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const parseBrandsFromSpreadsheetRows = (rows) => {
  const warnings = [];
  const brandsById = new Map();

  let currentBrandId = '';
  let currentCategory = '';
  let currentHeaders = null;

  const allRows = Array.isArray(rows) ? rows : [];

  allRows.forEach((rawRow) => {
    const row = Array.isArray(rawRow) ? rawRow : [];
    const cleanedRow = row.map(toCleanString);

    if (isRowEmpty(cleanedRow)) {
      currentHeaders = null;
      return;
    }

    if (isLikelyBrandRow(cleanedRow)) {
      const brandKey = normalizeBrandKey(cleanedRow.find((cell) => toCleanString(cell)));
      const mappedId = BRAND_ID_MAP[brandKey];
      if (mappedId) {
        currentBrandId = mappedId;
        currentCategory = '';
        currentHeaders = null;
        if (!brandsById.has(mappedId)) {
          brandsById.set(mappedId, getBrandTemplate(mappedId));
        }
      }
      return;
    }

    const rowJoined = cleanedRow.join(' ').toLowerCase();
    const detectedCategory = detectCategory(rowJoined);
    if (detectedCategory) {
      currentCategory = detectedCategory;
      currentHeaders = null;
    }

    const normalizedHeaders = cleanedRow.map(normalizeHeader);
    if (normalizedHeaders.some((header) => header.includes('size'))) {
      currentHeaders = normalizedHeaders;
      return;
    }

    if (!currentBrandId || !currentCategory || !Array.isArray(currentHeaders)) return;

    const brand = brandsById.get(currentBrandId) || getBrandTemplate(currentBrandId);
    if (!brandsById.has(currentBrandId)) brandsById.set(currentBrandId, brand);

    const sizeStandardIndex = findColumn(currentHeaders, ['standard size']);
    const sizeIndex = findColumn(currentHeaders, ['size', 'fabindia size']);
    const chestIndex = findColumn(currentHeaders, ['to fit bust', 'bust', 'chest', 'to fit chest']);
    const waistIndex = findColumn(currentHeaders, ['to fit waist', 'waist']);
    const weightIndex = findColumn(currentHeaders, ['weight']);

    const sizeCandidates = [];
    if (sizeStandardIndex >= 0) sizeCandidates.push(cleanedRow[sizeStandardIndex]);
    if (sizeIndex >= 0) sizeCandidates.push(cleanedRow[sizeIndex]);

    cleanedRow.forEach((cell) => {
      if (!cell) return;
      if (normalizeSizeToken(cell)) sizeCandidates.push(cell);
    });

    const size = sizeCandidates.map(normalizeSizeToken).find(Boolean);
    if (!size) return;

    const chestRange = chestIndex >= 0 ? parseRange(cleanedRow[chestIndex]) : null;
    const waistRange = waistIndex >= 0 ? parseRange(cleanedRow[waistIndex]) : null;
    const weightRange = weightIndex >= 0 ? parseRange(cleanedRow[weightIndex]) : null;

    if (currentCategory === 'top') {
      if (!Array.isArray(chestRange) || !Array.isArray(waistRange)) return;
      brand.chart.top.push({ size, chest: chestRange, waist: waistRange });
      return;
    }

    if (!Array.isArray(waistRange)) return;
    brand.chart.bottom.push({
      size,
      waist: waistRange,
      weight: Array.isArray(weightRange) ? weightRange : inferWeightRange(waistRange, size)
    });
  });

  const brands = Array.from(brandsById.values())
    .map((brand) => ({
      ...brand,
      chart: {
        top: dedupeEntriesBySize(brand.chart.top),
        bottom: dedupeEntriesBySize(brand.chart.bottom)
      }
    }))
    .filter((brand) => {
      const hasTop = Array.isArray(brand.chart.top) && brand.chart.top.length > 0;
      const hasBottom = Array.isArray(brand.chart.bottom) && brand.chart.bottom.length > 0;
      return hasTop && hasBottom;
    });

  if (brands.length === 0) {
    warnings.push('No valid brands were parsed from the file.');
  }

  return { brands, warnings };
};
