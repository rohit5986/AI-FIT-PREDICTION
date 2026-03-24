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
  Linking
} from 'react-native';
import { WishlistContext } from './WishlistContext';
import { PRODUCTS, searchProducts, getProductsByCategory } from './productsData';
import { CATEGORIES } from './sizeCharts';
import ProductImage from './ProductImage';

const COLORS = {
  bg: '#f4f6fb',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#dbe2ee',
  accent: '#0f766e',
  accentSoft: '#d1fae5'
};

const SORT_OPTIONS = [
  { label: 'Popular', value: 'popular' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
  { label: 'Rating', value: 'rating' },
  { label: 'Discount', value: 'discount' }
];

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

export default function ProductsScreen({ navigation }) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useContext(WishlistContext);
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

    if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      filtered = [...filtered].sort((a, b) => {
        const discA = ((a.originalPrice - a.price) / a.originalPrice) * 100;
        const discB = ((b.originalPrice - b.price) / b.originalPrice) * 100;
        return discB - discA;
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

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSortBy('popular');
  };

  const renderProductCard = ({ item }) => {
    const discountPercent = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
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

          <Pressable style={styles.viewButton} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
            <Text style={styles.viewButtonText}>View Details</Text>
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

  const renderListHeader = () => (
    <>
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          <Pressable
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && styles.activeCategoryChip
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === 'all' && styles.activeCategoryText
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
                selectedCategory === category.id && styles.activeCategoryChip
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.activeCategoryText
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.brandsSection}>
        <Text style={styles.sectionTitle}>Brands</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            style={[styles.brandChip, selectedBrand === 'all' && styles.activeBrandChip]}
            onPress={() => setSelectedBrand('all')}
          >
            <Text
              style={[
                styles.brandText,
                selectedBrand === 'all' && styles.activeBrandText
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
                selectedBrand === brand.id && styles.activeBrandChip
              ]}
              onPress={() => setSelectedBrand(brand.id)}
            >
              <Text
                style={[
                  styles.brandText,
                  selectedBrand === brand.id && styles.activeBrandText
                ]}
              >
                {brand.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortSection}>
        <Text style={styles.sectionTitle}>Sort By</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.sortChip,
                sortBy === option.value && styles.activeSortChip
              ]}
              onPress={() => setSortBy(option.value)}
            >
              <Text
                style={[
                  styles.sortText,
                  sortBy === option.value && styles.activeSortText
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>{displayProducts.length} products found</Text>
        <Pressable onPress={resetFilters}>
          <Text style={styles.clearFilters}>Clear filters</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or brands..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.muted}
        />
      </View>

      <FlatList
        data={displayProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={displayProducts.length ? styles.gridRow : undefined}
        contentContainerStyle={[styles.gridContainer, displayProducts.length === 0 && styles.emptyListContent]}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No products found</Text>
            <Pressable onPress={resetFilters}>
              <Text style={styles.emptyLink}>Clear filters</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  searchContainer: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text
  },
  categoriesSection: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10
  },
  categoriesScroll: {
    marginHorizontal: -2
  },
  categoryChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  activeCategoryChip: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600'
  },
  activeCategoryText: {
    color: '#ecfeff'
  },
  brandsSection: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  brandChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  activeBrandChip: {
    backgroundColor: COLORS.accentSoft,
    borderColor: '#84ccbf'
  },
  brandText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600'
  },
  activeBrandText: {
    color: '#115e59'
  },
  sortSection: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  sortChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  activeSortChip: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent
  },
  sortText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600'
  },
  activeSortText: {
    color: '#ecfeff'
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.muted
  },
  clearFilters: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: 30
  },
  emptyListContent: {
    flexGrow: 1
  },
  gridRow: {
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginBottom: 12
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: COLORS.card,
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
    color: COLORS.text,
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
    color: COLORS.muted,
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
    color: COLORS.text
  },
  originalPrice: {
    fontSize: 11,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 6
  },
  quality: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 8
  },
  viewButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  viewButtonText: {
    color: '#ecfeff',
    fontSize: 11,
    fontWeight: '700'
  },
  sourceButton: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    alignItems: 'center',
    paddingVertical: 7,
    backgroundColor: '#f8fafc'
  },
  sourceButtonText: {
    color: COLORS.text,
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
    color: COLORS.muted,
    marginBottom: 12
  },
  emptyLink: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600'
  }
});
