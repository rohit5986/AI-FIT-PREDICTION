import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SectionList } from 'react-native';
import { CartContext } from './CartContext';

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

export default function OrderHistoryScreen({ navigation }) {
  const { orders } = useContext(CartContext);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderOrderItem = ({ item: product, order }) => (
    <View style={styles.productInOrder}>
      <Text style={styles.productEmoji}>{product.image}</Text>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productSpecs}>
          Qty: {product.quantity} | Size: {product.size}
        </Text>
        <Text style={styles.productPrice}>{formatINR(product.price * product.quantity)}</Text>
      </View>
    </View>
  );

  const renderOrderCard = ({ item: order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          order.status === 'Confirmed' && styles.statusConfirmed,
          order.status === 'Shipped' && styles.statusShipped,
          order.status === 'Delivered' && styles.statusDelivered
        ]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      {/* Delivery Info */}
      <View style={styles.deliveryInfo}>
        <Text style={styles.deliveryLabel}>Expected Delivery:</Text>
        <Text style={styles.deliveryDate}>{formatDate(order.deliveryDate)}</Text>
      </View>

      {/* Products in Order */}
      <Text style={styles.productsLabel}>Items ({order.items.length}):</Text>
      {order.items.map((product) => (
        <renderOrderItem key={product.id} item={product} order={order} />
      ))}

      {/* Order Total */}
      <View style={styles.orderTotal}>
        <Text style={styles.totalLabel}>Order Total:</Text>
        <Text style={styles.totalPrice}>{formatINR(order.total)}</Text>
      </View>

      {/* Actions */}
      <View style={styles.orderActions}>
        <Pressable style={styles.detailBtn} onPress={() => {
          alert(`Order Details:\n\nOrder ID: ${order.id}\nStatus: ${order.status}\nTotal: ${formatINR(order.total)}\nItems: ${order.items.length}`);
        }}>
          <Text style={styles.detailBtnText}>View Details</Text>
        </Pressable>
        <Pressable style={styles.reorderBtn} onPress={() => {
          // Add all items back to cart
          order.items.forEach(item => {
            // addToCart(item, item.quantity, item.size, item.color)
          });
          alert('Items added to cart!');
          navigation.navigate('Cart');
        }}>
          <Text style={styles.reorderBtnText}>Reorder</Text>
        </Pressable>
      </View>
    </View>
  );

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📦</Text>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyText}>Start shopping to see your order history here!</Text>
        <Pressable
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
        <Text style={styles.orderCount}>{orders.length} orders</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
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
  orderCount: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  listContent: {
    padding: 12,
    paddingBottom: 30
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827'
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  statusConfirmed: {
    backgroundColor: '#dbeafe'
  },
  statusShipped: {
    backgroundColor: '#fcd34d'
  },
  statusDelivered: {
    backgroundColor: '#d1fae5'
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700'
  },
  deliveryInfo: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  deliveryLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2
  },
  deliveryDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46'
  },
  productsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  productInOrder: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  productEmoji: {
    fontSize: 32,
    marginRight: 10
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2
  },
  productSpecs: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937'
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827'
  },
  totalPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1f2937'
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  detailBtn: {
    flex: 1,
    backgroundColor: '#dbeafe',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  detailBtnText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '700'
  },
  reorderBtn: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  reorderBtnText: {
    color: '#fff',
    fontSize: 12,
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
    marginBottom: 24
  },
  shopBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  shopBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  }
});
