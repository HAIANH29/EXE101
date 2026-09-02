import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CameraUploadScreen } from '../screens/CameraUploadScreen';
import { HairstyleSelectScreen } from '../screens/HairstyleSelectScreen';
import { TryOnEditorScreen } from '../screens/TryOnEditorScreen';
import { SalonListScreen } from '../screens/SalonListScreen';
import { SalonDetailScreen } from '../screens/SalonDetailScreen';
import { QuickBookingScreen } from '../screens/QuickBookingScreen';
import { BookingStatusScreen } from '../screens/BookingStatusScreen';
import { BookingHistoryScreen } from '../screens/BookingHistoryScreen';
import { SalonDashboardScreen } from '../screens/SalonDashboardScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F172A' },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CameraUpload" component={CameraUploadScreen} />
      <Stack.Screen name="HairstyleSelect" component={HairstyleSelectScreen} />
      <Stack.Screen name="TryOnEditor" component={TryOnEditorScreen} />
      <Stack.Screen name="SalonList" component={SalonListScreen} />
      <Stack.Screen name="SalonDetail" component={SalonDetailScreen} />
      <Stack.Screen name="QuickBooking" component={QuickBookingScreen} />
      <Stack.Screen name="BookingStatus" component={BookingStatusScreen} />
      <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} />
      <Stack.Screen name="SalonDashboard" component={SalonDashboardScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    </Stack.Navigator>
  );
};
