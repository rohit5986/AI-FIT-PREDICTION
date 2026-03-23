import 'react-native-gesture-handler';
import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MeasurementScreen from './MeasurementScreen';
import BrandRecommendationScreen from './BrandRecommendationScreen';
import ResultScreen from './ResultScreen';
import AdminScreen from './AdminScreen';
import ProductsScreen from './ProductsScreen';
import ProductDetailScreen from './ProductDetailScreen';
import WishlistScreen from './WishlistScreen';
import StyleAIScreen from './StyleAIScreen';
import ProfileScreen from './ProfileScreen';
import LoginScreen from './LoginScreen';
import { BrandDataProvider } from './BrandDataContext';
import { WishlistProvider } from './WishlistContext';
import { UserProfileProvider } from './UserProfileContext';
import { AuthContext, AuthProvider } from './AuthContext';

const Stack = createStackNavigator();
const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();
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
        options={{ title: 'Home Fit Finder' }}
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

function MainTabs() {
  return (
    <BrandDataProvider>
      <UserProfileProvider>
        <WishlistProvider>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Tabs" component={TabNavigator} />
            <RootStack.Screen
              name="Admin"
              component={AdminScreen}
              options={{
                headerShown: true,
                title: 'Brand Data',
                presentation: 'modal'
              }}
            />
          </RootStack.Navigator>
        </WishlistProvider>
      </UserProfileProvider>
    </BrandDataProvider>
  );
}

function TabNavigator() {
  return (
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
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>
        }}
      />
      <Tab.Screen
        name="StyleAI"
        component={StyleAIScreen}
        options={{
          tabBarLabel: 'Style AI',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🧠</Text>
        }}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingStack}
        options={{
          tabBarLabel: 'Shop',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🛍️</Text>
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarLabel: 'Wishlist',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>❤️</Text>
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}

function AuthGate() {
  const { isInitializing, isAuthenticated } = React.useContext(AuthContext);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f5f2' }}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={{ marginTop: 10, color: '#374151', fontWeight: '600' }}>Checking session...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthStackNavigator />;
  }

  return <MainTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AuthGate />
      </NavigationContainer>
    </AuthProvider>
  );
}
