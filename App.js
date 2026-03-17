import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import MeasurementScreen from './MeasurementScreen';
import ResultScreen from './ResultScreen';
import AdminScreen from './AdminScreen';
import { BrandDataProvider } from './BrandDataContext';


const Stack = createStackNavigator();

export default function App() {
  return (
    <BrandDataProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Measurement"
          screenOptions={{ headerTitleAlign: 'center' }}
        >
          <Stack.Screen
            name="Measurement"
            component={MeasurementScreen}
            options={{ title: 'AI Fit Predictor' }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ title: 'Size Recommendation' }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
            options={{ title: 'Brand Data' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BrandDataProvider>
  );
}
