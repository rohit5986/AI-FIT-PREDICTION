import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { CartContext } from './CartContext';

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist } = useContext(CartContext);
  
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || 'Default');
  const [quantity, setQuantity] = useState(1);
  const inWishlist = isInWishlist(product.id);

  const discountPercent = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    alert(`${quantity} item(s) added to cart!`);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    navigation.navigate('Cart');
  };

  const handleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleOpenSource = async () => {
    if (!product?.source) return;
    try {
      const canOpen = await Linking.canOpenURL(product.source);
      if (!canOpen) {
        Alert.alert('Link unavailable', 'This product link could not be opened on this device.');
        return;
      }
      await Linking.openURL(product.source);
    } catch {
      Alert.alert('Failed to open link', 'Please try again in a moment.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Product Image */}
      <View style={styles.imageSection}>
        <Text style={styles.emoji}>{product.image}</Text>
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoSection}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.brandText}>{product.description}</Text>
          </View>
          <Pressable style={styles.wishlistBtn} onPress={handleWishlist}>
            <Text style={styles.wishlistIcon}>{inWishlist ? '❤️' : '🤍'}</Text>
          </Pressable>
        </View>

        {/* Rating and Reviews */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingNumber}>{product.rating}</Text>
            <Text style={styles.star}>★</Text>
          </View>
          <Text style={styles.reviewsText}>{product.reviews} reviews</Text>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>Quality: {product.quality}/5</Text>
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <Text style={styles.currentPrice}>{formatINR(product.price)}</Text>
          {product.originalPrice > product.price && (
            <>
              <Text style={styles.originalPrice}>{formatINR(product.originalPrice)}</Text>
              <Text style={styles.savingText}>You save {formatINR(product.originalPrice - product.price)}</Text>
            </>
          )}
        </View>

        {/* Stock Status */}
        <View style={styles.stockSection}>
          <Text style={product.details.inStock > 20 ? styles.inStock : styles.lowStock}>
            {product.details.inStock > 20 ? '✓ In Stock' : `Only ${product.details.inStock} left`}
          </Text>
        </View>
      </View>

      {/* Size Selection */}
      <View style={styles.selectionSection}>
        <Text style={styles.sectionTitle}>Select Size</Text>
        <View style={styles.sizeGrid}>
          {product.sizes.map((size) => (
            <Pressable
              key={size}
              style={[
                styles.sizeButton,
                selectedSize === size && styles.sizeButtonSelected
              ]}
              onPress={() => setSelectedSize(size)}
            >
              <Text
                style={[
                  styles.sizeButtonText,
                  selectedSize === size && styles.sizeButtonTextSelected
                ]}
              >
                {size}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Color Selection */}
      <View style={styles.selectionSection}>
        <Text style={styles.sectionTitle}>Select Color</Text>
        <View style={styles.colorGrid}>
          {product.colors.map((color) => (
            <Pressable
              key={color}
              style={[
                styles.colorButton,
                selectedColor === color && styles.colorButtonSelected
              ]}
              onPress={() => setSelectedColor(color)}
            >
              <Text style={styles.colorLabel}>{color}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Quantity Selector */}
      <View style={styles.quantitySection}>
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityControl}>
          <Pressable
            style={styles.quantityBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text style={styles.quantityBtnText}>−</Text>
          </Pressable>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <Pressable
            style={styles.quantityBtn}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text style={styles.quantityBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Product Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Material:</Text>
          <Text style={styles.detailValue}>{product.details.material}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fit:</Text>
          <Text style={styles.detailValue}>{product.details.fit}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Care:</Text>
          <Text style={styles.detailValue}>{product.details.care}</Text>
        </View>
      </View>

      {/* Source Link Section */}
      {product.source ? (
        <View style={styles.sourceSection}>
          <Text style={styles.sectionTitle}>Original Product Page</Text>
          <Pressable style={styles.sourceButton} onPress={handleOpenSource}>
            <Text style={styles.sourceButtonText}>🔗 Open Product Page</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Pressable style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </Pressable>
        <Pressable style={styles.buyNowBtn} onPress={handleBuyNow}>
          <Text style={styles.buyNowText}>Buy Now</Text>
        </Pressable>
      </View>

      {/* Back Button */}
      <Pressable
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backBtnText}>← Continue Shopping</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f5f2'
  },
  contentContainer: {
    paddingBottom: 30
  },
  imageSection: {
    backgroundColor: '#fff',
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative'
  },
  emoji: {
    fontSize: 100
  },
  discountBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800'
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  titleCol: {
    flex: 1
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4
  },
  brandText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18
  },
  wishlistBtn: {
    marginLeft: 12
  },
  wishlistIcon: {
    fontSize: 24
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fbbf24',
    marginRight: 2
  },
  star: {
    fontSize: 14,
    color: '#fbbf24'
  },
  reviewsText: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 12
  },
  qualityBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  qualityText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600'
  },
  priceSection: {
    marginBottom: 12
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4
  },
  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through'
  },
  savingText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4
  },
  stockSection: {
    paddingVertical: 8
  },
  inStock: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600'
  },
  lowStock: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600'
  },
  selectionSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  sizeButton: {
    width: '22%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginRight: '4%',
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  sizeButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#dbeafe',
    borderWidth: 2
  },
  sizeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280'
  },
  sizeButtonTextSelected: {
    color: '#3b82f6'
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  colorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 8,
    backgroundColor: '#f9fafb'
  },
  colorButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#dbeafe',
    borderWidth: 2
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  quantitySection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb'
  },
  quantityBtn: {
    flex: 1,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quantityBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6'
  },
  quantityValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  detailsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600'
  },
  detailValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right'
  },
  sourceSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  sourceButton: {
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  sourceButtonText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '700'
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center'
  },
  addToCartText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '700'
  },
  buyNowBtn: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  buyNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  backBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center'
  },
  backBtnText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600'
  }
});
