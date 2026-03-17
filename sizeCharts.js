export const CATEGORIES = [
  { id: 'top', label: 'Top (T-shirt/Shirt)' },
  { id: 'bottom', label: 'Bottom (Jeans/Pants)' }
];

export const BRANDS = [
  {
    id: 'urbanthread',
    name: 'UrbanThread',
    chart: {
      top: [
        { size: 'S', chest: [86, 92], waist: [72, 78] },
        { size: 'M', chest: [93, 100], waist: [79, 86] },
        { size: 'L', chest: [101, 108], waist: [87, 95] },
        { size: 'XL', chest: [109, 116], waist: [96, 104] }
      ],
      bottom: [
        { size: 'S', waist: [72, 78], weight: [55, 65] },
        { size: 'M', waist: [79, 86], weight: [66, 75] },
        { size: 'L', waist: [87, 95], weight: [76, 86] },
        { size: 'XL', waist: [96, 104], weight: [87, 98] }
      ]
    }
  },
  {
    id: 'streetline',
    name: 'Streetline',
    chart: {
      top: [
        { size: 'S', chest: [84, 90], waist: [70, 76] },
        { size: 'M', chest: [91, 98], waist: [77, 84] },
        { size: 'L', chest: [99, 106], waist: [85, 93] },
        { size: 'XL', chest: [107, 114], waist: [94, 102] }
      ],
      bottom: [
        { size: 'S', waist: [70, 76], weight: [54, 64] },
        { size: 'M', waist: [77, 84], weight: [65, 74] },
        { size: 'L', waist: [85, 93], weight: [75, 85] },
        { size: 'XL', waist: [94, 102], weight: [86, 97] }
      ]
    }
  },
  {
    id: 'novawear',
    name: 'NovaWear',
    chart: {
      top: [
        { size: 'S', chest: [88, 94], waist: [74, 80] },
        { size: 'M', chest: [95, 102], waist: [81, 88] },
        { size: 'L', chest: [103, 110], waist: [89, 97] },
        { size: 'XL', chest: [111, 118], waist: [98, 106] }
      ],
      bottom: [
        { size: 'S', waist: [74, 80], weight: [56, 66] },
        { size: 'M', waist: [81, 88], weight: [67, 76] },
        { size: 'L', waist: [89, 97], weight: [77, 87] },
        { size: 'XL', waist: [98, 106], weight: [88, 99] }
      ]
    }
  }
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
