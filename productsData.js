import { INDIAN_PRODUCTS } from './indianBrandsData';

// Enhanced product database with ecommerce data
export const PRODUCTS = [
  ...INDIAN_PRODUCTS
];

// Filter products by category
export const getProductsByCategory = (category) => {
  return PRODUCTS.filter(p => p.category === category);
};

// Get products by brand
export const getProductsByBrand = (brandId) => {
  return PRODUCTS.filter(p => p.brandId === brandId);
};

// Search products
export const searchProducts = (query) => {
  const lowerQuery = query.toLowerCase();
  return PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery)
  );
};

// Get product by ID
export const getProductById = (productId) => {
  return PRODUCTS.find(p => p.id === productId);
};

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTitleCase = (value) => {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const normalizeText = (value) => String(value || '').toLowerCase();

const detectAudienceFromProduct = (product) => {
  const text = normalizeText(`${product?.brandId || ''} ${product?.name || ''}`);

  if (text.includes('unisex')) return 'all';

  const menSignals = [' men ', ' mens ', 'male', 'boys', "men's", 'for men'];
  const womenSignals = [' women ', ' womens ', 'female', 'girls', 'ladies', "women's", 'for women'];

  const hasMenSignal = menSignals.some((signal) => text.includes(signal));
  const hasWomenSignal = womenSignals.some((signal) => text.includes(signal));

  if (hasMenSignal && !hasWomenSignal) return 'men';
  if (hasWomenSignal && !hasMenSignal) return 'women';
  if (hasMenSignal && hasWomenSignal) return 'all';

  return 'unknown';
};

const matchesAudience = (detectedAudience, requestedAudience) => {
  if (requestedAudience === 'all') return true;
  if (detectedAudience === 'all' || detectedAudience === 'unknown') return true;
  return detectedAudience === requestedAudience;
};

const formatBrandNameFromId = (brandId) => {
  const normalized = String(brandId || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b(menswear|womenswear|kidswear|unisex)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return toTitleCase(normalized || String(brandId || '').trim());
};

export const inferRecommendedSize = ({ category, measurements }) => {
  const chest = toNumber(measurements?.chest);
  const waist = toNumber(measurements?.waist);

  const topRules = [
    { max: 86, size: 'XS' },
    { max: 94, size: 'S' },
    { max: 102, size: 'M' },
    { max: 110, size: 'L' },
    { max: 118, size: 'XL' },
    { max: 126, size: 'XXL' }
  ];

  const bottomRules = [
    { max: 72, size: 'XS' },
    { max: 80, size: 'S' },
    { max: 88, size: 'M' },
    { max: 96, size: 'L' },
    { max: 104, size: 'XL' },
    { max: 112, size: 'XXL' }
  ];

  const value = category === 'bottom' ? waist : chest;
  const rules = category === 'bottom' ? bottomRules : topRules;

  if (value === null) return 'M';

  const matched = rules.find((rule) => value <= rule.max);
  return matched ? matched.size : '3XL';
};

const getSizeDistance = (candidateSize, targetSize) => {
  const candidateIndex = SIZE_ORDER.indexOf(String(candidateSize || '').toUpperCase());
  const targetIndex = SIZE_ORDER.indexOf(String(targetSize || '').toUpperCase());

  if (candidateIndex < 0 || targetIndex < 0) return 3;
  return Math.abs(candidateIndex - targetIndex);
};

const getSizeMatchScore = (product, targetSize) => {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  if (sizes.length === 0) return 0.55;

  const normalizedSizes = sizes.map((size) => String(size).toUpperCase());
  const normalizedTarget = String(targetSize || '').toUpperCase();
  if (normalizedSizes.includes(normalizedTarget)) return 1;

  const bestDistance = normalizedSizes
    .map((size) => getSizeDistance(size, normalizedTarget))
    .reduce((best, current) => Math.min(best, current), Number.POSITIVE_INFINITY);

  if (!Number.isFinite(bestDistance)) return 0.55;
  if (bestDistance <= 1) return 0.8;
  if (bestDistance <= 2) return 0.6;
  return 0.4;
};

const scoreProduct = (product, targetSize) => {
  const qualityScore = Math.min(1, (Number(product?.quality) || 0) / 5);
  const ratingScore = Math.min(1, (Number(product?.rating) || 0) / 5);
  const reviewsScore = Math.min(1, (Number(product?.reviews) || 0) / 400);
  const sizeScore = getSizeMatchScore(product, targetSize);

  const originalPrice = Number(product?.originalPrice) || 0;
  const currentPrice = Number(product?.price) || 0;
  const discountScore =
    originalPrice > 0 && currentPrice > 0
      ? Math.max(0, Math.min(1, (originalPrice - currentPrice) / originalPrice))
      : 0;

  return (
    (qualityScore * 0.32)
    + (ratingScore * 0.28)
    + (sizeScore * 0.24)
    + (discountScore * 0.1)
    + (reviewsScore * 0.06)
  );
};

const getBrandPreferenceMultiplier = (product, preferredBrandSet) => {
  if (!preferredBrandSet || preferredBrandSet.size === 0) return 1;
  const brandId = String(product?.brandId || '').trim().toLowerCase();
  if (!brandId) return 1;

  return preferredBrandSet.has(brandId) ? 1.12 : 1;
};

export const getPersonalizedRecommendations = ({
  measurements,
  category,
  audience = 'all',
  preferredBrandIds = [],
  limitProducts = 8,
  limitBrands = 5
}) => {
  const safeCategory = category === 'bottom' ? 'bottom' : 'top';
  const safeAudience = ['men', 'women', 'all'].includes(audience) ? audience : 'all';
  const preferredBrandSet = new Set(
    (Array.isArray(preferredBrandIds) ? preferredBrandIds : [])
      .map((id) => String(id || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const suggestedSize = inferRecommendedSize({ category: safeCategory, measurements });

  const categoryProductsRaw = getProductsByCategory(safeCategory);
  const categoryProducts = categoryProductsRaw.filter((product) => {
    const detected = detectAudienceFromProduct(product);
    return matchesAudience(detected, safeAudience);
  });

  const productsForScoring = categoryProducts.length > 0 ? categoryProducts : categoryProductsRaw;

  const scoredCandidates = productsForScoring
    .map((product) => ({
      ...product,
      recommendationScore: Math.min(
        1.5,
        scoreProduct(product, suggestedSize) * getBrandPreferenceMultiplier(product, preferredBrandSet)
      )
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  const topProducts = scoredCandidates.slice(0, Math.max(1, limitProducts));

  const brandMap = new Map();
  scoredCandidates.slice(0, 80).forEach((product) => {
    const key = String(product.brandId || '').trim();
    if (!key) return;

    const existing = brandMap.get(key) || {
      brandId: key,
      brandName: formatBrandNameFromId(key),
      scoreTotal: 0,
      count: 0
    };

    existing.scoreTotal += Number(product.recommendationScore) || 0;
    existing.count += 1;
    brandMap.set(key, existing);
  });

  const topBrands = Array.from(brandMap.values())
    .map((brand) => ({
      brandId: brand.brandId,
      brandName: brand.brandName,
      score: brand.count > 0 ? brand.scoreTotal / brand.count : 0,
      productCount: brand.count
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limitBrands));

  return {
    suggestedSize,
    topProducts,
    topBrands,
    totalCandidates: scoredCandidates.length,
    audienceUsed: safeAudience,
    audienceFilterApplied: categoryProducts.length > 0,
    preferredBrandsApplied: preferredBrandSet.size
  };
};
