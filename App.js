import 'react-native-gesture-handler';
import * as React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MeasurementScreen from './MeasurementScreen';
import BrandRecommendationScreen from './BrandRecommendationScreen';
import ResultScreen from './ResultScreen';
import AdminScreen from './AdminScreen';
import ProductsScreen from './ProductsScreen';
import ProductDetailScreen from './ProductDetailScreen';
import CartScreen from './CartScreen';
import WishlistScreen from './WishlistScreen';
import OrderHistoryScreen from './OrderHistoryScreen';
import StyleAIScreen from './StyleAIScreen';
import { BrandDataProvider } from './BrandDataContext';
import { CartProvider } from './CartContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// AI Recommendation Stack
function RecommendationStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false
      }}
    >
      <Stack.Screen
        name="Measurement"
        component={MeasurementScreen}
        options={{ title: 'AI Fit Predictor' }}
      />
      <Stack.Screen
        name="BrandRecommendation"
        component={BrandRecommendationScreen}
        options={{ title: 'AI Recommendations' }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: 'Size Recommendation' }}
      />
    </Stack.Navigator>
  );
}

// Ecommerce Stack
function ShoppingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false
      }}
    >
      <Stack.Screen
        name="ProductsScreen"
        component={ProductsScreen}
        options={{ title: 'Shop' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Product Details' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <BrandDataProvider>
      <CartProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#3b82f6',
              tabBarInactiveTintColor: '#9ca3af',
              tabBarStyle: {
                borderTopWidth: 1,
                borderTopColor: '#e5e7eb',
                backgroundColor: '#fff',
                height: 60,
                paddingBottom: 8,
                paddingTop: 8
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600'
              }
            }}
          >
            <Tab.Screen
              name="Predictor"
              component={RecommendationStack}
              options={{
                tabBarLabel: 'Fit AI',
                tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎯</Text>
              }}
            />
            <Tab.Screen
              name="StyleAI"
              component={StyleAIScreen}
              options={{
                tabBarLabel: 'Style AI',
                tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🧠</Text>
              }}
            />
            <Tab.Screen
              name="Shopping"
              component={ShoppingStack}
              options={{
                tabBarLabel: 'Shop',
                tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🛍️</Text>
              }}
            />
            <Tab.Screen
              name="Cart"
              component={CartScreen}
              options={{
                tabBarLabel: 'Cart',
                tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🛒</Text>
              }}
            />
            <Tab.Screen
              name="Wishlist"
              component={WishlistScreen}
              options={{
                tabBarLabel: 'Wishlist',
                tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>❤️</Text>
              }}
            />
            <Tab.Screen
              name="OrderHistory"
              component={OrderHistoryScreen}
              options={{
                tabBarLabel: 'Orders',
                tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📦</Text>
              }}
            />
          </Tab.Navigator>

          {/* Admin Modal - if needed */}
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
            options={{ 
              title: 'Brand Data',
              presentation: 'modal'
            }}
          />
        </NavigationContainer>
      </CartProvider>
    </BrandDataProvider>
  );
}
