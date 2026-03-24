import 'react-native-gesture-handler';
import * as React from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
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

const COLORS = {
  background: '#f4f6fb',
  card: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  border: '#dbe2ee',
  accent: '#0f766e',
  accentSoft: '#d1fae5'
};

function TabIcon({ emoji, focused }) {
  return (
    <View
      style={{
        minWidth: 40,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        backgroundColor: focused ? COLORS.accentSoft : 'transparent'
      }}
    >
      <Text style={{ fontSize: focused ? 20 : 18 }}>{emoji}</Text>
    </View>
  );
}

function RecommendationStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: COLORS.card },
        headerTitleStyle: {
          color: COLORS.textPrimary,
          fontWeight: '800',
          fontSize: 18,
          letterSpacing: 0.3
        },
        headerTintColor: COLORS.textPrimary,
        headerShadowVisible: false
      }}
    >
      <Stack.Screen name="Measurement" component={MeasurementScreen} options={{ title: 'Home Fit Finder' }} />
      <Stack.Screen
        name="BrandRecommendation"
        component={BrandRecommendationScreen}
        options={{ title: 'AI Recommendations' }}
      />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Size Recommendation' }} />
    </Stack.Navigator>
  );
}

function ShoppingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: COLORS.card },
        headerTitleStyle: {
          color: COLORS.textPrimary,
          fontWeight: '800',
          fontSize: 18,
          letterSpacing: 0.3
        },
        headerTintColor: COLORS.textPrimary,
        headerShadowVisible: false
      }}
    >
      <Stack.Screen name="ProductsScreen" component={ProductsScreen} options={{ title: 'Shop' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
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
                presentation: 'modal',
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: COLORS.card },
                headerTitleStyle: {
                  color: COLORS.textPrimary,
                  fontWeight: '800',
                  fontSize: 18,
                  letterSpacing: 0.3
                },
                headerTintColor: COLORS.textPrimary,
                headerShadowVisible: false
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
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 14,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
          height: 68,
          borderRadius: 22,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#0f172a',
          shadowOpacity: 0.09,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 }
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 2
        }
      }}
    >
      <Tab.Screen
        name="Predictor"
        component={RecommendationStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />
        }}
      />
      <Tab.Screen
        name="StyleAI"
        component={StyleAIScreen}
        options={{
          tabBarLabel: 'Style AI',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingStack}
        options={{
          tabBarLabel: 'Shop',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛍️" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarLabel: 'Wishlist',
          tabBarIcon: ({ focused }) => <TabIcon emoji="❤️" focused={focused} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        cardStyle: { backgroundColor: COLORS.background }
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </AuthStack.Navigator>
  );
}

function AuthGate() {
  const { isInitializing, isAuthenticated } = React.useContext(AuthContext);

  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.background
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View
          style={{
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            paddingVertical: 24,
            paddingHorizontal: 28,
            alignItems: 'center',
            elevation: 4,
            shadowColor: '#0f172a',
            shadowOpacity: 0.06,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 }
          }}
        >
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text
            style={{
              marginTop: 12,
              color: COLORS.textPrimary,
              fontWeight: '800',
              fontSize: 16
            }}
          >
            AI Fit Predictor
          </Text>
          <Text style={{ marginTop: 6, color: COLORS.textSecondary, fontWeight: '600' }}>
            Checking session...
          </Text>
        </View>
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
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <AuthGate />
      </NavigationContainer>
    </AuthProvider>
  );
}
