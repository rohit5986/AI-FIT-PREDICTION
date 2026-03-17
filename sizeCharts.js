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

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

const getSizeRank = (sizeValue) => {
  const size = String(sizeValue || '').trim().toUpperCase();
  const index = SIZE_ORDER.indexOf(size);
  return index >= 0 ? index : Number.POSITIVE_INFINITY;
};

const evaluateEntry = (entry, category, measurements) => {
  const chest = toNumber(measurements.chest);
  const waist = toNumber(measurements.waist);
  const weight = toNumber(measurements.weight);

  const metricCandidates = category === 'top'
    ? [
        { id: 'chest', label: 'Chest', value: chest, range: entry.chest, weight: 1, unit: 'cm' },
        { id: 'waist', label: 'Waist', value: waist, range: entry.waist, weight: 0.5, unit: 'cm' }
      ]
    : [
        { id: 'waist', label: 'Waist', value: waist, range: entry.waist, weight: 1, unit: 'cm' },
        { id: 'weight', label: 'Weight', value: weight, range: entry.weight, weight: 0.5, unit: 'kg' }
      ];

  const details = metricCandidates
    .filter((metric) => metric.value !== null && Array.isArray(metric.range))
    .map((metric) => {
      const distance = distanceToRange(metric.value, metric.range);
      return {
        ...metric,
        distance,
        inRange: distance === 0
      };
    });

  const weightSum = details.reduce((sum, metric) => sum + metric.weight, 0);
  if (weightSum === 0) {
    return {
      score: Number.POSITIVE_INFINITY,
      metricsUsed: 0,
      details: []
    };
  }

  const weightedDistance = details.reduce((sum, metric) => {
    return sum + (metric.distance * metric.weight);
  }, 0);

  return {
    score: weightedDistance / weightSum,
    metricsUsed: details.length,
    details
  };
};

const buildFitReason = ({ category, size, details }) => {
  if (!Array.isArray(details) || details.length === 0) {
    return 'Limited measurement inputs were available. Recommendation is based on fallback matching.';
  }

  const primaryMetricId = category === 'top' ? 'chest' : 'waist';
  const primaryMetric = details.find((metric) => metric.id === primaryMetricId) || details[0];
  const [min, max] = primaryMetric.range;
  const value = Number(primaryMetric.value);

  if (primaryMetric.inRange) {
    return `${primaryMetric.label} ${value}${primaryMetric.unit} is within ${min}-${max}${primaryMetric.unit} for size ${size}.`;
  }

  if (value < min) {
    const gap = (min - value).toFixed(1);
    return `${primaryMetric.label} is ${gap}${primaryMetric.unit} below the ${min}-${max}${primaryMetric.unit} range for size ${size}.`;
  }

  const gap = (value - max).toFixed(1);
  return `${primaryMetric.label} is ${gap}${primaryMetric.unit} above the ${min}-${max}${primaryMetric.unit} range for size ${size}.`;
};

const pickAlternativeSize = ({ selectedEntry, selectedScore, alternatives, category, details }) => {
  if (!selectedEntry || !Array.isArray(alternatives) || alternatives.length === 0) return '';

  const secondary = alternatives[0];
  if (!secondary || !secondary.entry || !secondary.entry.size) return '';

  const currentRank = getSizeRank(selectedEntry.size);
  const secondaryRank = getSizeRank(secondary.entry.size);

  const primaryMetricId = category === 'top' ? 'chest' : 'waist';
  const primaryMetric = Array.isArray(details)
    ? details.find((metric) => metric.id === primaryMetricId)
    : null;

  if (primaryMetric && !primaryMetric.inRange && Number.isFinite(currentRank) && Number.isFinite(secondaryRank)) {
    if (primaryMetric.value > primaryMetric.range[1] && secondaryRank > currentRank) {
      return secondary.entry.size;
    }
    if (primaryMetric.value < primaryMetric.range[0] && secondaryRank < currentRank) {
      return secondary.entry.size;
    }
  }

  if (
    Number.isFinite(selectedScore)
    && Number.isFinite(secondary.score)
    && (secondary.score - selectedScore <= 0.5)
  ) {
    return secondary.entry.size;
  }

  return '';
};

const pickBestEntry = (entries, category, measurements) => {
  if (!entries || entries.length === 0) return null;
  const ranked = entries
    .map((entry) => {
      const evaluation = evaluateEntry(entry, category, measurements);
      return { entry, ...evaluation };
    })
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score);

  if (ranked.length === 0) return null;

  return {
    entry: ranked[0].entry,
    score: ranked[0].score,
    details: ranked[0].details,
    metricsUsed: ranked[0].metricsUsed,
    alternatives: ranked.slice(1, 3)
  };
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
    return {
      size: 'M',
      confidence: 'Low',
      score: Number.POSITIVE_INFINITY,
      fitReason: 'No matching size-chart entry was found for the current inputs.',
      secondarySize: '',
      measurementCoverage: 0
    };
  }

  const primaryMetricId = category === 'top' ? 'chest' : 'waist';
  const primaryMetric = Array.isArray(result.details)
    ? result.details.find((metric) => metric.id === primaryMetricId)
    : null;

  let confidence = 'Low';
  if (primaryMetric?.inRange && result.score <= 1.5) {
    confidence = 'High';
  } else if (result.score <= 2.5) {
    confidence = 'Medium';
  }

  if (result.metricsUsed <= 1 && confidence === 'High') {
    confidence = 'Medium';
  }

  const measurementCoverage = Math.min(1, (result.metricsUsed || 0) / 2);
  const fitReason = buildFitReason({ category, size: result.entry.size, details: result.details });
  const secondarySize = pickAlternativeSize({
    selectedEntry: result.entry,
    selectedScore: result.score,
    alternatives: result.alternatives,
    category,
    details: result.details
  });

  return {
    size: result.entry.size,
    confidence,
    score: result.score,
    fitReason,
    secondarySize,
    measurementCoverage
  };
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
    const normalizedFitScore = Number.isFinite(prediction.score)
      ? Math.max(0, 1 - (prediction.score / 10))
      : 0;
    const coverageScore = prediction.measurementCoverage || 0;
    const combinedFitScore =
      (fitScore * 0.55) +
      (normalizedFitScore * 0.35) +
      (coverageScore * 0.10);

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
      fitReason: prediction.fitReason,
      secondarySize: prediction.secondarySize,
      measurementCoverage: prediction.measurementCoverage,
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
