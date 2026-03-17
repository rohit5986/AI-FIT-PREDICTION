import { INDIAN_BRANDS } from './indianBrandsData';

export const CATEGORIES = [
  { id: 'top', label: 'Top (T-shirt/Shirt)' },
  { id: 'bottom', label: 'Bottom (Jeans/Pants)' }
];

export const BRANDS = [
  ...INDIAN_BRANDS
];

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getBrandsSafe = (brandsOverride) => {
  if (Array.isArray(brandsOverride) && brandsOverride.length > 0) {
    return brandsOverride;
  }
  return BRANDS;
};

const distanceToRange = (value, range) => {
  if (!Array.isArray(range) || range.length !== 2) return 0;
  const [min, max] = range;
  if (value < min) return min - value;
  if (value > max) return value - max;
  return 0;
};

const isWithinRange = (value, range) => {
  if (!Array.isArray(range) || range.length !== 2) return false;
  const [min, max] = range;
  return value >= min && value <= max;
};

const pickBestEntry = (entries, category, measurements) => {
  if (!entries || entries.length === 0) return null;
  const chest = toNumber(measurements.chest);
  const waist = toNumber(measurements.waist);
  const weight = toNumber(measurements.weight);

  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  entries.forEach((entry) => {
    let score = 0;
    let weightSum = 0;

    if (category === 'top') {
      if (chest !== null && entry.chest) {
        score += distanceToRange(chest, entry.chest);
        weightSum += 1;
      }
      if (waist !== null && entry.waist) {
        score += distanceToRange(waist, entry.waist) * 0.5;
        weightSum += 0.5;
      }
    } else {
      if (waist !== null && entry.waist) {
        score += distanceToRange(waist, entry.waist);
        weightSum += 1;
      }
      if (weight !== null && entry.weight) {
        score += distanceToRange(weight, entry.weight) * 0.5;
        weightSum += 0.5;
      }
    }

    const normalizedScore = weightSum > 0 ? score / weightSum : Number.POSITIVE_INFINITY;
    if (normalizedScore < bestScore) {
      bestScore = normalizedScore;
      best = entry;
    }
  });

  return { entry: best, score: bestScore };
};

export const getBrandById = (brandId, brandsOverride) => {
  const brands = getBrandsSafe(brandsOverride);
  return brands.find((brand) => brand.id === brandId) || brands[0];
};

export const getCategoryById = (categoryId) => {
  return CATEGORIES.find((category) => category.id === categoryId) || CATEGORIES[0];
};

export const predictSize = ({ brandId, category, measurements, brandsOverride }) => {
  const brand = getBrandById(brandId, brandsOverride);
  const chart = brand.chart[category] || [];
  const result = pickBestEntry(chart, category, measurements);

  if (!result || !result.entry) {
    return { size: 'M', confidence: 'Low', score: Number.POSITIVE_INFINITY };
  }

  const chest = toNumber(measurements.chest);
  const waist = toNumber(measurements.waist);
  const weight = toNumber(measurements.weight);
  let inRange = false;

  if (category === 'top' && chest !== null) {
    inRange = isWithinRange(chest, result.entry.chest);
  } else if (category === 'bottom' && waist !== null) {
    inRange = isWithinRange(waist, result.entry.waist);
  } else if (weight !== null && result.entry.weight) {
    inRange = isWithinRange(weight, result.entry.weight);
  }

  const confidence = inRange ? 'High' : result.score <= 2 ? 'Medium' : 'Low';

  return { size: result.entry.size, confidence, score: result.score };
};

export const getEquivalentSizes = ({ category, measurements, brandsOverride }) => {
  const brands = getBrandsSafe(brandsOverride);
  return brands.map((brand) => {
    const prediction = predictSize({
      brandId: brand.id,
      category,
      measurements,
      brandsOverride: brands
    });
    return { brandId: brand.id, brandName: brand.name, size: prediction.size };
  });
};

const isNumberArray = (value) => {
  return Array.isArray(value) && value.length === 2 && value.every((item) => Number.isFinite(item));
};

const validateEntry = (entry, category, index) => {
  const errors = [];
  if (!entry || typeof entry !== 'object') {
    errors.push(`Entry ${index + 1} in ${category} is not an object.`);
    return errors;
  }
  if (!entry.size || typeof entry.size !== 'string') {
    errors.push(`Entry ${index + 1} in ${category} is missing size.`);
  }
  if (category === 'top') {
    if (!isNumberArray(entry.chest)) errors.push(`Entry ${index + 1} in top is missing chest range.`);
    if (!isNumberArray(entry.waist)) errors.push(`Entry ${index + 1} in top is missing waist range.`);
  } else {
    if (!isNumberArray(entry.waist)) errors.push(`Entry ${index + 1} in bottom is missing waist range.`);
    if (!isNumberArray(entry.weight)) errors.push(`Entry ${index + 1} in bottom is missing weight range.`);
  }
  return errors;
};

