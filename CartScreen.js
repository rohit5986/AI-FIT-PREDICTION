import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { CartContext } from './CartContext';
import ProductImage from './ProductImage';

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, updateCartQuantity, getCartTotal, clearCart, placeOrder } =
    useContext(CartContext);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    
    const order = placeOrder({
      shippingAddress: 'Default Address',
      paymentMethod: 'Card'
    });
    
    alert(`Order placed successfully!\nOrder ID: ${order.id}\nTotal: ${formatINR(order.total)}`);
    navigation.navigate('OrderHistory');
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
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
        <Text style={styles.itemSpecs}>
          Size: {item.size} | Color: {item.color}
        </Text>
        <Text style={styles.itemBrand}>{item.quality}/5 ⭐</Text>

        <View style={styles.quantityRow}>
          <Pressable
            style={styles.quantityEditBtn}
            onPress={() => updateCartQuantity(item.id, item.quantity - 1)}
          >
            <Text style={styles.quantityEditText}>−</Text>
          </Pressable>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <Pressable
            style={styles.quantityEditBtn}
            onPress={() => updateCartQuantity(item.id, item.quantity + 1)}
          >
            <Text style={styles.quantityEditText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.itemPrice}>{formatINR(item.price * item.quantity)}</Text>
        <Pressable
          onPress={() => removeFromCart(item.id)}
          style={styles.removeBtn}
        >
          <Text style={styles.removeBtnText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Add some products to get started!</Text>
        <Pressable
          style={styles.continueShopping}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
        </Pressable>
      </View>
    );
  }

  const total = getCartTotal();
  const discount = cart.reduce(
    (sum, item) => sum + ((item.originalPrice - item.price) * item.quantity),
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Cart</Text>
        <Text style={styles.itemCount}>{cart.length} items</Text>
      </View>

      <FlatList
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>{formatINR(total + discount)}</Text>
        </View>

        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.discountLabel}>Discount:</Text>
            <Text style={styles.discountValue}>-{formatINR(discount)}</Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping:</Text>
          <Text style={styles.summaryValue}>Free</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatINR(total)}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.actions}>
        <Pressable
          style={styles.checkoutBtn}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </Pressable>

        <Pressable
          style={styles.continueBtn}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.continueBtnText}>Continue Shopping</Text>
        </Pressable>

        <Pressable
          style={styles.clearBtn}
          onPress={() => {
            clearCart();
            alert('Cart cleared');
          }}
        >
          <Text style={styles.clearBtnText}>Clear Cart</Text>
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
    fontWeight: '600'
  },
  listContent: {
    padding: 12
  },
  cartItem: {
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
  itemSpecs: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2
  },
  itemBrand: {
    fontSize: 11,
    color: '#fbbf24',
    marginBottom: 6
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quantityEditBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center'
  },
  quantityEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6'
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#111827'
  },
  itemRight: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: 8
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fee2e2',
    borderRadius: 4
  },
  removeBtnText: {
    color: '#991b1b',
    fontSize: 11,
    fontWeight: '600'
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
    marginBottom: 24
  },
  continueShopping: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  summary: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500'
  },
  summaryValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600'
  },
  discountLabel: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600'
  },
  discountValue: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700'
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2937'
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937'
  },
  actions: {
    padding: 16,
    paddingBottom: 30,
    gap: 10,
    backgroundColor: '#f6f5f2'
  },
  checkoutBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  },
  continueBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center'
  },
  continueBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600'
  },
  clearBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  clearBtnText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600'
  }
});
