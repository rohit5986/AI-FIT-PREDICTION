// Enhanced product database with ecommerce data
export const PRODUCTS = [
  // UrbanThread Products
  {
    id: 'ub-tshirt-001',
    brandId: 'urbanthread',
    name: 'Classic Crew Neck T-Shirt',
    category: 'top',
    price: 35,
    originalPrice: 50,
    quality: 4.5,
    rating: 4.7,
    reviews: 248,
    image: '👕',
    colors: ['Black', 'White', 'Blue', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Premium cotton fabric. Comfortable for everyday wear. Breathable and durable.',
    details: {
      material: '100% Cotton',
      fit: 'Regular',
      care: 'Machine wash cold',
      inStock: 150
    }
  },
  {
    id: 'ub-tshirt-002',
    brandId: 'urbanthread',
    name: 'V-Neck Premium T-Shirt',
    category: 'top',
    price: 42,
    originalPrice: 55,
    quality: 4.6,
    rating: 4.8,
    reviews: 189,
    image: '👕',
    colors: ['Navy', 'Maroon', 'Forest Green', 'Charcoal'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Stylish V-neck design. Perfect for casual and semi-formal occasions.',
    details: {
      material: '100% Premium Cotton',
      fit: 'Slim',
      care: 'Machine wash cold',
      inStock: 120
    }
  },
  {
    id: 'ub-jeans-001',
    brandId: 'urbanthread',
    name: 'Slim Fit Denim Jeans',
    category: 'bottom',
    price: 75,
    originalPrice: 99,
    quality: 4.6,
    rating: 4.6,
    reviews: 412,
    image: '👖',
    colors: ['Dark Blue', 'Light Blue', 'Black', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'High-quality denim. Perfect fit. Long-lasting color.',
    details: {
      material: '98% Cotton, 2% Elastane',
      fit: 'Slim',
      care: 'Wash separately',
      inStock: 95
    }
  },
  {
    id: 'ub-shirt-001',
    brandId: 'urbanthread',
    name: 'Oxford Button Down Shirt',
    category: 'top',
    price: 65,
    originalPrice: 85,
    quality: 4.8,
    rating: 4.8,
    reviews: 356,
    image: '👔',
    colors: ['White', 'Light Blue', 'Sky Blue', 'Soft Pink'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Formal Oxford shirt. Ideal for office and parties.',
    details: {
      material: '100% Cotton Oxford',
      fit: 'Regular',
      care: 'Dry clean or machine wash',
      inStock: 80
    }
  },
  {
    id: 'ub-chinos-001',
    brandId: 'urbanthread',
    name: 'Casual Chino Pants',
    category: 'bottom',
    price: 60,
    originalPrice: 80,
    quality: 4.4,
    rating: 4.5,
    reviews: 278,
    image: '👖',
    colors: ['Khaki', 'Navy', 'Olive', 'Beige'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Versatile chino pants for casual and smart-casual occasions.',
    details: {
      material: '100% Cotton',
      fit: 'Regular Tapered',
      care: 'Machine wash warm',
      inStock: 110
    }
  },

  // Streetline Products
  {
    id: 'sl-tshirt-001',
    brandId: 'streetline',
    name: 'Graphic Print T-Shirt',
    category: 'top',
    price: 25,
    originalPrice: 40,
    quality: 4.0,
    rating: 4.3,
    reviews: 567,
    image: '👕',
    colors: ['Black', 'White', 'Navy', 'Red'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Trendy graphic designs. Great for street style.',
    details: {
      material: '100% Cotton',
      fit: 'Oversized',
      care: 'Machine wash cold',
      inStock: 200
    }
  },
  {
    id: 'sl-hoodie-001',
    brandId: 'streetline',
    name: 'Fleece Lined Hoodie',
    category: 'top',
    price: 45,
    originalPrice: 65,
    quality: 4.1,
    rating: 4.4,
    reviews: 423,
    image: '🧥',
    colors: ['Gray', 'Navy', 'Black', 'Maroon'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Warm and comfortable hoodie for winter.',
    details: {
      material: '80% Cotton, 20% Polyester',
      fit: 'Regular',
      care: 'Machine wash warm',
      inStock: 160
    }
  },
  {
    id: 'sl-jeans-001',
    brandId: 'streetline',
    name: 'Regular Fit Jeans',
    category: 'bottom',
    price: 50,
    originalPrice: 70,
    quality: 3.9,
    rating: 4.2,
    reviews: 598,
    image: '👖',
    colors: ['Dark Blue', 'Black', 'Gray', 'Light Blue'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Comfortable everyday jeans. Good stretch.',
    details: {
      material: '99% Cotton, 1% Elastane',
      fit: 'Regular',
      care: 'Wash separately',
      inStock: 180
    }
  },
  {
    id: 'sl-shorts-001',
    brandId: 'streetline',
    name: 'Cargo Shorts',
    category: 'bottom',
    price: 40,
    originalPrice: 55,
    quality: 3.8,
    rating: 4.0,
    reviews: 312,
    image: '🩳',
    colors: ['Khaki', 'Olive', 'Navy', 'Black'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Perfect for outdoor activities. Multiple pockets.',
    details: {
      material: '100% Cotton',
      fit: 'Regular',
      care: 'Machine wash',
      inStock: 140
    }
  },

  // NovaWear Products
  {
    id: 'nw-tshirt-001',
    brandId: 'novawear',
    name: 'Premium Organic T-Shirt',
    category: 'top',
    price: 45,
    originalPrice: 60,
    quality: 4.8,
    rating: 4.9,
    reviews: 289,
    image: '👕',
    colors: ['Ivory', 'Black', 'Navy', 'Sage Green'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Eco-friendly organic cotton. Ultra soft and durable.',
    details: {
      material: '100% Organic Cotton',
      fit: 'Slim Fit',
      care: 'Machine wash cold',
      inStock: 75
    }
  },
  {
    id: 'nw-polo-001',
    brandId: 'novawear',
    name: 'Luxury Polo Shirt',
    category: 'top',
    price: 65,
    originalPrice: 90,
    quality: 4.7,
    rating: 4.8,
    reviews: 201,
    image: '👔',
    colors: ['White', 'Navy', 'Sky Blue', 'Burgundy'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Premium polo for sophisticated look. Perfect for golf and casual events.',
    details: {
      material: '100% Pique Cotton',
      fit: 'Regular',
      care: 'Machine wash warm',
      inStock: 60
    }
  },
  {
    id: 'nw-jeans-001',
    brandId: 'novawear',
    name: 'Skinny Fit Premium Jeans',
    category: 'bottom',
    price: 85,
    originalPrice: 120,
    quality: 4.9,
    rating: 4.9,
    reviews: 334,
    image: '👖',
    colors: ['Dark Indigo', 'Black', 'Midnight Blue', 'Charcoal'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Premium denim with perfect fit. Superior quality and durability.',
    details: {
      material: '98% Cotton, 2% Spandex',
      fit: 'Skinny',
      care: 'Wash separately, tumble dry low',
      inStock: 85
    }
  },
  {
    id: 'nw-trousers-001',
    brandId: 'novawear',
    name: 'Tailored Formal Trousers',
    category: 'bottom',
    price: 95,
    originalPrice: 140,
    quality: 5.0,
    rating: 4.9,
    reviews: 167,
    image: '👖',
    colors: ['Black', 'Navy', 'Gray', 'Charcoal'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Premium tailored trousers for formal occasions.',
    details: {
      material: '100% Wool Blend',
      fit: 'Tapered',
      care: 'Dry clean only',
      inStock: 50
    }
  },
  {
    id: 'nw-jacket-001',
    brandId: 'novawear',
    name: 'Blazer Jacket',
    category: 'top',
    price: 120,
    originalPrice: 180,
    quality: 4.9,
    rating: 4.9,
    reviews: 145,
    image: '🧥',
    colors: ['Black', 'Navy', 'Charcoal', 'Maroon'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Elegant blazer for professional and formal wear.',
    details: {
      material: '95% Polyester, 5% Elastane',
      fit: 'Slim',
      care: 'Dry clean or hand wash',
      inStock: 40
    }
  }
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