export const validateBrandData = (brands) => {
  const errors = [];
  if (!Array.isArray(brands) || brands.length === 0) {
    return { valid: false, errors: ['Brand data must be a non-empty array.'] };
  }

  brands.forEach((brand, index) => {
    if (!brand || typeof brand !== 'object') {
      errors.push(`Brand ${index + 1} is not an object.`);
      return;
    }
    if (!brand.id || typeof brand.id !== 'string') errors.push(`Brand ${index + 1} is missing id.`);
    if (!brand.name || typeof brand.name !== 'string') errors.push(`Brand ${index + 1} is missing name.`);
    if (!brand.chart || typeof brand.chart !== 'object') {
      errors.push(`Brand ${index + 1} is missing chart.`);
      return;
    }

    const topEntries = Array.isArray(brand.chart.top) ? brand.chart.top : [];
    const bottomEntries = Array.isArray(brand.chart.bottom) ? brand.chart.bottom : [];

    if (topEntries.length === 0) errors.push(`Brand ${index + 1} has no top entries.`);
    if (bottomEntries.length === 0) errors.push(`Brand ${index + 1} has no bottom entries.`);

    topEntries.forEach((entry, entryIndex) => {
      errors.push(...validateEntry(entry, 'top', entryIndex));
    });
    bottomEntries.forEach((entry, entryIndex) => {
      errors.push(...validateEntry(entry, 'bottom', entryIndex));
    });
  });

  return { valid: errors.length === 0, errors };
};

/**
 * ML-BASED BRAND RECOMMENDATION ENGINE
 * Scores brands based on: fit accuracy, price, quality, and product ratings
 */
export const getRecommendedBrands = ({ measurements, category, brandsOverride }) => {
  const brands = getBrandsSafe(brandsOverride);
  
  // Normalize measurements for ML model
  const normalizedMeasurements = {
    chest: toNumber(measurements.chest) / 100 || 0,
    waist: toNumber(measurements.waist) / 100 || 0,
    weight: toNumber(measurements.weight) / 100 || 0,
    height: toNumber(measurements.height) / 200 || 0,
  };
  
  // Score each brand
  const brandScores = brands.map((brand) => {
    // 1. FIT SCORE (40% weight) - How well measurements match
    const prediction = predictSize({
      brandId: brand.id,
      category,
      measurements,
      brandsOverride: brands
    });
    
    const fitConfidenceMap = { 'High': 1.0, 'Medium': 0.7, 'Low': 0.4 };
    const fitScore = fitConfidenceMap[prediction.confidence] || 0.4;
    const normalizedFitScore = Math.max(0, 1 - (prediction.score / 10)); // Fit improves as score decreases
    const combinedFitScore = (fitScore + normalizedFitScore) / 2; // Average the two fit metrics
    
    // 2. QUALITY SCORE (30% weight) - Brand quality rating
    const qualityScore = (brand.quality || 4.0) / 5.0;
    
    // 3. PRODUCT SCORE (20% weight) - Average rating of available products
    const categoryProducts = (brand.products || []).filter(p => p.category === category);
    const productScore = categoryProducts.length > 0 
      ? categoryProducts.reduce((sum, p) => sum + (p.rating || 4.0), 0) / (categoryProducts.length * 5.0)
      : 0.5;
    
    // 4. VALUE SCORE (10% weight) - Price to quality ratio
    const priceBase = 50; // Reference price
    const avgProductPrice = categoryProducts.length > 0 
      ? categoryProducts.reduce((sum, p) => sum + (p.price || 50), 0) / categoryProducts.length
      : 50;
    const valueScore = Math.max(0.3, 1 - ((avgProductPrice - priceBase) / 100));
    
    // FINAL SCORE: Weighted combination
    const finalScore = 
      (combinedFitScore * 0.40) + 
      (qualityScore * 0.30) + 
      (productScore * 0.20) + 
      (valueScore * 0.10);
    
    return {
      brandId: brand.id,
      name: brand.name,
      description: brand.description || '',
      priceRange: brand.priceRange || '',
      quality: brand.quality || 4.0,
      products: categoryProducts,
      predictedSize: prediction.size,
      confidence: prediction.confidence,
      scores: {
        fit: combinedFitScore,
        quality: qualityScore,
        products: productScore,
        value: valueScore
      },
      finalScore
    };
  });
  
  // Sort by final score (highest first)
  return brandScores.sort((a, b) => b.finalScore - a.finalScore);
};
