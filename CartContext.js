import React, { createContext, useState, useMemo, useCallback } from 'react';

export const CartContext = createContext({
  cart: [],
  wishlist: [],
  orders: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateCartQuantity: () => {},
  clearCart: () => {},
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  placeOrder: () => {},
  getCartTotal: () => 0,
  isInWishlist: () => false,
  getCartCount: () => 0
});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);

  // Add item to cart
  const addToCart = useCallback((product, quantity = 1, selectedSize = 'M', selectedColor = 'Default') => {
    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => item.id === product.id && item.size === selectedSize && item.color === selectedColor
      );
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id && item.size === selectedSize && item.color === selectedColor
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, { ...product, quantity, size: selectedSize, color: selectedColor }];
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  // Update cart item quantity
  const updateCartQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Add to wishlist
  const addToWishlist = useCallback((product) => {
    setWishlist(prevWishlist => {
      const exists = prevWishlist.find(item => item.id === product.id);
      if (exists) {
        return prevWishlist;
      }
      return [...prevWishlist, product];
    });
  }, []);

  // Remove from wishlist
  const removeFromWishlist = useCallback((productId) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== productId));
  }, []);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId) => {
    return wishlist.some(item => item.id === productId);
  }, [wishlist]);

  // Place order
  const placeOrder = useCallback((orderData) => {
    const order = {
      id: `ORD-${Date.now()}`,
      items: cart,
      total: getCartTotal(),
      date: new Date().toISOString(),
      status: 'Confirmed',
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
      measurements: orderData?.measurements || {},
      ...orderData
    };
    
    setOrders(prevOrders => [order, ...prevOrders]);
    clearCart();
    return order;
  }, [cart, clearCart]);

  // Calculate cart total
  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // Get cart item count
  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      orders,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      placeOrder,
      getCartTotal,
      isInWishlist,
      getCartCount
    }),
    [cart, wishlist, orders, addToCart, removeFromCart, updateCartQuantity, clearCart, addToWishlist, removeFromWishlist, placeOrder, getCartTotal, isInWishlist, getCartCount]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
