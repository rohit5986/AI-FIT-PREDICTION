import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { CartContext } from './CartContext';
import { PRODUCTS, searchProducts, getProductsByCategory } from './productsData';
import { CATEGORIES } from './sizeCharts';
import ProductImage from './ProductImage';

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

export default function ProductsScreen({ navigation }) {
  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist, getCartCount } =
    useContext(CartContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const brandOptions = useMemo(() => {
    const uniqueBrandIds = [...new Set(PRODUCTS.map((item) => item.brandId).filter(Boolean))];
    return uniqueBrandIds
      .sort((a, b) => a.localeCompare(b))
      .map((brandId) => ({
        id: brandId,
        label: brandId
          .split('-')
          .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
          .join(' ')
      }));
  }, []);

  const displayProducts = useMemo(() => {
    let filtered = searchQuery
      ? searchProducts(searchQuery)
      : selectedCategory === 'all'
        ? PRODUCTS
        : getProductsByCategory(selectedCategory);

    if (selectedBrand !== 'all') {
      filtered = filtered.filter((item) => item.brandId === selectedBrand);
    }

    // Sort
    if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      filtered = [...filtered].sort((a, b) => {
        const discA = ((b.originalPrice - b.price) / b.originalPrice) * 100;
        const discB = ((b.originalPrice - a.price) / b.originalPrice) * 100;
        return discA - discB;
      });
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedBrand, sortBy]);

  const openProductSource = async (url) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Link unavailable', 'This product link could not be opened on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Failed to open link', 'Please try again in a moment.');
    }
  };

  const renderProductCard = ({ item }) => {
    const discountPercent = Math.round(
      ((item.originalPrice - item.price) / item.originalPrice) * 100
    );
    const inWishlist = isInWishlist(item.id);

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <View style={styles.imageContainer}>
          <ProductImage
            imageUrl={item.imageUrl}
            fallback={item.image}
            containerStyle={styles.productImageFrame}
            imageStyle={styles.productImage}
            fallbackTextStyle={styles.emoji}
            resizeMode="contain"
          />
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
          <Pressable
            style={styles.wishlistButton}
            onPress={() => {
              if (inWishlist) {
                removeFromWishlist(item.id);
              } else {
                addToWishlist(item);
              }
            }}
          >
            <Text style={styles.wishlistIcon}>{inWishlist ? '❤️' : '🤍'}</Text>
          </Pressable>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.ratingRow}>
            <Text style={styles.rating}>★ {item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(item.price)}</Text>
            {item.originalPrice > item.price && (
              <Text style={styles.originalPrice}>{formatINR(item.originalPrice)}</Text>
            )}
          </View>

          <Text style={styles.quality}>Quality: {item.quality}/5</Text>

          <Pressable
            style={styles.addButton}
            onPress={() => {
              addToCart(item, 1);
              alert('Added to cart!');
            }}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </Pressable>

          {item.source ? (
            <Pressable
              style={styles.sourceButton}
              onPress={(event) => {
                event?.stopPropagation?.();
                openProductSource(item.source);
              }}
            >
              <Text style={styles.sourceButtonText}>Open Product Page</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with search */}
      <View style={styles.header}>
        <Text style={styles.title}>Shop Now</Text>
        <Pressable
          style={styles.cartIcon}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartText}>🛒 {getCartCount()}</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        <Pressable
          style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === 'all' && styles.categoryChipTextActive
            ]}
          >
            All
          </Text>
        </Pressable>
        {CATEGORIES.map((category) => (
          <Pressable
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Brand Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandsScroll}>
        <Pressable
          style={[styles.brandChip, selectedBrand === 'all' && styles.brandChipActive]}
          onPress={() => setSelectedBrand('all')}
        >
          <Text
            style={[
              styles.brandChipText,
              selectedBrand === 'all' && styles.brandChipTextActive
            ]}
          >
            All Brands
          </Text>
        </Pressable>
        {brandOptions.map((brand) => (
          <Pressable
            key={brand.id}
            style={[
              styles.brandChip,
              selectedBrand === brand.id && styles.brandChipActive
            ]}
            onPress={() => setSelectedBrand(brand.id)}
          >
            <Text
              style={[
                styles.brandChipText,
                selectedBrand === brand.id && styles.brandChipTextActive
              ]}
            >
              {brand.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortScroll}
        contentContainerStyle={styles.sortContainer}
      >
        {[
          { label: 'Popular', value: 'popular' },
          { label: 'Price: Low to High', value: 'price-low' },
          { label: 'Price: High to Low', value: 'price-high' },
          { label: 'Rating', value: 'rating' },
          { label: 'Discount', value: 'discount' }
        ].map((option) => (
          <Pressable
            key={option.value}
            style={[styles.sortChip, sortBy === option.value && styles.sortChipActive]}
            onPress={() => setSortBy(option.value)}
          >
            <Text
              style={[
                styles.sortChipText,
                sortBy === option.value && styles.sortChipTextActive
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <Text style={styles.resultCount}>{displayProducts.length} products found</Text>
      {displayProducts.length > 0 ? (
        <FlatList
          data={displayProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No products found</Text>
          <Pressable
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedBrand('all');
            }}
          >
            <Text style={styles.emptyLink}>Clear filters</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f5f2'
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a'
  },
  cartIcon: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cartText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#1f2937'
  },
  searchIcon: {
    marginLeft: 8,
    fontSize: 16
  },
  categoriesScroll: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff'
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280'
  },
  categoryChipTextActive: {
    color: '#fff'
  },
  brandsScroll: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff'
  },
  brandChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827'
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  brandChipTextActive: {
    color: '#fff'
  },
  resultCount: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6
  },
  sortScroll: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingRight: 32
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff'
  },
  sortChipActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24'
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280'
  },
  sortChipTextActive: {
    color: '#92400e'
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: 30
  },
  gridRow: {
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginBottom: 12
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  productImageFrame: {
    width: '100%',
    height: '100%'
  },
  productImage: {
    width: '100%',
    height: '100%'
  },
  emoji: {
    fontSize: 60
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700'
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  wishlistIcon: {
    fontSize: 16
  },
  productInfo: {
    padding: 10
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  rating: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '600'
  },
  reviews: {
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 4
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2937'
  },
  originalPrice: {
    fontSize: 11,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 6
  },
  quality: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 8
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  addButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  sourceButton: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 6,
    alignItems: 'center',
    paddingVertical: 7
  },
  sourceButtonText: {
    color: '#1f2937',
    fontSize: 11,
    fontWeight: '700'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12
  },
  emptyLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600'
  }
});
