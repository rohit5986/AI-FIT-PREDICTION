import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { WishlistContext } from './WishlistContext';
import ProductImage from './ProductImage';

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

export default function WishlistScreen({ navigation }) {
  const { wishlist, removeFromWishlist } = useContext(WishlistContext);

  const openProduct = (product) => {
    navigation.navigate('Shopping', {
      screen: 'ProductDetail',
      params: { product }
    });
  };

  const renderWishlistItem = ({ item }) => (
    <View style={styles.wishlistItem}>
      <View style={styles.itemImage}>
        <ProductImage
          imageUrl={item.imageUrl}
          fallback={item.image}
          containerStyle={styles.itemImageFrame}
          imageStyle={styles.itemImageAsset}
          fallbackTextStyle={styles.emoji}
          resizeMode="contain"
        />
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemBrand}>{item.description}</Text>

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
      </View>

      <View style={styles.itemActions}>
        <Pressable
          style={styles.addBtn}
          onPress={() => openProduct(item)}
        >
          <Text style={styles.addBtnText}>View</Text>
        </Pressable>

        <Pressable
          style={styles.removeBtn}
          onPress={() => removeFromWishlist(item.id)}
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );

  if (wishlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>❤️</Text>
        <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
        <Text style={styles.emptyText}>Add items to your wishlist to save them for later!</Text>
        <Pressable
          style={styles.exploreBtnContainer}
          onPress={() => navigation.navigate('Shopping', { screen: 'ProductsScreen' })}
        >
          <Text style={styles.exploreBtn}>Explore Products</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wishlist</Text>
        <Text style={styles.itemCount}>{wishlist.length} items</Text>
      </View>

      <FlatList
        data={wishlist}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Shopping', { screen: 'ProductsScreen' })}
        >
          <Text style={styles.actionBtnText}>Continue Shopping</Text>
        </Pressable>
      </View>
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
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a'
  },
  itemCount: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  listContent: {
    padding: 12,
    paddingBottom: 100
  },
  wishlistItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  itemImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  itemImageFrame: {
    width: '100%',
    height: '100%'
  },
  itemImageAsset: {
    width: '100%',
    height: '100%'
  },
  emoji: {
    fontSize: 40
  },
  itemDetails: {
    flex: 1
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  itemBrand: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6
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
    alignItems: 'center'
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1f2937'
  },
  originalPrice: {
    fontSize: 11,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 6
  },
  itemActions: {
    justifyContent: 'space-between',
    marginLeft: 8
  },
  addBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 6
  },
  addBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  removeBtnText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '700'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f5f2'
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32
  },
  exploreBtnContainer: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  exploreBtn: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '700'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  actionBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  }
});
