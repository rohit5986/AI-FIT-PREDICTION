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
