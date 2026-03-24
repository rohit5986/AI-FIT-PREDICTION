import { INDIAN_BRANDS, INDIAN_PRODUCTS } from './indianBrandsData';

export const CATEGORIES = [
  { id: 'top', label: 'Top (T-shirt/Shirt)' },
  { id: 'bottom', label: 'Bottom (Jeans/Pants)' }
];

const BRAND_PRODUCTS_BY_ID = INDIAN_PRODUCTS.reduce((acc, product) => {
  const key = String(product?.brandId || '').trim().toLowerCase();
  if (!key) return acc;
  if (!acc[key]) acc[key] = [];
  acc[key].push(product);
  return acc;
}, {});

const getBrandProducts = (brandId) => BRAND_PRODUCTS_BY_ID[String(brandId || '').toLowerCase()] || [];

const DEFAULT_SIZE_CHART_BRANDS = [
  {
    id: 'biba',
    name: 'BIBA',
    description: 'Womens ethnic and fusion wear',
    priceRange: '₹899-₹4999',
    quality: 4.1,
    chart: {
      top: [
        { size: 'S', chest: [81, 84], waist: [71, 74] },
        { size: 'M', chest: [86, 89], waist: [76, 79] },
        { size: 'L', chest: [91, 94], waist: [81, 84] },
        { size: 'XL', chest: [97, 99], waist: [86, 89] },
        { size: 'XXL', chest: [102, 104], waist: [91, 97] },
        { size: '3XL', chest: [107, 109], waist: [102, 104] }
      ],
      bottom: [
        { size: 'S', waist: [71, 74], weight: [45, 54] },
        { size: 'M', waist: [76, 79], weight: [52, 60] },
        { size: 'L', waist: [81, 84], weight: [58, 66] },
        { size: 'XL', waist: [86, 89], weight: [64, 72] },
        { size: 'XXL', waist: [91, 97], weight: [70, 80] }
      ]
    },
    products: getBrandProducts('biba')
  },
  {
    id: 'allen-solly',
    name: 'Allen Solly',
    description: 'Formal and smart-casual essentials',
    priceRange: '₹999-₹8999',
    quality: 4.2,
    chart: {
      top: [
        { size: 'S', chest: [88, 93], waist: [74, 79] },
        { size: 'M', chest: [96, 100], waist: [80, 85] },
        { size: 'L', chest: [101, 104], waist: [86, 90] },
        { size: 'XL', chest: [105, 109], waist: [91, 95] },
        { size: 'XXL', chest: [112, 116], waist: [96, 100] },
        { size: '3XL', chest: [120, 124], waist: [101, 105] },
        { size: '4XL', chest: [128, 132], waist: [106, 110] }
      ],
      bottom: [
        { size: 'S', waist: [78, 82], weight: [52, 60] },
        { size: 'M', waist: [83, 87], weight: [58, 66] },
        { size: 'L', waist: [88, 92], weight: [64, 72] },
        { size: 'XL', waist: [93, 97], weight: [70, 78] },
        { size: 'XXL', waist: [98, 102], weight: [76, 85] },
        { size: '3XL', waist: [103, 107], weight: [82, 92] },
        { size: '4XL', waist: [108, 112], weight: [90, 100] }
      ]
    },
    products: getBrandProducts('allen-solly')
  },
  {
    id: 'bewakoof-menswear',
    name: 'Bewakoof',
    description: 'Casual streetwear and basics',
    priceRange: '₹499-₹2499',
    quality: 4.0,
    chart: {
      top: [
        { size: 'S', chest: [105, 109], waist: [72, 76] },
        { size: 'M', chest: [110, 114], waist: [76, 80] },
        { size: 'L', chest: [115, 119], waist: [80, 84] },
        { size: 'XL', chest: [120, 124], waist: [85, 89] },
        { size: 'XXL', chest: [125, 129], waist: [90, 94] },
        { size: '3XL', chest: [130, 134], waist: [95, 99] }
      ],
      bottom: [
        { size: 'S', waist: [69, 73], weight: [48, 56] },
        { size: 'M', waist: [74, 78], weight: [54, 62] },
        { size: 'L', waist: [79, 83], weight: [60, 68] },
        { size: 'XL', waist: [84, 88], weight: [66, 74] },
        { size: 'XXL', waist: [89, 93], weight: [72, 82] },
        { size: '3XL', waist: [94, 98], weight: [80, 90] }
      ]
    },
    products: getBrandProducts('bewakoof-menswear')
  },
  {
    id: 'fabindia',
    name: 'Fabindia',
    description: 'Indian contemporary and handcrafted clothing',
    priceRange: '₹1099-₹5999',
    quality: 4.3,
    chart: {
      top: [
        { size: 'XS', chest: [89, 93], waist: [69, 73] },
        { size: 'S', chest: [94, 98], waist: [74, 78] },
        { size: 'M', chest: [99, 103], waist: [79, 83] },
        { size: 'L', chest: [104, 108], waist: [84, 88] },
        { size: 'XL', chest: [109, 113], waist: [89, 93] },
        { size: 'XXL', chest: [114, 118], waist: [95, 99] },
        { size: '3XL', chest: [119, 123], waist: [100, 104] }
      ],
      bottom: [
        { size: 'XS', waist: [69, 73], weight: [50, 58] },
        { size: 'S', waist: [74, 78], weight: [56, 64] },
        { size: 'M', waist: [79, 83], weight: [62, 70] },
        { size: 'L', waist: [84, 88], weight: [68, 76] },
        { size: 'XL', waist: [89, 93], weight: [74, 82] },
        { size: 'XXL', waist: [94, 98], weight: [80, 90] },
        { size: '3XL', waist: [99, 103], weight: [88, 98] }
      ]
    },
    products: getBrandProducts('fabindia')
  },
  {
    id: 'hm',
    name: 'H&M',
    description: 'Global fashion basics and trend-led essentials',
    priceRange: '₹799-₹6999',
    quality: 4.1,
    chart: {
      top: [
        { size: 'XXS', chest: [74, 78], waist: [62, 66] },
        { size: 'XS', chest: [78, 86], waist: [66, 74] },
        { size: 'S', chest: [86, 90], waist: [74, 78] },
        { size: 'M', chest: [94, 98], waist: [82, 86] },
        { size: 'L', chest: [102, 106], waist: [90, 94] },
        { size: 'XL', chest: [110, 114], waist: [98.5, 103] },
        { size: 'XXL', chest: [118, 122], waist: [107.5, 112] },
        { size: '3XL', chest: [126, 130], waist: [116.5, 121] }
      ],
      bottom: [
        { size: 'XXS', waist: [62, 66], weight: [42, 50] },
        { size: 'XS', waist: [66, 74], weight: [48, 56] },
        { size: 'S', waist: [74, 78], weight: [54, 62] },
        { size: 'M', waist: [82, 86], weight: [60, 70] },
        { size: 'L', waist: [90, 94], weight: [68, 76] },
        { size: 'XL', waist: [98.5, 103], weight: [74, 84] },
        { size: 'XXL', waist: [107.5, 112], weight: [82, 92] },
        { size: '3XL', waist: [116.5, 121], weight: [90, 102] }
      ]
    },
    products: getBrandProducts('hm')
  }
];

const mergeBrandsById = (primaryBrands, fallbackBrands) => {
  const map = new Map();

  (Array.isArray(fallbackBrands) ? fallbackBrands : []).forEach((brand) => {
    if (!brand?.id) return;
    map.set(String(brand.id).toLowerCase(), brand);
  });

  (Array.isArray(primaryBrands) ? primaryBrands : []).forEach((brand) => {
    if (!brand?.id) return;
    map.set(String(brand.id).toLowerCase(), brand);
  });

  return Array.from(map.values());
};

export const BRANDS = mergeBrandsById(INDIAN_BRANDS, DEFAULT_SIZE_CHART_BRANDS);

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
